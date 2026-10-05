"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { CycleDurationType, CycleStatus } from "@prisma/client";

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

    const cycle = await db.practicumCycle.create({
      data: {
        tenantId: tenant.id,
        programmeId: data.programmeId || null,
        name: data.name,
        academicYear: data.academicYear,
        durationType: data.durationType,
        requiredHours: Number(data.requiredHours) || 400,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
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
    const updated = await db.practicumCycle.update({
      where: { id: cycleId },
      data: { status: newStatus },
    });

    revalidatePath(`/${tenantSlug}/admin/cycles`);
    revalidatePath(`/${tenantSlug}/admin`);
    return { success: true, cycle: updated };
  } catch (error: any) {
    console.error("Failed to update cycle status:", error);
    return { success: false, error: error.message };
  }
}
