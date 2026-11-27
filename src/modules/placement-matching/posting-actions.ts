"use server";

import { revalidatePath } from "next/cache";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { AllocationStatus, SystemRole } from "@prisma/client";
import { requireTenantRole } from "@/lib/authz";
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
    const authorization = demoMode ? null : await requireTenantRole(tenantSlug, [SystemRole.COORDINATOR, SystemRole.INSTITUTION_ADMIN]);
    if (!demoMode) {
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
      select: { id: true, academicYear: true },
    });
    if (!cycle) {
      return { success: false, error: "Practicum cycle not found for this institution." };
    }

    const allocationsToPost = await db.placementAllocation.findMany({
      where: {
        cycleId: cycle.id,
        cycle: { status: { in: ["MATCHING", "ACTIVE"] } },
        hostOrg: { verificationStatus: "VERIFIED" },
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

    for (const alloc of allocationsToPost) {
      if (new Set([alloc.studentPersonId, alloc.academicSupervisorId, alloc.fieldSupervisorId].filter(Boolean)).size !== 3) {
        blocked.push(`${alloc.studentPerson.firstName} ${alloc.studentPerson.lastName} needs two distinct supervisors before posting.`);
        continue;
      }
      const letterRef =
        alloc.postingLetterRef ||
        `${tenantSlug.toUpperCase()}/${cycle.academicYear}/PL-${alloc.id}`;

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

      const posted = await db.$transaction(async (tx) => {
        const changed = await tx.placementAllocation.updateMany({
          where: { id: alloc.id, status: AllocationStatus.APPROVED, updatedAt: alloc.updatedAt },
          data: {
            // Issuing a letter is distinct from the student beginning placement.
            status: AllocationStatus.POSTED,
            postingLetterRef: letterRef,
            postedAt: alloc.postedAt || now,
          },
        });
        if (changed.count !== 1) return false;
        await tx.cohortStudent.update({
          where: { id: alloc.cohortStudentId },
          data: { status: "PLACED" },
        });
        if (!demoMode) {
          await tx.emailDelivery.createMany({ data: queue.queued, skipDuplicates: true });
        }
        return true;
      });

      if (!posted) continue;
      issued++;
      queuedRecipients += queue.queued.length;
    }

    const deliveryRun = !demoMode && queuedRecipients > 0
      ? await processPendingEmailDeliveries(Math.min(queuedRecipients, 25))
      : null;
    await db.auditLog.create({
      data: {
        tenantId: tenant.id,
        actorPersonId: authorization?.actor.id,
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
