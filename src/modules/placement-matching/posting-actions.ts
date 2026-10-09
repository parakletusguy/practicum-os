"use server";

import { revalidatePath } from "next/cache";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { AllocationStatus, SystemRole } from "@prisma/client";
import { AuthorizationError, requireAuthenticatedActor, requireTenantRole } from "@/lib/authz";
import { isDemoMode } from "@/lib/runtime-mode";

export async function dispatchPostingLettersAction(
  tenantSlug: string,
  cycleId: string
) {
  try {
    if (!isDemoMode()) {
      await requireTenantRole(tenantSlug, [SystemRole.COORDINATOR, SystemRole.INSTITUTION_ADMIN]);
    }
    const cycle = await db.practicumCycle.findFirst({
      where: { id: cycleId, tenant: { slug: tenantSlug } },
      select: { id: true },
    });
    if (!cycle) {
      return { success: false, error: "Practicum cycle not found for this institution." };
    }

    const allocationsToPost = await db.placementAllocation.findMany({
      where: {
        cycleId: cycle.id,
        status: AllocationStatus.APPROVED,
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
          // Generating a posting reference is not evidence of delivery or of
          // the student beginning placement. Those states remain separate.
          status: AllocationStatus.POSTED,
          postingLetterRef: letterRef,
          postedAt: alloc.postedAt || now,
        },
      });

      // Update student status to PLACED
      await db.cohortStudent.update({
        where: { id: alloc.cohortStudentId },
        data: { status: "PLACED" },
      });

      dispatched++;
    }

    const actor = !isDemoMode() ? await requireAuthenticatedActor() : null;
    const tenant = await db.organisation.findUnique({ where: { slug: tenantSlug }, select: { id: true } });
    if (tenant) {
      await db.auditLog.create({
        data: {
          tenantId: tenant.id,
          actorPersonId: actor?.id,
          actionType: "POSTING_REFERENCES_GENERATED",
          resourceType: "PracticumCycle",
          resourceId: cycle.id,
          afterState: { count: dispatched },
        },
      });
    }

    revalidatePath(`/${tenantSlug}/admin/postings`);
    revalidatePath(`/${tenantSlug}/admin/matching`);
    revalidatePath(`/${tenantSlug}/admin`);
    revalidatePath(`/${tenantSlug}/student/placement`);

    return {
      success: true,
      count: dispatched,
      message: `Generated ${dispatched} posting reference(s). Delivery is not recorded by this preview workflow.`,
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
    if (!data.studentSignature.trim()) {
      return { success: false, error: "A signature is required to acknowledge the learning contract." };
    }
    const allocation = await db.placementAllocation.findUnique({
      where: { id: data.allocationId },
      include: { cycle: true },
    });

    if (!allocation) {
      return { success: false, error: "Allocation not found" };
    }

    const tenant = await db.organisation.findUnique({ where: { slug: data.tenantSlug } });
    if (!tenant || allocation.cycle.tenantId !== tenant.id) {
      return { success: false, error: "Allocation not found for this institution." };
    }
    if (allocation.status !== AllocationStatus.POSTED && allocation.status !== AllocationStatus.ACTIVE) {
      return { success: false, error: "A learning contract can only be acknowledged after posting." };
    }
    const previousAcknowledgement = await db.auditLog.findFirst({
      where: {
        tenantId: tenant.id,
        resourceType: "PlacementAllocation",
        resourceId: allocation.id,
        actionType: "LEARNING_CONTRACT_SIGNED",
      },
      select: { id: true },
    });
    if (previousAcknowledgement) {
      return { success: false, error: "This learning contract has already been acknowledged." };
    }
    let actorPersonId = allocation.studentPersonId;
    if (!isDemoMode()) {
      const actor = await requireAuthenticatedActor();
      if (actor.id !== allocation.studentPersonId) {
        throw new AuthorizationError("You may only sign your own learning contract.");
      }
      actorPersonId = actor.id;
    }

    // Save learning contract acknowledgment in audit log
    const signatureHash = createHash("sha256").update(data.studentSignature.trim()).digest("hex");
    await db.auditLog.create({
      data: {
        tenantId: tenant.id,
        actorPersonId,
        actionType: "LEARNING_CONTRACT_SIGNED",
        resourceType: "PlacementAllocation",
        resourceId: allocation.id,
        beforeState: {},
        afterState: {
          signedAt: new Date(),
          signatureHash,
          contractAgreed: true,
        },
      },
    });

    revalidatePath(`/${data.tenantSlug}/student/placement`);
    revalidatePath(`/${data.tenantSlug}/student/guide`);

    return {
      success: true,
      message: "Learning Contract signed and registered with University Field Directorate.",
    };
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return { success: false, error: error.message };
    }
    console.error("Contract signature failed:", error);
    return { success: false, error: error.message };
  }
}
