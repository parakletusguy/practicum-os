import "server-only";

import type { Prisma } from "@prisma/client";
import { AuthorizationError, requireAuthenticatedActor } from "@/lib/authz";
import { db } from "@/lib/db";
import { fieldSupervisorScope } from "@/lib/record-access";
import { isDemoMode } from "@/lib/runtime-mode";

export async function requireCommunityMatcher() {
  if (isDemoMode()) return null;
  const actor = await requireAuthenticatedActor();
  const membership = await db.orgMembership.findFirst({
    where: { personId: actor.id, status: "ACTIVE", role: "PLATFORM_SUPERADMIN" },
    select: { id: true },
  });
  if (!membership) throw new AuthorizationError("Only a designated platform administrator may access the care-matching desk.");
  return actor;
}

export async function communityRecipientTargets(
  actorId: string,
  client: Pick<Prisma.TransactionClient, "serviceProvider" | "orgMembership" | "placementAllocation"> = db,
) {
  const [providers, agencies, allocations] = await Promise.all([
    client.serviceProvider.findMany({ where: { personId: actorId, verifiedStatus: "VERIFIED" }, select: { id: true } }),
    client.orgMembership.findMany({
      where: { personId: actorId, role: "AGENCY_COORDINATOR", status: "ACTIVE", organisation: { verificationStatus: "VERIFIED" } },
      select: { organisationId: true },
    }),
    client.placementAllocation.findMany({
      where: { status: "ACTIVE", ...fieldSupervisorScope(actorId) },
      select: { id: true },
    }),
  ]);
  return [
    ...providers.map(({ id }) => ({ type: "SERVICE_PROVIDER", id })),
    ...agencies.map(({ organisationId }) => ({ type: "ORGANISATION", id: organisationId })),
    ...allocations.map(({ id }) => ({ type: "STUDENT_ALLOCATION", id })),
  ];
}
