"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { AllocationStatus, SystemRole } from "@prisma/client";
import { requireTenantRole } from "@/lib/authz";
import { isDemoMode } from "@/lib/runtime-mode";

const MATCHING_ADMIN_ROLES = [SystemRole.COORDINATOR, SystemRole.INSTITUTION_ADMIN];

export async function executeMatchingAlgorithmAction(tenantSlug: string, cycleId: string) {
  try {
    const cycle = await db.practicumCycle.findFirst({
      where: { id: cycleId, tenant: { slug: tenantSlug } },
      select: { id: true, tenantId: true },
    });
    if (!cycle) {
      return { success: false, error: "Practicum cycle not found for this institution." };
    }
    const authorization = !isDemoMode()
      ? await requireTenantRole(tenantSlug, MATCHING_ADMIN_ROLES)
      : null;

    // 1. Fetch unmatched students in cycle
    const unmatchedStudents = await db.cohortStudent.findMany({
      where: {
        cycleId: cycle.id,
        allocation: null, // No allocation yet
      },
      include: {
        person: true,
      },
    });

    if (unmatchedStudents.length === 0) {
      return { success: true, count: 0, message: "No unmatched students found" };
    }

    // 2. Fetch placement offers with available capacity
    const offers = await db.placementOffer.findMany({
      where: {
        cycleId: cycle.id,
        availableSlots: { gt: 0 },
      },
      include: {
        hostOrg: true,
      },
      orderBy: {
        availableSlots: "desc",
      },
    });

    if (offers.length === 0) {
      return { success: false, error: "No placement offers with available capacity found" };
    }

    // 3. Find default faculty supervisor for cycle if available
    const facultySupervisor = await db.person.findFirst({
      where: {
        roleMemberships: {
          some: {
            organisationId: cycle.tenantId,
            role: SystemRole.ACADEMIC_SUPERVISOR,
            status: "ACTIVE",
          },
        },
      },
    });

    let matchedCount = 0;
    const offersCapacityMap = new Map(offers.map((o) => [o.id, o.availableSlots]));

    // 4. Distribute students
    for (const student of unmatchedStudents) {
      // Find best offer: first check for specialty match, fallback to highest available slot
      let chosenOffer = offers.find((o) => {
        const slotsLeft = offersCapacityMap.get(o.id) || 0;
        if (slotsLeft <= 0) return false;
        // Check if student's specialty matches any practice areas
        return o.practiceAreas.some((area) =>
          student.specialty?.toLowerCase().includes(area.toLowerCase()) ||
          area.toLowerCase().includes(student.specialty?.toLowerCase() || "")
        );
      });

      // Fallback: take any available offer with capacity
      if (!chosenOffer) {
        chosenOffer = offers.find((o) => (offersCapacityMap.get(o.id) || 0) > 0);
      }

      if (!chosenOffer) {
        // All capacity exhausted
        break;
      }

      const currentSlots = offersCapacityMap.get(chosenOffer.id) || 1;
      try {
        const matched = await db.$transaction(async (tx) => {
          // The conditional update makes capacity enforcement safe if two
          // coordinators start matching at the same time.
          const capacity = await tx.placementOffer.updateMany({
            where: { id: chosenOffer.id, availableSlots: { gt: 0 } },
            data: { availableSlots: { decrement: 1 } },
          });
          if (capacity.count !== 1) return false;

          await tx.placementAllocation.create({
            data: {
              cycleId: cycle.id,
              cohortStudentId: student.id,
              studentPersonId: student.personId,
              hostOrgId: chosenOffer.hostOrgId,
              placementOfferId: chosenOffer.id,
              academicSupervisorId: facultySupervisor?.id || null,
              status: AllocationStatus.PROPOSED,
            },
          });
          await tx.cohortStudent.update({
            where: { id: student.id },
            data: { status: "MATCHED" },
          });
          return true;
        });
        if (!matched) {
          offersCapacityMap.set(chosenOffer.id, 0);
          continue;
        }
        offersCapacityMap.set(chosenOffer.id, currentSlots - 1);
        matchedCount++;
      } catch (error) {
        console.error("Skipping a student whose allocation changed during matching", { studentId: student.id, error });
      }
    }

    await db.auditLog.create({
      data: {
        tenantId: cycle.tenantId,
        actorPersonId: authorization?.actor.id,
        actionType: "MATCHING_ALGORITHM_EXECUTED",
        resourceType: "PracticumCycle",
        resourceId: cycle.id,
        afterState: { matchedCount },
      },
    });

    revalidatePath(`/${tenantSlug}/admin/matching`);
    revalidatePath(`/${tenantSlug}/admin/postings`);
    revalidatePath(`/${tenantSlug}/admin`);

    return {
      success: true,
      count: matchedCount,
      message: `Successfully matched ${matchedCount} student(s) to appropriate practice agencies.`,
    };
  } catch (error: any) {
    console.error("Matching algorithm failed:", error);
    return { success: false, error: error.message };
  }
}

export async function manualAllocateStudentAction(data: {
  tenantSlug: string;
  cycleId: string;
  cohortStudentId: string;
  hostOrgId: string;
  placementOfferId?: string;
  academicSupervisorId?: string;
  fieldSupervisorId?: string;
}) {
  try {
    const cycle = await db.practicumCycle.findFirst({
      where: { id: data.cycleId, tenant: { slug: data.tenantSlug } },
      select: { id: true, tenantId: true },
    });
    if (!cycle) {
      return { success: false, error: "Practicum cycle not found for this institution." };
    }
    const authorization = !isDemoMode()
      ? await requireTenantRole(data.tenantSlug, MATCHING_ADMIN_ROLES)
      : null;
    const student = await db.cohortStudent.findFirst({
      where: { id: data.cohortStudentId, cycleId: cycle.id },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }
    const hostOrganisation = await db.organisation.findFirst({
      where: { id: data.hostOrgId, tenantId: cycle.tenantId },
      select: { id: true },
    });
    if (!hostOrganisation) {
      return { success: false, error: "Placement agency not found for this institution." };
    }
    if (data.placementOfferId) {
      const offer = await db.placementOffer.findFirst({
        where: { id: data.placementOfferId, cycleId: cycle.id, hostOrgId: hostOrganisation.id },
        select: { id: true },
      });
      if (!offer) return { success: false, error: "Placement offer does not match this student and agency." };
    }
    if (data.academicSupervisorId) {
      const supervisor = await db.orgMembership.findFirst({
        where: {
          personId: data.academicSupervisorId,
          organisationId: cycle.tenantId,
          role: SystemRole.ACADEMIC_SUPERVISOR,
          status: "ACTIVE",
        },
        select: { id: true },
      });
      if (!supervisor) return { success: false, error: "Academic supervisor is not active for this institution." };
    }
    if (data.fieldSupervisorId) {
      const supervisor = await db.orgMembership.findFirst({
        where: {
          personId: data.fieldSupervisorId,
          organisationId: { in: [cycle.tenantId, hostOrganisation.id] },
          role: SystemRole.FIELD_SUPERVISOR,
          status: "ACTIVE",
        },
        select: { id: true },
      });
      if (!supervisor) return { success: false, error: "Field supervisor is not active for this placement agency." };
    }

    // Upsert allocation
    const allocation = await db.placementAllocation.upsert({
      where: { cohortStudentId: data.cohortStudentId },
      update: {
        hostOrgId: data.hostOrgId,
        placementOfferId: data.placementOfferId || null,
        academicSupervisorId: data.academicSupervisorId || null,
        fieldSupervisorId: data.fieldSupervisorId || null,
        status: AllocationStatus.APPROVED,
      },
      create: {
        cycleId: cycle.id,
        cohortStudentId: data.cohortStudentId,
        studentPersonId: student.personId,
        hostOrgId: data.hostOrgId,
        placementOfferId: data.placementOfferId || null,
        academicSupervisorId: data.academicSupervisorId || null,
        fieldSupervisorId: data.fieldSupervisorId || null,
        status: AllocationStatus.APPROVED,
      },
    });

    await db.cohortStudent.update({
      where: { id: data.cohortStudentId },
      data: { status: "MATCHED" },
    });

    await db.auditLog.create({
      data: {
        tenantId: cycle.tenantId,
        actorPersonId: authorization?.actor.id,
        actionType: "ALLOCATION_MANUALLY_ASSIGNED",
        resourceType: "PlacementAllocation",
        resourceId: allocation.id,
        afterState: { cohortStudentId: student.id, hostOrgId: hostOrganisation.id },
      },
    });

    revalidatePath(`/${data.tenantSlug}/admin/matching`);
    revalidatePath(`/${data.tenantSlug}/admin/postings`);
    revalidatePath(`/${data.tenantSlug}/admin`);
    return { success: true, allocation };
  } catch (error: any) {
    console.error("Manual allocation failed:", error);
    return { success: false, error: error.message };
  }
}

export async function approveAllocationAction(
  tenantSlug: string,
  allocationId: string
) {
  try {
    const allocation = await db.placementAllocation.findFirst({
      where: { id: allocationId, cycle: { tenant: { slug: tenantSlug } } },
      select: { id: true, status: true, cycle: { select: { tenantId: true } } },
    });
    if (!allocation) return { success: false, error: "Allocation not found for this institution." };
    const authorization = !isDemoMode()
      ? await requireTenantRole(tenantSlug, MATCHING_ADMIN_ROLES)
      : null;
    if (allocation.status !== AllocationStatus.PROPOSED) {
      return { success: false, error: "Only proposed allocations can be approved." };
    }
    const updated = await db.placementAllocation.update({
      where: { id: allocation.id },
      data: { status: AllocationStatus.APPROVED },
    });
    await db.auditLog.create({
      data: {
        tenantId: allocation.cycle.tenantId,
        actorPersonId: authorization?.actor.id,
        actionType: "ALLOCATION_APPROVED",
        resourceType: "PlacementAllocation",
        resourceId: allocation.id,
        beforeState: { status: allocation.status },
        afterState: { status: AllocationStatus.APPROVED },
      },
    });

    revalidatePath(`/${tenantSlug}/admin/matching`);
    revalidatePath(`/${tenantSlug}/admin/postings`);
    return { success: true, allocation };
  } catch (error: any) {
    console.error("Approve allocation failed:", error);
    return { success: false, error: error.message };
  }
}

export async function approveAllProposedAllocationsAction(
  tenantSlug: string,
  cycleId: string
) {
  try {
    const cycle = await db.practicumCycle.findFirst({
      where: { id: cycleId, tenant: { slug: tenantSlug } },
      select: { id: true, tenantId: true },
    });
    if (!cycle) return { success: false, error: "Practicum cycle not found for this institution." };
    const authorization = !isDemoMode()
      ? await requireTenantRole(tenantSlug, MATCHING_ADMIN_ROLES)
      : null;
    const result = await db.placementAllocation.updateMany({
      where: {
        cycleId: cycle.id,
        status: AllocationStatus.PROPOSED,
      },
      data: {
        status: AllocationStatus.APPROVED,
      },
    });

    await db.auditLog.create({
      data: {
        tenantId: cycle.tenantId,
        actorPersonId: authorization?.actor.id,
        actionType: "ALLOCATIONS_BATCH_APPROVED",
        resourceType: "PracticumCycle",
        resourceId: cycle.id,
        afterState: { count: result.count },
      },
    });

    revalidatePath(`/${tenantSlug}/admin/matching`);
    revalidatePath(`/${tenantSlug}/admin/postings`);
    revalidatePath(`/${tenantSlug}/admin`);

    return {
      success: true,
      count: result.count,
      message: `Approved all ${result.count} proposed placement allocations. Ready for posting dispatch.`,
    };
  } catch (error: any) {
    console.error("Batch approve failed:", error);
    return { success: false, error: error.message };
  }
}
