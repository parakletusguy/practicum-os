import "server-only";

import { SystemRole } from "@prisma/client";
import { db } from "@/lib/db";
import { isDemoMode } from "@/lib/runtime-mode";
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
export async function requireAuthenticatedActor(): Promise<AuthenticatedActor> {
  if (isDemoMode()) {
    throw new AuthenticationError("Demo mode does not provide an authenticated actor.");
  }

  const supabase = createServerSupabaseClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const authUserId = claimsData?.claims?.sub;

  if (claimsError || typeof authUserId !== "string") {
    throw new AuthenticationError();
  }

  let person = await db.person.findUnique({ where: { authUserId } });
  if (person) {
    return person;
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const email = userData.user?.email?.trim().toLowerCase();
  if (userError || !email) {
    throw new AuthenticationError("Your verified account does not have an email address.");
  }

  const existingPerson = await db.person.findUnique({ where: { email } });
  if (!existingPerson || existingPerson.authUserId) {
    throw new AuthorizationError("Your account has not been provisioned for PracticumOS.");
  }

  const linkResult = await db.person.updateMany({
    where: { id: existingPerson.id, authUserId: null },
    data: { authUserId },
  });

  if (linkResult.count !== 1) {
    throw new AuthorizationError("Your account could not be linked safely. Please contact an administrator.");
  }

  person = await db.person.findUnique({ where: { authUserId } });
  if (!person) {
    throw new AuthenticationError("Your account link could not be verified.");
  }

  return person;
}

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

  const allowsAssignedFieldSupervisor = allowedRoles.includes(SystemRole.FIELD_SUPERVISOR)
    ? await db.placementAllocation.findFirst({
        where: {
          fieldSupervisorId: actor.id,
          cycle: { tenantId: tenant.id },
        },
        select: { id: true },
      })
    : null;

  if (!hasTenantMembership && !allowsAssignedFieldSupervisor) {
    throw new AuthorizationError();
  }

  return { actor, tenant };
}
