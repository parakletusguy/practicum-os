import "server-only";

import { Prisma, SystemRole } from "@prisma/client";
import { cache } from "react";
import { db } from "@/lib/db";
import { isDemoMode } from "@/lib/runtime-mode";
import { fieldSupervisorScope } from "@/lib/record-access";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export class AuthenticationError extends Error {
  constructor(message = "You must sign in to continue.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to access this resource.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

type AuthenticatedActor = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

/**
 * Maps a verified Supabase identity to an existing application Person.
 * The first matching, verified email link is atomic, so a person cannot be
 * silently rebound to a different Auth account.
 */
export const requireAuthenticatedActor = cache(async (): Promise<AuthenticatedActor> => {
  if (isDemoMode()) {
    throw new AuthenticationError("Demo mode does not provide an authenticated actor.");
  }

  const supabase = await createServerSupabaseClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const authUserId = claimsData?.claims?.sub;

  if (claimsError || typeof authUserId !== "string") {
    throw new AuthenticationError();
  }

  let person = await db.person.findUnique({ where: { authUserId } });
  if (person) {
    if (!person.isActive) throw new AuthorizationError("Your account has been disabled.");
    return person;
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  const email = user?.email?.trim().toLowerCase();
  if (userError || user?.id !== authUserId || !user.email_confirmed_at || !email) {
    throw new AuthenticationError("Your verified account does not have an email address.");
  }

  const existingPerson = await db.person.findUnique({ where: { email } });
  if (!existingPerson?.isActive || existingPerson.authUserId) {
    throw new AuthorizationError("Your account has not been provisioned for PracticumOS.");
  }

  await db.person.updateMany({
    where: { id: existingPerson.id, authUserId: null, isActive: true },
    data: { authUserId },
  });

  person = await db.person.findUnique({ where: { authUserId } });
  if (!person?.isActive) {
    throw new AuthenticationError("Your account link could not be verified.");
  }

  return person;
});

export async function requireTenantRole(
  tenantSlug: string,
  allowedRoles: SystemRole[]
) {
  const actor = await requireAuthenticatedActor();
  const tenant = await db.organisation.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, name: true, slug: true },
  });

  if (!tenant) {
    throw new AuthorizationError("The requested institution does not exist.");
  }

  const hasTenantMembership = await db.orgMembership.findFirst({
    where: {
      personId: actor.id,
      organisationId: tenant.id,
      role: { in: allowedRoles },
      status: "ACTIVE",
    },
    select: { id: true },
  });

  const allowsAssignedFieldSupervisor = !hasTenantMembership && allowedRoles.includes(SystemRole.FIELD_SUPERVISOR)
    ? await db.placementAllocation.findFirst({
        where: fieldSupervisorScope(actor.id, tenant.id),
        select: { id: true },
      })
    : null;

  if (!hasTenantMembership && !allowsAssignedFieldSupervisor) {
    throw new AuthorizationError();
  }

  return { actor, tenant };
}

export async function provisionCommunityActor(profile: { email: string; firstName: string; lastName: string; phone?: string }) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;
  const email = user?.email?.trim().toLowerCase();
  if (error || !user?.email_confirmed_at || !email) throw new AuthenticationError();
  if (email !== profile.email.trim().toLowerCase()) throw new AuthorizationError("Use the email address for your signed-in account.");
  const existing = await db.person.findUnique({ where: { email } });
  if (existing) return requireAuthenticatedActor();

  try {
    return await db.person.create({ data: {
      authUserId: user.id,
      email,
      firstName: profile.firstName.trim(),
      lastName: profile.lastName.trim(),
      phone: profile.phone?.trim() || null,
    } });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    return requireAuthenticatedActor();
  }
}
