"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { AllocationStatus } from "@prisma/client";

export async function executeMatchingAlgorithmAction(tenantSlug: string, cycleId: string) {
  try {
    // 1. Fetch unmatched students in cycle
    const unmatchedStudents = await db.cohortStudent.findMany({
      where: {
        cycleId,
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
        cycleId,
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
          some: { role: "ACADEMIC_SUPERVISOR" },
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

      // Create Proposed Allocation
      await db.placementAllocation.create({
        data: {
          cycleId,
          cohortStudentId: student.id,
          studentPersonId: student.personId,
          hostOrgId: chosenOffer.hostOrgId,
          placementOfferId: chosenOffer.id,
          academicSupervisorId: facultySupervisor?.id || null,
          status: AllocationStatus.PROPOSED,
        },
      });

      // Update student status
      await db.cohortStudent.update({
        where: { id: student.id },
        data: { status: "MATCHED" },
      });

      // Decrement capacity in memory and DB
      const currentSlots = offersCapacityMap.get(chosenOffer.id) || 1;
      offersCapacityMap.set(chosenOffer.id, currentSlots - 1);

      await db.placementOffer.update({
        where: { id: chosenOffer.id },
        data: { availableSlots: { decrement: 1 } },
      });

      matchedCount++;
    }

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
    const student = await db.cohortStudent.findUnique({
      where: { id: data.cohortStudentId },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
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
        cycleId: data.cycleId,
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
    const allocation = await db.placementAllocation.update({
      where: { id: allocationId },
      data: { status: AllocationStatus.APPROVED },
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
    const result = await db.placementAllocation.updateMany({
      where: {
        cycleId,
        status: AllocationStatus.PROPOSED,
      },
      data: {
        status: AllocationStatus.APPROVED,
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
