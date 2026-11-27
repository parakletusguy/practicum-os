"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { Prisma, PracticeScopeLevel, VerificationStatus, AlertType, AlertSeverity } from "@prisma/client";
import { evaluateScopeGuard } from "@/modules/scope-guard/policy";
import { generateEventChecksum, validateClientDeidentification } from "@/modules/evidence-vault/sanitizer";
import { AuthenticationError, AuthorizationError, requireTenantRole } from "@/lib/authz";
import { fieldSupervisorScope } from "@/lib/record-access";
import { isDemoMode } from "@/lib/runtime-mode";
import { queueInitialAlertNotification } from "@/modules/notifications/email-delivery";

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
  submissionId?: string;
}) {
  try {
    if (data.submissionId && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.submissionId)) {
      return { success: false, error: "Invalid logbook submission reference." };
    }
    const allocation = await db.placementAllocation.findFirst({
      where: {
        id: data.allocationId,
        status: "ACTIVE",
        cycle: { tenant: { slug: data.tenantSlug }, status: "ACTIVE" },
      },
      select: { id: true, studentPersonId: true },
    });
    if (!allocation) {
      return { success: false, error: "Placement allocation not found for this institution." };
    }

    if (!isDemoMode()) {
      const { actor } = await requireTenantRole(data.tenantSlug, ["STUDENT"]);
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
    const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(data.startTime) ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.endTime) || totalMinutes <= 0) {
      return { success: false, error: "Enter a valid end time later than the start time on the same day." };
    }

    // 2. Validate client de-identification (Anti-PII)
    const deidentResult = validateClientDeidentification(data.clientRef);
    if (!deidentResult.valid) {
      return { success: false, error: deidentResult.warning };
    }

    // 3. Evaluate ScopeGuard clinical safety policy
    const scopeCheck = evaluateScopeGuard(data.activityTitle, data.category, data.scopeLevel);

    if (!scopeCheck.allowed) {
      const alertFields = {
          allocationId: allocation.id,
          alertType: AlertType.SCOPE_GUARD_FLAG,
          severity: scopeCheck.violationSeverity === "HIGH" ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
          title: `ScopeGuard blocked: ${data.activityTitle}`,
          description: `A trainee attempted an activity requiring ${scopeCheck.rule?.allowedScope} as ${data.scopeLevel}. ${scopeCheck.rule?.rationale}`,
      };
      const alert = data.submissionId
        ? await db.earlyWarningAlert.upsert({
          where: { id: data.submissionId, allocationId: allocation.id },
          create: { id: data.submissionId, ...alertFields },
          update: {},
        })
        : await db.earlyWarningAlert.create({ data: alertFields });
      if (!isDemoMode()) await queueInitialAlertNotification(alert.id);

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
    const eventData = {
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
    };
    let event;
    try {
      event = await db.practiceEvent.create({
        data: { ...eventData, id: data.submissionId },
      });
    } catch (error) {
      if (!data.submissionId || !(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
      event = await db.practiceEvent.findUnique({
        where: {
          id: data.submissionId,
          allocationId: allocation.id,
          tamperChecksum,
          category: data.category,
          clientRef: deidentResult.sanitizedRef,
          evidenceUrl: evidencePath || null,
          scopeLevel: data.scopeLevel,
          competenciesTagged: { equals: data.competenciesTagged },
        },
      });
      if (!event) return { success: false, error: "This submission reference was already used. Open the logbook to check its status." };
    }

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
    if (data.status === VerificationStatus.PENDING || !Object.values(VerificationStatus).includes(data.status)) {
      return { success: false, error: "Invalid verification status." };
    }
    const authorization = isDemoMode() ? null : await requireTenantRole(data.tenantSlug, ["FIELD_SUPERVISOR"]);
    const where = {
      id: data.eventId,
      verificationStatus: VerificationStatus.PENDING,
      allocation: { AND: [
        { cycle: { tenant: { slug: data.tenantSlug }, status: { in: ["ACTIVE", "ASSESSMENT"] } } },
        authorization ? fieldSupervisorScope(authorization.actor.id, authorization.tenant.id) : {},
      ] },
    } satisfies Prisma.PracticeEventWhereInput;
    const existingEvent = await db.practiceEvent.findFirst({
      where,
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
    const actorPersonId = authorization?.actor.id ?? existingEvent.allocation.fieldSupervisorId;
    const event = await db.$transaction(async (tx) => {
      const updated = await tx.practiceEvent.updateMany({
        where,
        data: {
          verificationStatus: data.status,
          supervisorNotes: data.supervisorNotes || null,
          verifiedAt: data.status === VerificationStatus.VERIFIED ? new Date() : null,
        },
      });
      if (updated.count !== 1) throw new Error("This event changed. Refresh before verifying.");
      await tx.auditLog.create({
        data: {
          tenantId: existingEvent.allocation.cycle.tenantId,
          actorPersonId,
          actionType: `PRACTICE_EVENT_${data.status}`,
          resourceType: "PracticeEvent",
          resourceId: existingEvent.id,
          beforeState: { status: existingEvent.verificationStatus, supervisorNotes: existingEvent.supervisorNotes },
          afterState: { status: data.status, supervisorNotes: data.supervisorNotes || null },
        },
      });
      return tx.practiceEvent.findUniqueOrThrow({ where: { id: existingEvent.id } });
    });

    revalidatePath(`/${data.tenantSlug}/student/logbook`);
    revalidatePath(`/${data.tenantSlug}/student`);
    revalidatePath(`/${data.tenantSlug}/student/dna`);
    revalidatePath(`/${data.tenantSlug}/field`);
    revalidatePath(`/${data.tenantSlug}/field/verifications`);
    revalidatePath(`/${data.tenantSlug}/admin/logbook`);
    revalidatePath(`/${data.tenantSlug}/admin`);

    return { success: true, event, message: `Practice event updated to ${data.status}.` };
  } catch (error: any) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return { success: false, error: error.message };
    }
    console.error("Failed to verify practice event:", error);
    return { success: false, error: error.message };
  }
}
