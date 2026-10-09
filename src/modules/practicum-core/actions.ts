"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { CycleDurationType, CycleStatus, SystemRole } from "@prisma/client";
import { requireTenantRole } from "@/lib/authz";
import { isDemoMode } from "@/lib/runtime-mode";
import { canTransitionCycle } from "./workflow-policy";

const CYCLE_ADMIN_ROLES = [SystemRole.COORDINATOR, SystemRole.INSTITUTION_ADMIN];

export async function createCycleAction(data: {
  tenantSlug: string;
  programmeId?: string;
  name: string;
  academicYear: string;
  durationType: CycleDurationType;
  requiredHours: number;
  startDate: string;
  endDate: string;
  welcomeMessage?: string;
  scopeGuardRules?: { activity: string; allowedScope: string }[];
}) {
  try {
    const tenant = await db.organisation.findUnique({
      where: { slug: data.tenantSlug },
    });

    if (!tenant) {
      return { success: false, error: "Tenant organisation not found" };
    }
    const authorization = !isDemoMode()
      ? await requireTenantRole(data.tenantSlug, CYCLE_ADMIN_ROLES)
      : null;

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      return { success: false, error: "Provide a valid cycle start and end date." };
    }
    if (!Number.isInteger(Number(data.requiredHours)) || Number(data.requiredHours) < 1) {
      return { success: false, error: "Required hours must be a positive whole number." };
    }

    if (data.programmeId) {
      const programme = await db.programme.findFirst({
        where: { id: data.programmeId, department: { organisationId: tenant.id } },
        select: { id: true },
      });
      if (!programme) {
        return { success: false, error: "Programme not found for this institution." };
      }
    }

    const cycle = await db.practicumCycle.create({
      data: {
        tenantId: tenant.id,
        programmeId: data.programmeId || null,
        name: data.name,
        academicYear: data.academicYear,
        durationType: data.durationType,
        requiredHours: Number(data.requiredHours) || 400,
        startDate,
        endDate,
        status: CycleStatus.PLANNING,
        eGuideConfig: {
          welcomeMessage: data.welcomeMessage || "Welcome to your supervised practicum cycle.",
          weeklyTargetHours: 25,
        },
        scopeGuardRules: data.scopeGuardRules || [
          { activity: "Unaccompanied High-Risk Home Visit", allowedScope: "DIRECT_SUPERVISION" },
          { activity: "Court Representation / Legal Deposition", allowedScope: "DIRECT_SUPERVISION" },
          { activity: "Routine Intake & Case Review", allowedScope: "INDEPENDENT" },
        ],
      },
    });

    await db.auditLog.create({
      data: {
        tenantId: tenant.id,
        actorPersonId: authorization?.actor.id,
        actionType: "PRACTICUM_CYCLE_CREATED",
        resourceType: "PracticumCycle",
        resourceId: cycle.id,
        afterState: { name: cycle.name, academicYear: cycle.academicYear, status: cycle.status },
      },
    });

    revalidatePath(`/${data.tenantSlug}/admin/cycles`);
    revalidatePath(`/${data.tenantSlug}/admin`);
    return { success: true, cycle };
  } catch (error: any) {
    console.error("Failed to create practicum cycle:", error);
    return { success: false, error: error.message || "Failed to create cycle" };
  }
}

export async function updateCycleStatusAction(
  tenantSlug: string,
  cycleId: string,
  newStatus: CycleStatus
) {
  try {
    const cycle = await db.practicumCycle.findFirst({
      where: { id: cycleId, tenant: { slug: tenantSlug } },
      select: { id: true, tenantId: true, status: true },
    });
    if (!cycle) {
      return { success: false, error: "Practicum cycle not found for this institution." };
    }
    const authorization = !isDemoMode()
      ? await requireTenantRole(tenantSlug, CYCLE_ADMIN_ROLES)
      : null;
    if (!Object.values(CycleStatus).includes(newStatus)) {
      return { success: false, error: "Invalid practicum cycle status." };
    }
    if (!canTransitionCycle(cycle.status, newStatus)) {
      return { success: false, error: `Cannot change a ${cycle.status} cycle directly to ${newStatus}.` };
    }

    const updated = await db.practicumCycle.update({
      where: { id: cycle.id },
      data: { status: newStatus },
    });
    await db.auditLog.create({
      data: {
        tenantId: cycle.tenantId,
        actorPersonId: authorization?.actor.id,
        actionType: "PRACTICUM_CYCLE_STATUS_CHANGED",
        resourceType: "PracticumCycle",
        resourceId: cycle.id,
        beforeState: { status: cycle.status },
        afterState: { status: newStatus },
      },
    });

    revalidatePath(`/${tenantSlug}/admin/cycles`);
    revalidatePath(`/${tenantSlug}/admin`);
    return { success: true, cycle: updated };
  } catch (error: any) {
    console.error("Failed to update cycle status:", error);
    return { success: false, error: error.message };
  }
}
