"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { VerificationStatus, VisitType, AlertSeverity, AlertType } from "@prisma/client";

// ==========================================
// 1. PRACTICE EVENT VERIFICATION (FIELD SUPERVISOR)
// ==========================================

export async function verifyPracticeEventAction(formData: FormData) {
  try {
    const eventId = formData.get("eventId") as string;
    const status = formData.get("status") as VerificationStatus;
    const supervisorNotes = formData.get("supervisorNotes") as string;
    const tenantSlug = formData.get("tenantSlug") as string;

    if (!eventId || !status) {
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

    const updatedEvent = await prisma.practiceEvent.update({
      where: { id: eventId },
      data: {
        verificationStatus: status,
        supervisorNotes: supervisorNotes || null,
        verifiedAt: status === "VERIFIED" ? new Date() : null,
      },
    });

    // Immutable Audit Log
    const tenant = await prisma.organisation.findUnique({
      where: { slug: tenantSlug },
    });

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
    const cycle = await prisma.practicumCycle.findUnique({
      where: { id: cycleId },
      include: {
        allocations: {
          where: { status: "ACTIVE" },
          include: {
            cohortStudent: {
              include: { person: true },
            },
            practiceEvents: true,
            supervisionVisits: true,
            earlyWarningAlerts: {
              where: { isResolved: false },
            },
          },
        },
      },
    });

    if (!cycle) {
      return { success: false, error: "Cycle not found." };
    }

    let alertsGenerated = 0;
    const now = new Date();
    const cycleStart = new Date(cycle.startDate);
    const cycleEnd = new Date(cycle.endDate);
    const totalCycleDays = Math.max(1, (cycleEnd.getTime() - cycleStart.getTime()) / (1000 * 3600 * 24));
    const elapsedDays = Math.max(0, Math.min(totalCycleDays, (now.getTime() - cycleStart.getTime()) / (1000 * 3600 * 24)));
    const expectedHoursProportion = (elapsedDays / totalCycleDays) * cycle.requiredHours;

    for (const alloc of cycle.allocations) {
      const studentName = `${alloc.cohortStudent.person.firstName} ${alloc.cohortStudent.person.lastName}`;
      const totalVerifiedMinutes = alloc.practiceEvents
        .filter((e) => e.verificationStatus === "VERIFIED")
        .reduce((sum, e) => sum + e.verifiedMinutes, 0);
      const verifiedHours = totalVerifiedMinutes / 60;

      // 1. Check Hours Lag: If elapsed > 20% and hours logged < 60% of expected
      if (elapsedDays > 14 && expectedHoursProportion > 20) {
        const hoursDeficit = expectedHoursProportion - verifiedHours;
        const hasExistingHoursAlert = alloc.earlyWarningAlerts.some(
          (a) => a.alertType === "HOURS_BEHIND_SCHEDULE"
        );

        if (hoursDeficit > 30 && !hasExistingHoursAlert) {
          await prisma.earlyWarningAlert.create({
            data: {
              allocationId: alloc.id,
              alertType: "HOURS_BEHIND_SCHEDULE",
              severity: hoursDeficit > 60 ? "CRITICAL" : "HIGH",
              title: `Hours Deficit: ${studentName} is ${Math.round(hoursDeficit)} hrs behind pace`,
              description: `Student has completed ${verifiedHours.toFixed(1)} verified hours out of an expected ${Math.round(expectedHoursProportion)} hours at this milestone in the practicum cycle.`,
            },
          });
          alertsGenerated++;
        }
      }

      // 2. Check Overdue Logbook Entry: If no practice event logged in the past 14 days
      const sortedEvents = [...alloc.practiceEvents].sort(
        (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
      );
      const lastEventDate = sortedEvents.length > 0 ? new Date(sortedEvents[0].eventDate) : null;
      const daysSinceLastLog = lastEventDate
        ? (now.getTime() - lastEventDate.getTime()) / (1000 * 3600 * 24)
        : elapsedDays;

      const hasExistingCadenceAlert = alloc.earlyWarningAlerts.some(
        (a) => a.alertType === "OVERDUE_LOGBOOK_ENTRY"
      );

      if (daysSinceLastLog >= 14 && !hasExistingCadenceAlert) {
        await prisma.earlyWarningAlert.create({
          data: {
            allocationId: alloc.id,
            alertType: "OVERDUE_LOGBOOK_ENTRY",
            severity: "MEDIUM",
            title: `Logbook Inactivity: No entries from ${studentName} in ${Math.round(daysSinceLastLog)} days`,
            description: `Trainee has not submitted any practice event since ${lastEventDate ? lastEventDate.toISOString().split("T")[0] : "cycle start"}. Immediate check-in advised.`,
          },
        });
        alertsGenerated++;
      }

      // 3. Check Supervision Visit Milestone: If > 50% cycle elapsed and zero visits logged
      const progressPercent = (elapsedDays / totalCycleDays) * 100;
      const hasExistingVisitAlert = alloc.earlyWarningAlerts.some(
        (a) => a.alertType === "MISSED_SUPERVISION_VISIT"
      );

      if (progressPercent >= 50 && alloc.supervisionVisits.length === 0 && !hasExistingVisitAlert) {
        await prisma.earlyWarningAlert.create({
          data: {
            allocationId: alloc.id,
            alertType: "MISSED_SUPERVISION_VISIT",
            severity: "HIGH",
            title: `Supervision Milestone Breach: Zero faculty visits for ${studentName}`,
            description: `Practicum cycle is ${Math.round(progressPercent)}% elapsed, but no academic supervision visits have been documented for this placement.`,
          },
        });
        alertsGenerated++;
      }
    }

    revalidatePath(`/${tenantSlug}/faculty`);
    revalidatePath(`/${tenantSlug}/faculty/alerts`);
    revalidatePath(`/${tenantSlug}/admin`);

    return {
      success: true,
      message: `Heuristic scan complete. Generated ${alertsGenerated} new alerts across ${cycle.allocations.length} active placements.`,
      alertsGenerated,
    };
  } catch (error: any) {
    console.error("runEarlyWarningScanAction error:", error);
    return { success: false, error: error.message || "Failed to execute early warning scan." };
  }
}
