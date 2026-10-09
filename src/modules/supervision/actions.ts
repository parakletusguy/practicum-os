"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { VerificationStatus, VisitType, AlertSeverity, AlertType } from "@prisma/client";
import { AuthorizationError, requireAuthenticatedActor, requireTenantRole } from "@/lib/authz";
import { isDemoMode } from "@/lib/runtime-mode";
import { scanEarlyWarningsForCycle } from "./early-warning";

// ==========================================
// 1. PRACTICE EVENT VERIFICATION (FIELD SUPERVISOR)
// ==========================================

export async function verifyPracticeEventAction(formData: FormData) {
  try {
    const eventId = formData.get("eventId") as string;
    const status = formData.get("status") as VerificationStatus;
    const supervisorNotes = formData.get("supervisorNotes") as string;
    const tenantSlug = formData.get("tenantSlug") as string;

    if (!eventId || !status || !Object.values(VerificationStatus).includes(status)) {
      return { success: false, error: "Missing required parameters for verification." };
    }

    const event = await prisma.practiceEvent.findUnique({
      where: { id: eventId },
      include: {
        allocation: {
          include: {
            cycle: true,
            studentPerson: true,
          },
        },
      },
    });

    if (!event) {
      return { success: false, error: "Practice event not found." };
    }
    if (event.verificationStatus !== VerificationStatus.PENDING) {
      return { success: false, error: "Only pending practice events can be verified or queried." };
    }

    const tenant = await prisma.organisation.findUnique({ where: { slug: tenantSlug } });
    if (!tenant || event.allocation.cycle.tenantId !== tenant.id) {
      return { success: false, error: "Practice event not found for this institution." };
    }
    if (!isDemoMode()) {
      const actor = await requireAuthenticatedActor();
      if (event.allocation.fieldSupervisorId !== actor.id) {
        throw new AuthorizationError("Only the assigned field supervisor may verify this event.");
      }
    }

    const updatedEvent = await prisma.practiceEvent.update({
      where: { id: eventId },
      data: {
        verificationStatus: status,
        supervisorNotes: supervisorNotes || null,
        verifiedAt: status === "VERIFIED" ? new Date() : null,
      },
    });

    // Immutable Audit Log
    if (tenant) {
      await prisma.auditLog.create({
        data: {
          tenantId: tenant.id,
          actorPersonId: event.allocation.fieldSupervisorId,
          actionType: `EVENT_${status}`,
          resourceType: "PracticeEvent",
          resourceId: eventId,
          beforeState: { status: event.verificationStatus, notes: event.supervisorNotes },
          afterState: { status, supervisorNotes },
        },
      });
    }

    revalidatePath(`/${tenantSlug}/field`);
    revalidatePath(`/${tenantSlug}/field/verifications`);
    revalidatePath(`/${tenantSlug}/student/logbook`);
    revalidatePath(`/${tenantSlug}/student/dna`);

    return {
      success: true,
      message: `Practice event updated to ${status}.`,
      event: updatedEvent,
    };
  } catch (error: any) {
    console.error("verifyPracticeEventAction error:", error);
    return { success: false, error: error.message || "Failed to update verification status." };
  }
}

// ==========================================
// 2. RECORD SUPERVISION VISIT (ACADEMIC SUPERVISOR)
// ==========================================

export async function createSupervisionVisitAction(formData: FormData) {
  try {
    const allocationId = formData.get("allocationId") as string;
    const supervisorPersonId = formData.get("supervisorPersonId") as string;
    const visitDateStr = formData.get("visitDate") as string;
    const visitType = formData.get("visitType") as VisitType;
    const generalObservations = formData.get("generalObservations") as string;
    const agencyFeedback = formData.get("agencyFeedback") as string;
    const rawActionItems = formData.get("actionItems") as string;
    const studentProgressRating = formData.get("studentProgressRating") as string;
    const followUpRequired = formData.get("followUpRequired") === "true";
    const followUpDateStr = formData.get("followUpDate") as string;
    const tenantSlug = formData.get("tenantSlug") as string;

    if (!allocationId || !generalObservations) {
      return { success: false, error: "Please provide all required visit details." };
    }

    const allocation = await prisma.placementAllocation.findFirst({
      where: { id: allocationId, cycle: { tenant: { slug: tenantSlug } } },
      select: { academicSupervisorId: true },
    });
    if (!allocation) {
      return { success: false, error: "Placement allocation not found for this institution." };
    }
    if (!isDemoMode()) {
      const actor = await requireAuthenticatedActor();
      if (actor.id !== supervisorPersonId || allocation.academicSupervisorId !== actor.id) {
        throw new AuthorizationError("Only the assigned academic supervisor may record this visit.");
      }
    }

    const actionItems = rawActionItems
      ? rawActionItems.split("\n").map((item) => item.trim()).filter(Boolean)
      : [];

    const visit = await prisma.supervisionVisit.create({
      data: {
        allocationId,
        supervisorPersonId,
        visitDate: visitDateStr ? new Date(visitDateStr) : new Date(),
        visitType: visitType || "PHYSICAL_ON_SITE",
        generalObservations,
        agencyFeedback: agencyFeedback || null,
        actionItems,
        studentProgressRating: studentProgressRating || "SATISFACTORY",
        followUpRequired,
        followUpDate: followUpDateStr ? new Date(followUpDateStr) : null,
      },
    });

    // If rated AT_RISK or NEEDS_IMPROVEMENT, automatically generate an Early Warning Alert
    if (studentProgressRating === "AT_RISK" || studentProgressRating === "NEEDS_IMPROVEMENT") {
      await prisma.earlyWarningAlert.create({
        data: {
          allocationId,
          alertType: "POOR_EVALUATION",
          severity: studentProgressRating === "AT_RISK" ? "CRITICAL" : "HIGH",
          title: `Supervision Review Alert: Rated ${studentProgressRating.replace("_", " ")}`,
          description: `Supervisor noted: "${generalObservations.slice(0, 160)}...". Agency feedback: "${agencyFeedback || "None"}". Action items pending: ${actionItems.length}`,
        },
      });
    }

    // Audit Log
    const tenant = await prisma.organisation.findUnique({
      where: { slug: tenantSlug },
    });

    if (tenant) {
      await prisma.auditLog.create({
        data: {
          tenantId: tenant.id,
          actorPersonId: supervisorPersonId,
          actionType: "SUPERVISION_VISIT_LOGGED",
          resourceType: "SupervisionVisit",
          resourceId: visit.id,
          afterState: {
            allocationId,
            visitType,
            studentProgressRating,
            followUpRequired,
          },
        },
      });
    }

    revalidatePath(`/${tenantSlug}/faculty`);
    revalidatePath(`/${tenantSlug}/faculty/visits`);
    revalidatePath(`/${tenantSlug}/faculty/alerts`);

    return {
      success: true,
      message: "Official supervision visit logged successfully.",
      visit,
    };
  } catch (error: any) {
    console.error("createSupervisionVisitAction error:", error);
    return { success: false, error: error.message || "Failed to log supervision visit." };
  }
}

// ==========================================
// 3. EARLY WARNING RESOLUTION & TRIAGE
// ==========================================

export async function resolveEarlyWarningAlertAction(formData: FormData) {
  try {
    const alertId = formData.get("alertId") as string;
    const resolutionNotes = formData.get("resolutionNotes") as string;
    const tenantSlug = formData.get("tenantSlug") as string;

    if (!alertId) {
      return { success: false, error: "Alert ID is required." };
    }

    const existingAlert = await prisma.earlyWarningAlert.findFirst({
      where: { id: alertId, allocation: { cycle: { tenant: { slug: tenantSlug } } } },
      include: { allocation: { select: { academicSupervisorId: true } } },
    });
    if (!existingAlert) {
      return { success: false, error: "Alert not found for this institution." };
    }
    if (!isDemoMode()) {
      const actor = await requireAuthenticatedActor();
      if (existingAlert.allocation.academicSupervisorId !== actor.id) {
        throw new AuthorizationError("Only the assigned academic supervisor may resolve this alert.");
      }
    }

    const alert = await prisma.earlyWarningAlert.update({
      where: { id: alertId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolutionNotes: resolutionNotes || "Resolved after supervisor consultation.",
      },
    });

    revalidatePath(`/${tenantSlug}/faculty`);
    revalidatePath(`/${tenantSlug}/faculty/alerts`);
    revalidatePath(`/${tenantSlug}/admin`);

    return {
      success: true,
      message: "Alert marked as resolved.",
      alert,
    };
  } catch (error: any) {
    console.error("resolveEarlyWarningAlertAction error:", error);
    return { success: false, error: error.message || "Failed to resolve alert." };
  }
}

// ==========================================
// 4. AUTOMATED EARLY WARNING SCANNER
// ==========================================

export async function runEarlyWarningScanAction(cycleId: string, tenantSlug: string) {
  try {
    if (!isDemoMode()) {
      await requireTenantRole(tenantSlug, ["ACADEMIC_SUPERVISOR", "COORDINATOR", "INSTITUTION_ADMIN"]);
    }

    const result = await scanEarlyWarningsForCycle(cycleId, tenantSlug);
    if (!result.success) return result;

    revalidatePath(`/${tenantSlug}/faculty`);
    revalidatePath(`/${tenantSlug}/faculty/alerts`);
    revalidatePath(`/${tenantSlug}/admin`);

    return {
      success: true,
      message: `Heuristic scan complete. Generated ${result.alertsGenerated} new alerts across ${result.activePlacements} active placements.`,
      alertsGenerated: result.alertsGenerated,
    };
  } catch (error: any) {
    console.error("runEarlyWarningScanAction error:", error);
    return { success: false, error: error.message || "Failed to execute early warning scan." };
  }
}
