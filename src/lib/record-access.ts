import type { Prisma } from "@prisma/client";

export function fieldSupervisorScope(actorId: string, tenantId?: string): Prisma.PlacementAllocationWhereInput {
  const membership = { personId: actorId, role: "FIELD_SUPERVISOR", status: "ACTIVE" } as const;
  return {
    fieldSupervisorId: actorId,
    ...(tenantId ? { cycle: { tenantId } } : {}),
    OR: [
      { hostOrg: { memberships: { some: membership } } },
      { cycle: { tenant: { memberships: { some: membership } } } },
    ],
  };
}

export function studentPlacementScope(actorId: string): Prisma.PlacementAllocationWhereInput {
  return {
    studentPersonId: actorId,
    cycle: { tenant: { memberships: { some: { personId: actorId, status: "ACTIVE", role: "STUDENT" } } } },
  };
}

export function allocationRecordScope(actorId: string, tenantId?: string): Prisma.PlacementAllocationWhereInput {
  const activeMembership = { personId: actorId, status: "ACTIVE" };
  return {
    ...(tenantId ? { cycle: { tenantId } } : {}),
    OR: [
      fieldSupervisorScope(actorId, tenantId),
      studentPlacementScope(actorId),
      {
        academicSupervisorId: actorId,
        cycle: { tenant: { memberships: { some: { ...activeMembership, role: "ACADEMIC_SUPERVISOR" } } } },
      },
      {
        cycle: { tenant: { memberships: { some: {
          ...activeMembership,
          role: { in: ["COORDINATOR", "INSTITUTION_ADMIN"] },
        } } } },
      },
    ],
  };
}
