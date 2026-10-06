"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { PracticeScopeLevel, VerificationStatus, AlertType, AlertSeverity } from "@prisma/client";
import { evaluateScopeGuard } from "@/modules/scope-guard/policy";
import { generateEventChecksum, validateClientDeidentification } from "@/modules/evidence-vault/sanitizer";

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
        allocationId: data.allocationId,
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
        evidenceUrl: data.evidenceUrl || null,
        evidenceSanitized: true,
        verificationStatus: VerificationStatus.PENDING,
        tamperChecksum,
      },
    });

    // 6. If ScopeGuard flagged a breach, create an Early Warning Alert for faculty liaison
    if (!scopeCheck.allowed) {
      await db.earlyWarningAlert.create({
        data: {
          allocationId: data.allocationId,
          alertType: AlertType.SCOPE_GUARD_FLAG,
          severity: scopeCheck.violationSeverity === "HIGH" ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
          title: `ScopeGuard Policy Flag: ${data.activityTitle}`,
          description: `Trainee logged an activity requiring ${scopeCheck.rule?.allowedScope} as ${data.scopeLevel}. Rationale: ${scopeCheck.rule?.rationale}`,
        },
      });
    }

    revalidatePath(`/${data.tenantSlug}/student/logbook`);
    revalidatePath(`/${data.tenantSlug}/student`);
    revalidatePath(`/${data.tenantSlug}/admin/logbook`);
    revalidatePath(`/${data.tenantSlug}/admin`);

    return {
      success: true,
      event,
      scopeWarning: !scopeCheck.allowed ? scopeCheck.rule?.rationale : null,
      message: `Practice Event logged (${(totalMinutes / 60).toFixed(1)} hrs). Submitted for Field Supervisor verification.`,
    };
  } catch (error: any) {
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
    const event = await db.practiceEvent.update({
      where: { id: data.eventId },
      data: {
        verificationStatus: data.status,
        supervisorNotes: data.supervisorNotes || null,
        verifiedAt: new Date(),
      },
    });

    revalidatePath(`/${data.tenantSlug}/student/logbook`);
    revalidatePath(`/${data.tenantSlug}/student`);
    revalidatePath(`/${data.tenantSlug}/admin/logbook`);
    revalidatePath(`/${data.tenantSlug}/admin`);

    return { success: true, event };
  } catch (error: any) {
    console.error("Failed to verify practice event:", error);
    return { success: false, error: error.message };
  }
}
