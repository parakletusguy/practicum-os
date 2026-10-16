"use server";

import { revalidatePath } from "next/cache";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { AllocationStatus, SystemRole } from "@prisma/client";
import { AuthorizationError, requireAuthenticatedActor, requireTenantRole } from "@/lib/authz";
import { isDemoMode } from "@/lib/runtime-mode";
import { assertEmailDeliveryConfigured } from "@/lib/email/resend";
import {
  createPostingEmailDeliveries,
  processPendingEmailDeliveries,
} from "@/modules/notifications/email-delivery";

export async function dispatchPostingLettersAction(
  tenantSlug: string,
  cycleId: string
) {
  try {
    const demoMode = isDemoMode();
    if (!isDemoMode()) {
      await requireTenantRole(tenantSlug, [SystemRole.COORDINATOR, SystemRole.INSTITUTION_ADMIN]);
      try {
        assertEmailDeliveryConfigured();
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error
            ? `Posting delivery is not configured: ${error.message}`
            : "Posting delivery is not configured.",
        };
      }
    }
    const tenant = await db.organisation.findUnique({ where: { slug: tenantSlug }, select: { id: true } });
    if (!tenant) {
      return { success: false, error: "Institution not found." };
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
        studentPerson: { select: { firstName: true, lastName: true, email: true } },
        hostOrg: { select: { name: true, email: true } },
      },
    });

    if (allocationsToPost.length === 0) {
      return { success: true, count: 0, message: "No approved allocations waiting for posting." };
    }

    let issued = 0;
    let queuedRecipients = 0;
    const blocked: string[] = [];
    const now = new Date();

    for (let i = 0; i < allocationsToPost.length; i++) {
      const alloc = allocationsToPost[i];
      const letterRef =
        alloc.postingLetterRef ||
        `UNILAG/SWK/2026/PL-${String(i + 101).padStart(3, "0")}`;

      const queue = createPostingEmailDeliveries({
        tenantId: tenant.id,
        allocationId: alloc.id,
        studentEmail: alloc.studentPerson.email,
        hostEmail: alloc.hostOrg.email,
        studentName: `${alloc.studentPerson.firstName} ${alloc.studentPerson.lastName}`,
        hostName: alloc.hostOrg.name,
        reference: letterRef,
      });
      if (!demoMode && queue.missing.length) {
        blocked.push(...queue.missing);
        continue;
      }

      await db.$transaction(async (tx) => {
        await tx.placementAllocation.update({
          where: { id: alloc.id },
          data: {
            // Issuing a letter is distinct from the student beginning placement.
            status: AllocationStatus.POSTED,
            postingLetterRef: letterRef,
            postedAt: alloc.postedAt || now,
          },
        });
        await tx.cohortStudent.update({
          where: { id: alloc.cohortStudentId },
          data: { status: "PLACED" },
        });
        if (!demoMode) {
          await tx.emailDelivery.createMany({ data: queue.queued, skipDuplicates: true });
        }
      });

      issued++;
      queuedRecipients += queue.queued.length;
    }

    const actor = !isDemoMode() ? await requireAuthenticatedActor() : null;
    const deliveryRun = !demoMode && queuedRecipients > 0
      ? await processPendingEmailDeliveries(Math.min(queuedRecipients, 25))
      : null;
    await db.auditLog.create({
      data: {
        tenantId: tenant.id,
        actorPersonId: actor?.id,
        actionType: demoMode ? "POSTING_REFERENCES_GENERATED_DEMO" : "POSTING_LETTERS_QUEUED",
        resourceType: "PracticumCycle",
        resourceId: cycle.id,
        afterState: {
          issued,
          queuedRecipients,
          blockedAllocations: blocked.length,
          delivery: deliveryRun && {
            attempted: deliveryRun.attempted,
            sent: deliveryRun.sent,
            retried: deliveryRun.retried,
            failed: deliveryRun.failed,
          },
        },
      },
    });

    revalidatePath(`/${tenantSlug}/admin/postings`);
    revalidatePath(`/${tenantSlug}/admin/matching`);
    revalidatePath(`/${tenantSlug}/admin`);
    revalidatePath(`/${tenantSlug}/student/placement`);

    return {
      success: true,
      count: issued,
      message: demoMode
        ? `Generated ${issued} preview posting reference(s). Demo mode never sends email.`
        : [
            `Issued ${issued} posting letter(s); ${queuedRecipients} delivery recipient(s) queued.`,
            deliveryRun ? `${deliveryRun.sent} accepted by the email provider${deliveryRun.retried ? `; ${deliveryRun.retried} scheduled for retry` : ""}.` : "",
            blocked.length ? `${blocked.length} recipient requirement(s) blocked issuance: ${blocked.join("; ")}.` : "",
          ].filter(Boolean).join(" "),
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
