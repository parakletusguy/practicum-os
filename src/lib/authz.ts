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

export class WorkspaceUnavailableError extends AuthorizationError {}

type AuthenticatedActor = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

export async function linkVerifiedActor(authUserId: string, email: string): Promise<AuthenticatedActor> {
  const existingPerson = await db.person.findUnique({ where: { email } });
  if (!existingPerson?.isActive) throw new AuthorizationError("Your account has not been provisioned for PracticumOS.");
  if (existingPerson.authUserId === authUserId) return existingPerson;
  if (existingPerson.authUserId) throw new AuthorizationError("Your account is already linked to a different identity.");

  await db.person.updateMany({
    where: { id: existingPerson.id, authUserId: null, isActive: true },
    data: { authUserId },
  });
  const linkedPerson = await db.person.findUnique({ where: { id: existingPerson.id } });
  if (!linkedPerson?.isActive || linkedPerson.authUserId !== authUserId) {
    throw new AuthorizationError("Your account link could not be verified.");
  }
  return linkedPerson;
}

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

  const person = await db.person.findUnique({ where: { authUserId } });
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

  return linkVerifiedActor(authUserId, email);
});

export async function requirePlatformAdmin(message?: string) {
  const actor = await requireAuthenticatedActor();
  const membership = await db.orgMembership.findFirst({
    where: { personId: actor.id, status: "ACTIVE", role: "PLATFORM_SUPERADMIN" },
    select: { id: true },
  });
  if (!membership) throw new AuthorizationError(message);
  return actor;
}

export async function requireTenantRole(
  tenantSlug: string,
  allowedRoles: SystemRole[]
) {
  const actor = await requireAuthenticatedActor();
  const tenant = await db.organisation.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, name: true, slug: true, settings: true, verificationStatus: true },
  });

  if (!tenant || tenant.verificationStatus === "SUSPENDED") {
    throw new WorkspaceUnavailableError("The requested institution is unavailable.");
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
