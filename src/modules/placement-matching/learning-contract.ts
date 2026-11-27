import "server-only";

import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { fieldSupervisorScope } from "@/lib/record-access";

export const contractRoles = ["student", "field", "faculty"] as const;
export type ContractRole = typeof contractRoles[number];
export const contractRoleLabels: Record<ContractRole, string> = {
  student: "Student",
  field: "Field supervisor",
  faculty: "Faculty supervisor",
};

export async function getLearningContract(
  tenantId: string,
  allocationId: string,
  role: ContractRole,
  actorId: string,
  client: Pick<Prisma.TransactionClient, "placementAllocation" | "auditLog"> = db,
) {
  const scope = role === "field" ? fieldSupervisorScope(actorId, tenantId)
    : role === "faculty" ? { academicSupervisorId: actorId } : { studentPersonId: actorId };
  const allocation = await client.placementAllocation.findFirst({
    where: { AND: [{ id: allocationId, cycle: { tenantId } }, scope] },
    select: {
      id: true, status: true, studentPersonId: true, fieldSupervisorId: true, academicSupervisorId: true,
      hostOrgId: true, hostOrg: { select: { name: true } }, postedAt: true,
      studentPerson: { select: { firstName: true, lastName: true } },
      cycle: { select: { name: true, requiredHours: true, status: true } },
    },
  });
  if (!allocation) return null;

  const signers = { student: allocation.studentPersonId, field: allocation.fieldSupervisorId, faculty: allocation.academicSupervisorId };
  const terms = [
    "The student must keep client identities out of logbooks and evidence. Supervisors must review submitted records for confidentiality.",
    "The student must follow ScopeGuard limits. The field supervisor must provide the required level of supervision and raise any safety concerns with faculty.",
    `The student must record actual practice hours toward the ${allocation.cycle.requiredHours}-hour requirement. The field supervisor verifies hours and the faculty supervisor oversees academic progress.`,
  ];
  const version = createHash("sha256").update(JSON.stringify({
    terms, signers, host: allocation.hostOrgId, postedAt: allocation.postedAt,
  })).digest("hex");
  const actionType = "LEARNING_CONTRACT_SIGNED";
  const logs = await client.auditLog.findMany({
    where: {
      tenantId, resourceType: "PlacementAllocation", resourceId: allocation.id, actionType,
      afterState: { path: ["version"], equals: version },
    },
    select: { actorPersonId: true, afterState: true },
  });
  const signedRoles = contractRoles.filter((party) => logs.some((log) =>
    log.actorPersonId === signers[party] && log.afterState !== null &&
    typeof log.afterState === "object" && !Array.isArray(log.afterState) && log.afterState.role === party,
  ));
  const canSign = new Set(Object.values(signers).filter(Boolean)).size === contractRoles.length &&
    allocation.status === "POSTED" && (allocation.cycle.status === "MATCHING" || allocation.cycle.status === "ACTIVE");

  return { allocation, version, terms, signedRoles, canSign, actionType };
}
