"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { AuthenticationError, AuthorizationError } from "@/lib/authz";
import { z } from "zod";
import { requirePortalAccess } from "@/lib/portal-access";
import { db } from "@/lib/db";
import { contractAmendmentAction, contractRoles, getLearningContract, type ContractRole } from "./learning-contract";

export async function signLearningContractAction(data: {
  tenantSlug: string;
  allocationId: string;
  role: ContractRole;
  version: string;
  signature: string;
  agreed: boolean;
}) {
  if (!contractRoles.includes(data.role) || !data.agreed || typeof data.signature !== "string" || !data.signature.trim() || data.signature.trim().length > 200) {
    return { success: false, message: "Confirm agreement and enter your name to sign." };
  }
  const { actor, tenant } = await requirePortalAccess(data.tenantSlug, data.role);
  try {
    const active = await db.$transaction(async (tx) => {
      const contract = await getLearningContract(tenant.id, data.allocationId, data.role, actor.id, tx);
      if (!contract || contract.version !== data.version) throw new AuthorizationError("The contract is unavailable or has changed. Refresh to see the current version.");
      if (contract.signedRoles.includes(data.role)) return contract.allocation.status === "ACTIVE";
      if (!contract.canSign) throw new AuthorizationError("The contract can be signed once the placement is posted and three distinct signatories are assigned.");

      const complete = contract.signedRoles.length === contractRoles.length - 1;
      const changed = await tx.placementAllocation.updateMany({
        where: { id: contract.allocation.id, updatedAt: contract.allocation.updatedAt, status: "POSTED", cycle: { status: { in: ["MATCHING", "ACTIVE"] } } },
        data: complete ? { status: "ACTIVE", startedAt: contract.allocation.startedAt ?? new Date() } : { updatedAt: new Date() },
      });
      if (changed.count !== 1) throw new AuthorizationError("The placement changed. Refresh to see its status.");
      await tx.auditLog.create({ data: {
        tenantId: tenant.id,
        actorPersonId: actor.id,
        actionType: contract.actionType,
        resourceType: "PlacementAllocation",
        resourceId: contract.allocation.id,
        afterState: {
          role: data.role,
          version: contract.version,
          terms: contract.terms,
          signatureHash: createHash("sha256").update(data.signature.trim()).digest("hex"),
          contractAgreed: true,
          placementActivated: complete,
        },
      } });
      return complete;
    }, { isolationLevel: "Serializable" });
    revalidatePath(`/${tenant.slug}`, "layout");
    return { success: true, message: active ? "All parties have signed. The placement is active." : "Signature recorded. Other signatures are still pending." };
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) return { success: false, message: error.message };
    console.error("Unable to record contract signature", error);
    return { success: false, message: "The signature could not be recorded. Refresh and try again." };
  }
}

const amendmentInput = z.object({ addendum: z.string().trim().min(10).max(4000), reason: z.string().trim().min(10).max(1000) });

export async function issueContractAmendmentAction(
  tenantSlug: string, allocationId: string, expectedVersion: string,
  _state: { success: boolean; message: string }, form: FormData,
) {
  const parsed = amendmentInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { success: false, message: "Enter the revised addendum and a reason of at least 10 characters each." };
  const { actor, tenant } = await requirePortalAccess(tenantSlug, "admin");
  try {
    await db.$transaction(async (tx) => {
      const contract = await getLearningContract(tenant.id, allocationId, "admin", actor.id, tx);
      if (!contract || !contract.canAmend || contract.version !== expectedVersion) {
        throw new AuthorizationError("This contract has changed or is unavailable for amendments.");
      }
      const changed = await tx.placementAllocation.updateMany({
        where: {
          id: allocationId, updatedAt: contract.allocation.updatedAt, status: { in: ["POSTED", "ACTIVE"] },
          cycle: { tenantId: tenant.id, status: { in: ["MATCHING", "ACTIVE"] } },
        },
        data: { status: "POSTED", updatedAt: new Date() },
      });
      if (changed.count !== 1) throw new AuthorizationError("The placement changed. Refresh before issuing the amendment.");
      await tx.auditLog.create({ data: {
        tenantId: tenant.id, actorPersonId: actor.id, actionType: contractAmendmentAction,
        resourceType: "PlacementAllocation", resourceId: allocationId,
        beforeState: { version: contract.version, terms: contract.terms, signedRoles: contract.signedRoles },
        afterState: parsed.data,
      } });
    }, { isolationLevel: "Serializable" });
    revalidatePath(`/${tenant.slug}`, "layout");
    return { success: true, message: "Amendment issued. All three signatories must sign the new version." };
  } catch (error) {
    return { success: false, message: error instanceof AuthorizationError ? error.message : "Could not issue the amendment. Refresh and try again." };
  }
}
