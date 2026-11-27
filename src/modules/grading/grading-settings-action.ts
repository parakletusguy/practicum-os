"use server";

import { revalidatePath } from "next/cache";
import { requirePortalAccess } from "@/lib/portal-access";
import { db } from "@/lib/db";
import { buildGradingFormula } from "./grading-settings";

export async function saveGradingSettingsAction(
  tenantSlug: string, cycleId: string, version: string, _state: { message: string; success: boolean }, form: FormData,
) {
  const { actor, tenant } = await requirePortalAccess(tenantSlug, "admin");
  try {
    const numeric = (value: FormDataEntryValue | null) => typeof value === "string" && value.trim() ? Number(value) : NaN;
    const gradingFormula = { ...buildGradingFormula({
      weights: form.getAll("weight").map(numeric),
      bands: form.getAll("label").map((label, index) => ({ label, minimum: numeric(form.getAll("minimum")[index]) })),
    }) };
    await db.$transaction(async (tx) => {
      const cycle = await tx.practicumCycle.findFirst({
        where: { id: cycleId, tenantId: tenant.id },
        select: { gradingFormula: true, status: true, updatedAt: true, _count: { select: { cohortGrades: true } } },
      });
      if (!cycle) throw new Error("Cycle unavailable.");
      if (cycle.status === "GRADING" || cycle.status === "ARCHIVED" || cycle._count.cohortGrades) {
        throw new Error("Grading settings are locked once grading begins or a result exists.");
      }
      if (cycle.updatedAt.toISOString() !== version) throw new Error("The cycle changed. Refresh before saving.");
      const changed = await tx.practicumCycle.updateMany({
        where: { id: cycleId, tenantId: tenant.id, updatedAt: cycle.updatedAt, status: cycle.status },
        data: { gradingFormula },
      });
      if (changed.count !== 1) throw new Error("The cycle changed. Refresh before saving.");
      await tx.auditLog.create({ data: {
        tenantId: tenant.id, actorPersonId: actor.id, actionType: "CYCLE_GRADING_SETTINGS_UPDATED",
        resourceType: "PracticumCycle", resourceId: cycleId,
        beforeState: cycle.gradingFormula ?? undefined, afterState: gradingFormula,
      } });
    }, { isolationLevel: "Serializable" });
    revalidatePath(`/${tenant.slug}/admin/cycles`);
    revalidatePath(`/${tenant.slug}/admin/grading`);
    revalidatePath(`/${tenant.slug}/admin/cycles/${cycleId}/grading`);
    return { success: true, message: "Grading settings saved." };
  } catch (error) {
    return { success: false, message: error instanceof Error && !("code" in error) ? error.message : "Could not save grading settings. Refresh and try again." };
  }
}
