"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertEmailDeliveryConfigured, sendEmailWithResend } from "@/lib/email/resend";
import { getSupabasePublicConfig, isDemoMode } from "@/lib/runtime-mode";
import { afterInstitutionSignIn, isRsuEmail } from "@/lib/sign-in";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AuthorizationError, linkVerifiedActor } from "@/lib/authz";

const emailSchema = z.string().trim().toLowerCase().email().max(254);
const tokenSchema = z.string().trim().regex(/^\d{6,10}$/);
const instruction = "If this email is eligible, a sign-in code will arrive shortly. Check your spam folder if needed.";
const unavailable = "Sign-in email is temporarily unavailable. Contact your practicum office or try again later.";

function findPersonForSignIn(email: string) {
  return db.person.findUnique({
    where: { email },
    select: { id: true, isActive: true, roleMemberships: {
      where: { status: "ACTIVE" },
      select: { role: true, organisation: { select: { slug: true } } },
    } },
  });
}

async function reserveRsuRequest() {
  const requestHeaders = await headers();
  const address = requestHeaders.get("x-vercel-forwarded-for")?.split(",")[0].trim() || "unavailable";
  const bucket = Math.floor(Date.now() / 600000);
  const scope = createHash("sha256").update(`rsu-signup:${address}:${bucket}`).digest("hex");
  for (let slot = 0; slot < 5; slot++) {
    const reservation = await db.auditLog.createMany({
      data: [{ id: `${scope}:${slot}`, actionType: "RSU_SIGNUP_RATE_LIMIT", resourceType: "PilotSignIn", resourceId: scope }],
      skipDuplicates: true,
    });
    if (reservation.count) return true;
  }
  return false;
}

export async function requestInstitutionCodeAction(rawEmail: string, institution?: string) {
  const email = emailSchema.safeParse(rawEmail);
  if (!email.success) return { success: false, message: "Enter a valid email address." };
  if (isDemoMode()) return { success: false, message: "Institutional sign-in requires the live workspace." };
  const config = getSupabasePublicConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!config || !serviceKey) return { success: false, message: unavailable };

  try {
    assertEmailDeliveryConfigured();
    const person = await findPersonForSignIn(email.data);
    const rsuSignUp = institution === "rsu" && isRsuEmail(email.data);
    if (person?.isActive === false || (!person?.roleMemberships.length && !rsuSignUp)) return { success: true, message: instruction };
    if (!person?.roleMemberships.length && !await reserveRsuRequest()) {
      return { success: false, message: "Too many new account requests. Wait a few minutes and try again." };
    }

    const bucket = Math.floor(Date.now() / 90000);
    const requestId = createHash("sha256").update(`institution-code:${email.data}:${bucket}`).digest("hex");
    const reservation = await db.auditLog.createMany({
      data: [{ id: requestId, resourceType: person ? "Person" : "PilotSignIn", resourceId: person?.id ?? requestId, actionType: "INSTITUTION_CODE_REQUESTED" }],
      skipDuplicates: true,
    });
    if (!reservation.count) return { success: true, message: instruction };

    const supabase = createClient(config.url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.auth.admin.generateLink({ type: "magiclink", email: email.data });
    const token = tokenSchema.safeParse(data?.properties?.email_otp);
    if (error || !token.success) {
      console.error("Institutional sign-in code could not be generated", error?.code ?? "invalid_token");
      return { success: false, message: unavailable };
    }

    const text = `Your PracticumOS sign-in code is ${token.data}. Enter it on the sign-in page. If you did not request it, you can ignore this email.`;
    const providerId = await sendEmailWithResend({ to: email.data, subject: "Your PracticumOS sign-in code", text,
      html: `<p>Your PracticumOS sign-in code is <strong>${token.data}</strong>.</p><p>Enter it on the sign-in page. If you did not request it, you can ignore this email.</p>`,
      idempotencyKey: `institution-code/${requestId}`,
    });
    await db.auditLog.create({ data: {
      resourceType: person ? "Person" : "PilotSignIn", resourceId: person?.id ?? requestId,
      actionType: "INSTITUTION_CODE_EMAIL_ACCEPTED", afterState: { providerId },
    } }).catch(() => console.error("Sign-in email accepted without a delivery audit record"));
    return { success: true, message: instruction };
  } catch (error) {
    console.error("Institutional sign-in delivery failed", error instanceof Error ? error.name : "unknown");
    return { success: false, message: unavailable };
  }
}

export async function confirmInstitutionCodeAction(rawEmail: string, rawToken: string, next: string, institution?: string) {
  const email = emailSchema.safeParse(rawEmail);
  const token = tokenSchema.safeParse(rawToken);
  const invalid = "That code is invalid or expired. Check the code or request a new one.";
  if (!email.success || !token.success || isDemoMode()) return { success: false, message: invalid };
  try {
    const person = await findPersonForSignIn(email.data);
    const rsuSignUp = institution === "rsu" && isRsuEmail(email.data);
    if (person?.isActive === false || (!person?.roleMemberships.length && !rsuSignUp)) return { success: false, message: invalid };
    const supabase = await createServerSupabaseClient();
    const result = await supabase.auth.verifyOtp({ email: email.data, token: token.data, type: "email" });
    if (result.error || !result.data.session) return { success: false, message: invalid };
    const user = result.data.user;
    if (!user?.email_confirmed_at || user.email?.toLowerCase() !== email.data) {
      return { success: false, message: invalid };
    }
    const hasRsuMembership = person?.roleMemberships.some(({ organisation }) => organisation.slug === "rsu");
    const isPlatformAdmin = person?.roleMemberships.some(({ role }) => role === "PLATFORM_SUPERADMIN") ?? false;
    if (rsuSignUp && !hasRsuMembership && !isPlatformAdmin) {
      const tenant = await db.organisation.findUnique({ where: { slug: "rsu" }, select: { id: true } });
      if (!tenant) return { success: false, message: "The RSU workspace has not been set up yet." };
      await db.auditLog.createMany({
        data: [{
          id: createHash("sha256").update(`rsu-access:${user.id}:${email.data}`).digest("hex"),
          tenantId: tenant.id, actionType: "RSU_PILOT_ACCESS_REQUESTED", resourceType: "AuthIdentity", resourceId: user.id,
          afterState: { email: email.data },
        }],
        skipDuplicates: true,
      });
      return { success: true, destination: "/rsu/access-requested" };
    }
    await linkVerifiedActor(user.id, email.data);
    return { success: true, destination: afterInstitutionSignIn(next, isPlatformAdmin) };
  } catch (error) {
    if (error instanceof AuthorizationError) return { success: false, message: "The email was verified, but its workspace access could not be confirmed. Contact your practicum office." };
    console.error("Institutional sign-in verification failed", error instanceof Error ? error.name : "unknown");
    return { success: false, message: "Could not verify sign-in right now. Try again shortly." };
  }
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/auth/login");
}
