"use server";

import { revalidatePath } from "next/cache";
import { requireTenantRole } from "@/lib/authz";
import { db } from "@/lib/db";

export async function reviewTranscriptCorrectionAction(tenantSlug: string, reference: string, remarks: string) {
  const reason = typeof remarks === "string" ? remarks.trim() : "";
  if (reason.length < 10 || reason.length > 2000) return { success: false, message: "Enter a correction reason of 10 to 2,000 characters." };
  try {
    const { actor, tenant } = await requireTenantRole(tenantSlug, ["COORDINATOR", "INSTITUTION_ADMIN"]);
    const reopened = await db.$transaction(async (tx) => {
      const issued = await tx.auditLog.findUnique({
        where: { id: reference, tenantId: tenant.id, actionType: "TRANSCRIPT_ISSUED" },
        select: { resourceId: true },
      });
      if (!issued) throw new Error("Issued transcript not found.");
      const grade = await tx.cohortGrade.findFirst({
        where: { id: issued.resourceId, cycle: { tenantId: tenant.id, status: "GRADING" }, isApproved: true },
        select: { id: true, updatedAt: true },
      });
      if (!grade) throw new Error("Only approved grades in a grading cycle can be reopened here.");
      const latest = await tx.auditLog.findFirst({
        where: { actionType: "TRANSCRIPT_ISSUED", resourceType: "CohortGrade", resourceId: grade.id, tenantId: tenant.id },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: { id: true },
      });
      if (latest?.id !== reference) throw new Error("Only the current transcript can be corrected.");
      const prior = await tx.auditLog.findFirst({
        where: { tenantId: tenant.id, resourceType: "CohortGrade", resourceId: grade.id, actionType: "TRANSCRIPT_CORRECTION_REQUESTED", afterState: { path: ["reference"], equals: reference } },
        select: { actorPersonId: true },
      });
      if (prior?.actorPersonId === actor.id) throw new Error("A different authorized person must confirm this correction.");
      const changed = await tx.cohortGrade.updateMany({
        where: { id: grade.id, updatedAt: grade.updatedAt, isApproved: true, cycle: { status: "GRADING" } },
        data: prior ? { isApproved: false, approvedAt: null, approvedByPersonId: null } : { updatedAt: new Date() },
      });
      if (changed.count !== 1) throw new Error("The grade changed. Refresh and try again.");
      await tx.auditLog.create({ data: {
        tenantId: tenant.id, actorPersonId: actor.id, resourceType: "CohortGrade", resourceId: grade.id,
        actionType: prior ? "TRANSCRIPT_CORRECTION_AUTHORIZED" : "TRANSCRIPT_CORRECTION_REQUESTED",
        afterState: { reference, reason },
      } });
      return Boolean(prior);
    }, { isolationLevel: "Serializable" });
    revalidatePath(`/${tenant.slug}`, "layout");
    return { success: true, message: reopened ? "Grade reopened. Recalculate and approve it to issue a replacement." : "Correction request recorded. A second authorized person must confirm it." };
  } catch (error) {
    return { success: false, message: error instanceof Error && !("code" in error) ? error.message : "The correction could not be saved. Refresh and try again." };
  }
}
