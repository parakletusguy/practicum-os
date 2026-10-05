"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { AllocationStatus } from "@prisma/client";

export async function dispatchPostingLettersAction(
  tenantSlug: string,
  cycleId: string
) {
  try {
    const allocationsToPost = await db.placementAllocation.findMany({
      where: {
        cycleId,
        status: { in: [AllocationStatus.APPROVED, AllocationStatus.PROPOSED] },
      },
      include: {
        cycle: true,
      },
    });

    if (allocationsToPost.length === 0) {
      return { success: true, count: 0, message: "No approved allocations waiting for posting." };
    }

    let dispatched = 0;
    const now = new Date();

    for (let i = 0; i < allocationsToPost.length; i++) {
      const alloc = allocationsToPost[i];
      const letterRef =
        alloc.postingLetterRef ||
        `UNILAG/SWK/2026/PL-${String(i + 101).padStart(3, "0")}`;

      await db.placementAllocation.update({
        where: { id: alloc.id },
        data: {
          status: AllocationStatus.ACTIVE,
          postingLetterRef: letterRef,
          postedAt: alloc.postedAt || now,
          startedAt: alloc.startedAt || now,
        },
      });

      // Update student status to PLACED
      await db.cohortStudent.update({
        where: { id: alloc.cohortStudentId },
        data: { status: "PLACED" },
      });

      dispatched++;
    }

    revalidatePath(`/${tenantSlug}/admin/postings`);
    revalidatePath(`/${tenantSlug}/admin/matching`);
    revalidatePath(`/${tenantSlug}/admin`);
    revalidatePath(`/${tenantSlug}/student/placement`);

    return {
      success: true,
      count: dispatched,
      message: `Successfully generated and dispatched ${dispatched} electronic posting letter(s).`,
    };
  } catch (error: any) {
    console.error("Failed to dispatch posting letters:", error);
    return { success: false, error: error.message };
  }
}

export async function acknowledgeLearningContractAction(data: {
  tenantSlug: string;
  allocationId: string;
  studentSignature: string;
}) {
  try {
    const allocation = await db.placementAllocation.findUnique({
      where: { id: data.allocationId },
    });

    if (!allocation) {
      return { success: false, error: "Allocation not found" };
    }

    // Save learning contract acknowledgment in audit log
    await db.auditLog.create({
      data: {
        tenantId: allocation.cycleId,
        actorPersonId: allocation.studentPersonId,
        actionType: "LEARNING_CONTRACT_SIGNED",
        resourceType: "PlacementAllocation",
        resourceId: allocation.id,
        beforeState: {},
        afterState: {
          signedAt: new Date(),
          signature: data.studentSignature,
          contractAgreed: true,
        },
        ipAddress: "127.0.0.1",
        userAgent: "PracticumOS-StudentWorkspace",
      },
    });

    revalidatePath(`/${data.tenantSlug}/student/placement`);
    revalidatePath(`/${data.tenantSlug}/student/guide`);

    return {
      success: true,
      message: "Learning Contract signed and registered with University Field Directorate.",
    };
  } catch (error: any) {
    console.error("Contract signature failed:", error);
    return { success: false, error: error.message };
  }
}
