"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { PracticeScopeLevel, VerificationStatus, AlertType, AlertSeverity } from "@prisma/client";
import { evaluateScopeGuard } from "@/modules/scope-guard/policy";
import { generateEventChecksum, validateClientDeidentification } from "@/modules/evidence-vault/sanitizer";
import { AuthenticationError, AuthorizationError, requireAuthenticatedActor } from "@/lib/authz";
import { isDemoMode } from "@/lib/runtime-mode";

export async function createPracticeEventAction(data: {
  tenantSlug: string;
  allocationId: string;
  eventDate: string;
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  category: string;
  clientRef: string;
  activityTitle: string;
  activityDescription: string;
  criticalReflection: string;
  competenciesTagged: string[];
  scopeLevel: PracticeScopeLevel;
  evidenceUrl?: string;
}) {
  try {
    const allocation = await db.placementAllocation.findFirst({
      where: {
        id: data.allocationId,
        cycle: { tenant: { slug: data.tenantSlug } },
      },
      select: { id: true, studentPersonId: true },
    });
    if (!allocation) {
      return { success: false, error: "Placement allocation not found for this institution." };
    }

    if (!isDemoMode()) {
      const actor = await requireAuthenticatedActor();
      if (actor.id !== allocation.studentPersonId) {
        throw new AuthorizationError("You may only create practice events for your own placement.");
      }
    }

    const evidencePath = data.evidenceUrl?.trim();
    if (evidencePath && !evidencePath.startsWith(`${allocation.id}/`)) {
      return { success: false, error: "Evidence attachment is not valid for this placement." };
    }

    // 1. Calculate duration in minutes
    const [startH, startM] = data.startTime.split(":").map(Number);
    const [endH, endM] = data.endTime.split(":").map(Number);
    let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (totalMinutes <= 0) totalMinutes = 60; // minimum 1 hr fallback

    // 2. Validate client de-identification (Anti-PII)
    const deidentResult = validateClientDeidentification(data.clientRef);
    if (!deidentResult.valid) {
      return { success: false, error: deidentResult.warning };
    }

    // 3. Evaluate ScopeGuard clinical safety policy
    const scopeCheck = evaluateScopeGuard(data.activityTitle, data.category, data.scopeLevel);

    if (!scopeCheck.allowed) {
      await db.earlyWarningAlert.create({
        data: {
          allocationId: allocation.id,
          alertType: AlertType.SCOPE_GUARD_FLAG,
          severity: scopeCheck.violationSeverity === "HIGH" ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
          title: `ScopeGuard blocked: ${data.activityTitle}`,
          description: `A trainee attempted an activity requiring ${scopeCheck.rule?.allowedScope} as ${data.scopeLevel}. ${scopeCheck.rule?.rationale}`,
        },
      });

      return {
        success: false,
        error: `This activity requires ${scopeCheck.rule?.allowedScope?.replace("_", " ").toLowerCase()}. Your supervisor has been notified.`,
      };
    }

    // 4. Generate SHA-256 tamper checksum
    const tamperChecksum = generateEventChecksum({
      allocationId: data.allocationId,
      eventDate: data.eventDate,
      startTime: data.startTime,
      endTime: data.endTime,
      verifiedMinutes: totalMinutes,
      activityTitle: data.activityTitle,
      activityDescription: data.activityDescription,
      criticalReflection: data.criticalReflection,
    });

    // 5. Create PracticeEvent record
    const event = await db.practiceEvent.create({
      data: {
        allocationId: allocation.id,
        eventDate: new Date(data.eventDate),
        startTime: data.startTime,
        endTime: data.endTime,
        verifiedMinutes: totalMinutes,
        category: data.category,
        clientRef: deidentResult.sanitizedRef,
        activityTitle: data.activityTitle,
        activityDescription: data.activityDescription,
        criticalReflection: data.criticalReflection,
        competenciesTagged: data.competenciesTagged,
        scopeLevel: data.scopeLevel,
        evidenceUrl: evidencePath || null,
        evidenceSanitized: true,
        verificationStatus: VerificationStatus.PENDING,
        tamperChecksum,
      },
    });

    revalidatePath(`/${data.tenantSlug}/student/logbook`);
    revalidatePath(`/${data.tenantSlug}/student`);
    revalidatePath(`/${data.tenantSlug}/admin/logbook`);
    revalidatePath(`/${data.tenantSlug}/admin`);

    return {
      success: true,
      event,
      scopeWarning: null,
      message: `Practice Event logged (${(totalMinutes / 60).toFixed(1)} hrs). Submitted for Field Supervisor verification.`,
    };
  } catch (error: any) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return { success: false, error: error.message };
    }
    console.error("Failed to create practice event:", error);
    return { success: false, error: error.message };
  }
}

export async function verifyPracticeEventAction(data: {
  tenantSlug: string;
  eventId: string;
  status: VerificationStatus;
  supervisorNotes?: string;
}) {
  try {
    if (!Object.values(VerificationStatus).includes(data.status)) {
      return { success: false, error: "Invalid verification status." };
    }
    const existingEvent = await db.practiceEvent.findFirst({
      where: { id: data.eventId, allocation: { cycle: { tenant: { slug: data.tenantSlug } } } },
      select: {
        id: true,
        verificationStatus: true,
        supervisorNotes: true,
        allocation: { select: { fieldSupervisorId: true, cycle: { select: { tenantId: true } } } },
      },
    });
    if (!existingEvent) {
      return { success: false, error: "Practice event not found for this institution." };
    }
    if (existingEvent.verificationStatus !== VerificationStatus.PENDING) {
      return { success: false, error: "Only pending practice events can be verified or queried." };
    }
    let actorPersonId = existingEvent.allocation.fieldSupervisorId;
    if (!isDemoMode()) {
      const actor = await requireAuthenticatedActor();
      if (actor.id !== existingEvent.allocation.fieldSupervisorId) {
        throw new AuthorizationError("Only the assigned field supervisor may verify this event.");
      }
      actorPersonId = actor.id;
    }
    const event = await db.practiceEvent.update({
      where: { id: existingEvent.id },
      data: {
        verificationStatus: data.status,
        supervisorNotes: data.supervisorNotes || null,
        verifiedAt: data.status === VerificationStatus.VERIFIED ? new Date() : null,
      },
    });
    await db.auditLog.create({
      data: {
        tenantId: existingEvent.allocation.cycle.tenantId,
        actorPersonId,
        actionType: `PRACTICE_EVENT_${data.status}`,
        resourceType: "PracticeEvent",
        resourceId: event.id,
        beforeState: { status: existingEvent.verificationStatus, supervisorNotes: existingEvent.supervisorNotes },
        afterState: { status: data.status, supervisorNotes: data.supervisorNotes || null },
      },
    });

    revalidatePath(`/${data.tenantSlug}/student/logbook`);
    revalidatePath(`/${data.tenantSlug}/student`);
    revalidatePath(`/${data.tenantSlug}/admin/logbook`);
    revalidatePath(`/${data.tenantSlug}/admin`);

    return { success: true, event };
  } catch (error: any) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return { success: false, error: error.message };
    }
    console.error("Failed to verify practice event:", error);
    return { success: false, error: error.message };
  }
}
