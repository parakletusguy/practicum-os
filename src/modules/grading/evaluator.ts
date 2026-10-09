"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { AssessmentStage, CycleStatus, EvaluatorType, Prisma, SystemRole } from "@prisma/client";
import { AuthorizationError, requireAuthenticatedActor, requireTenantRole } from "@/lib/authz";
import { isDemoMode } from "@/lib/runtime-mode";
import { calculateLetterGrade, DEFAULT_GRADING_FORMULA, type GradingFormulaConfig } from "./formula";

const GRADING_ADMIN_ROLES = [SystemRole.COORDINATOR, SystemRole.INSTITUTION_ADMIN];

/**
 * Run dynamic formula evaluation for all cohort students in a cycle
 */
export async function calculateCohortGradesAction(cycleId: string, tenantSlug: string) {
  try {
    const cycle = await prisma.practicumCycle.findFirst({
      where: { id: cycleId, tenant: { slug: tenantSlug } },
      include: {
        students: {
          include: {
            person: true,
            allocation: {
              include: {
                practiceEvents: true,
                assessments: true,
                supervisionVisits: true,
              },
            },
            grade: true,
          },
        },
      },
    });

    if (!cycle) {
      return { success: false, error: "Cycle not found for this institution." };
    }
    const authorization = !isDemoMode()
      ? await requireTenantRole(tenantSlug, GRADING_ADMIN_ROLES)
      : null;
    if (cycle.status !== CycleStatus.GRADING) {
      return { success: false, error: "Grades can only be calculated while the cycle is in GRADING." };
    }

    const formula = (cycle.gradingFormula as unknown as GradingFormulaConfig) || DEFAULT_GRADING_FORMULA;
    const requiredHours = cycle.requiredHours || 400;

    let updatedCount = 0;
    let lockedCount = 0;

    for (const student of cycle.students) {
      if (student.grade?.isApproved) {
        lockedCount++;
        continue;
      }
      const alloc = student.allocation;

      let logbookHoursScore = 0;
      let fieldEvalScore = 75; // Default baseline if not yet evaluated
      let academicEvalScore = 75;
      let reportsScore = 80;

      if (alloc) {
        // 1. Logbook verified hours calculation (capped at 100%)
        const verifiedMinutes = alloc.practiceEvents
          .filter((e) => e.verificationStatus === "VERIFIED")
          .reduce((sum, e) => sum + e.verifiedMinutes, 0);
        const verifiedHours = verifiedMinutes / 60;
        logbookHoursScore = Math.min(100, (verifiedHours / requiredHours) * 100);

        // 2. Field Supervisor Assessment Score
        const fieldAssessments = alloc.assessments.filter(
          (a) => a.evaluatorType === "FIELD_SUPERVISOR"
        );
        if (fieldAssessments.length > 0) {
          // Average if multiple (e.g. Midpoint + Final)
          const total = fieldAssessments.reduce((s, a) => s + (a.totalScore / a.maxScore) * 100, 0);
          fieldEvalScore = total / fieldAssessments.length;
        }

        // 3. Academic Supervisor Assessment Score
        const academicAssessments = alloc.assessments.filter(
          (a) => a.evaluatorType === "ACADEMIC_SUPERVISOR"
        );
        if (academicAssessments.length > 0) {
          const total = academicAssessments.reduce((s, a) => s + (a.totalScore / a.maxScore) * 100, 0);
          academicEvalScore = total / academicAssessments.length;
        } else if (alloc.supervisionVisits.length > 0) {
          // Fallback based on latest visit rating
          const latest = alloc.supervisionVisits[0];
          if (latest.studentProgressRating === "SATISFACTORY") academicEvalScore = 82;
          else if (latest.studentProgressRating === "NEEDS_IMPROVEMENT") academicEvalScore = 65;
          else if (latest.studentProgressRating === "AT_RISK") academicEvalScore = 48;
        }
      }

      // Calculate composite score using weights
      // Default: Field (0.40) + Academic (0.30) + Logbook (0.20) + Reports (0.10)
      const compositeScore = Math.round(
        (fieldEvalScore * 0.40 +
          academicEvalScore * 0.30 +
          logbookHoursScore * 0.20 +
          reportsScore * 0.10) *
          10
      ) / 10;

      const letterGrade = calculateLetterGrade(compositeScore, formula.gradeScale);

      await prisma.cohortGrade.upsert({
        where: { cohortStudentId: student.id },
        create: {
          cycleId: cycle.id,
          cohortStudentId: student.id,
          logbookHoursScore,
          fieldEvalScore,
          academicEvalScore,
          reportsScore,
          compositeScore,
          letterGrade,
          isApproved: false,
        },
        update: {
          logbookHoursScore,
          fieldEvalScore,
          academicEvalScore,
          reportsScore,
          compositeScore,
          letterGrade,
        },
      });

      updatedCount++;
    }

    await prisma.auditLog.create({
      data: {
        tenantId: cycle.tenantId,
        actorPersonId: authorization?.actor.id,
        actionType: "COHORT_GRADES_CALCULATED",
        resourceType: "PracticumCycle",
        resourceId: cycle.id,
        afterState: { updatedCount, lockedCount },
      },
    });

    revalidatePath(`/${tenantSlug}/admin/grading`);
    revalidatePath(`/${tenantSlug}/student`);

    return {
      success: true,
      message: `Calculated dynamic composite scores and letter grades for ${updatedCount} students; ${lockedCount} approved grade(s) were left unchanged.`,
      updatedCount,
    };
  } catch (error: any) {
    console.error("calculateCohortGradesAction error:", error);
    return { success: false, error: error.message || "Failed to calculate grades." };
  }
}

/**
 * Submit Rubric Assessment (Field or Academic Supervisor)
 */
export async function submitAssessmentEvaluationAction(formData: FormData) {
  try {
    const cycleId = formData.get("cycleId") as string;
    const allocationId = formData.get("allocationId") as string;
    const evaluatorPersonId = formData.get("evaluatorPersonId") as string;
    const evaluatorType = formData.get("evaluatorType") as "FIELD_SUPERVISOR" | "ACADEMIC_SUPERVISOR";
    const stage = formData.get("stage") as "MIDPOINT" | "FINAL" | "PERIODIC";
    const rubricPayloadJson = formData.get("rubricPayload") as string;
    const totalScore = parseFloat(formData.get("totalScore") as string);
    const maxScore = parseFloat(formData.get("maxScore") as string) || 100;
    const qualitativeRemarks = formData.get("qualitativeRemarks") as string;
    const recommendations = formData.get("recommendations") as string;
    const tenantSlug = formData.get("tenantSlug") as string;

    if (!allocationId || isNaN(totalScore)) {
      return { success: false, error: "Please complete all required evaluation criteria." };
    }

    if (!cycleId || !tenantSlug || !evaluatorPersonId || !Object.values(EvaluatorType).includes(evaluatorType)) {
      return { success: false, error: "Missing or invalid evaluation details." };
    }
    if (!Object.values(AssessmentStage).includes(stage || "FINAL") || !Number.isFinite(maxScore) || maxScore <= 0 || totalScore < 0 || totalScore > maxScore) {
      return { success: false, error: "Assessment scores or stage are invalid." };
    }
    let rubricPayload: Prisma.InputJsonValue = {};
    try {
      const parsed = rubricPayloadJson ? JSON.parse(rubricPayloadJson) : {};
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { success: false, error: "Assessment rubric must be an object." };
      }
      rubricPayload = parsed as Prisma.InputJsonValue;
    } catch {
      return { success: false, error: "Assessment rubric is not valid JSON." };
    }

    const allocation = await prisma.placementAllocation.findFirst({
      where: {
        id: allocationId,
        cycleId,
        cycle: { tenant: { slug: tenantSlug } },
      },
      select: {
        cohortStudentId: true,
        fieldSupervisorId: true,
        academicSupervisorId: true,
        cycle: { select: { status: true } },
      },
    });
    if (!allocation) return { success: false, error: "Placement allocation not found for this institution." };
    if (allocation.cycle.status !== CycleStatus.ASSESSMENT && allocation.cycle.status !== CycleStatus.GRADING) {
      return { success: false, error: "Assessments may only be submitted during ASSESSMENT or GRADING." };
    }
    const existingGrade = await prisma.cohortGrade.findUnique({ where: { cohortStudentId: allocation.cohortStudentId } });
    if (existingGrade?.isApproved) {
      return { success: false, error: "This student's grade has already been approved and cannot be changed." };
    }
    let actorId = evaluatorPersonId;
    if (!isDemoMode()) {
      const actor = await requireAuthenticatedActor();
      actorId = actor.id;
      const assignedSupervisor = evaluatorType === EvaluatorType.FIELD_SUPERVISOR
        ? allocation.fieldSupervisorId
        : allocation.academicSupervisorId;
      if (actor.id !== evaluatorPersonId || actor.id !== assignedSupervisor) {
        throw new AuthorizationError("Only the assigned supervisor may submit this assessment.");
      }
    }

    const submission = await prisma.assessmentSubmission.create({
      data: {
        cycleId,
        allocationId,
        evaluatorPersonId: actorId,
        evaluatorType,
        stage: stage || "FINAL",
        rubricPayload,
        totalScore,
        maxScore,
        qualitativeRemarks,
        recommendations,
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: (await prisma.practicumCycle.findUnique({ where: { id: cycleId }, select: { tenantId: true } }))?.tenantId,
        actorPersonId: actorId,
        actionType: "ASSESSMENT_SUBMITTED",
        resourceType: "AssessmentSubmission",
        resourceId: submission.id,
        afterState: { allocationId, evaluatorType, stage: stage || "FINAL", totalScore, maxScore },
      },
    });

    revalidatePath(`/${tenantSlug}/field/evaluations`);
    revalidatePath(`/${tenantSlug}/faculty/evaluations`);
    revalidatePath(`/${tenantSlug}/admin/grading`);

    return {
      success: true,
      message: "Official clinical assessment rubric submitted. A coordinator can recalculate provisional grades during GRADING.",
      submission,
    };
  } catch (error: any) {
    console.error("submitAssessmentEvaluationAction error:", error);
    return { success: false, error: error.message || "Failed to submit assessment evaluation." };
  }
}

/**
 * Lock and Approve Cohort Grades (Academic Staff / Head of Department)
 */
export async function approveCohortGradeAction(formData: FormData) {
  try {
    const gradeId = formData.get("gradeId") as string;
    const approverPersonId = formData.get("approverPersonId") as string;
    const moderationRemarks = formData.get("moderationRemarks") as string;
    const tenantSlug = formData.get("tenantSlug") as string;

    if (!gradeId) {
      return { success: false, error: "Grade ID is required." };
    }

    const existingGrade = await prisma.cohortGrade.findFirst({
      where: { id: gradeId, cycle: { tenant: { slug: tenantSlug } } },
      include: { cycle: { select: { tenantId: true, status: true } }, cohortStudent: { include: { person: true } } },
    });
    if (!existingGrade) return { success: false, error: "Grade not found for this institution." };
    if (existingGrade.isApproved) return { success: false, error: "This grade is already approved and locked." };
    if (existingGrade.cycle.status !== CycleStatus.GRADING) {
      return { success: false, error: "Grades can only be approved while the cycle is in GRADING." };
    }
    let actorId = approverPersonId;
    if (!isDemoMode()) {
      const authorization = await requireTenantRole(tenantSlug, GRADING_ADMIN_ROLES);
      actorId = authorization.actor.id;
      if (approverPersonId && approverPersonId !== actorId) {
        throw new AuthorizationError("Grade approval must be recorded under the signed-in approver.");
      }
    }

    const grade = await prisma.cohortGrade.update({
      where: { id: existingGrade.id },
      data: {
        isApproved: true,
        approvedByPersonId: actorId || null,
        approvedAt: new Date(),
        moderationRemarks: moderationRemarks || "Approved by Department Board of Examiners.",
      },
      include: { cohortStudent: { include: { person: true } } },
    });

    // Immutable Audit Entry
    await prisma.auditLog.create({
      data: {
        tenantId: existingGrade.cycle.tenantId,
        actorPersonId: actorId || null,
        actionType: "GRADE_MODERATED_AND_APPROVED",
        resourceType: "CohortGrade",
        resourceId: gradeId,
        beforeState: { isApproved: false, compositeScore: existingGrade.compositeScore, letterGrade: existingGrade.letterGrade },
        afterState: {
          compositeScore: grade.compositeScore,
          letterGrade: grade.letterGrade,
          isApproved: true,
          approvedAt: grade.approvedAt,
        },
      },
    });

    revalidatePath(`/${tenantSlug}/admin/grading`);
    revalidatePath(`/${tenantSlug}/student`);

    return {
      success: true,
      message: `Final grade ${grade.letterGrade} (${grade.compositeScore}%) locked and approved for ${grade.cohortStudent.person.firstName} ${grade.cohortStudent.person.lastName}.`,
      grade,
    };
  } catch (error: any) {
    console.error("approveCohortGradeAction error:", error);
    return { success: false, error: error.message || "Failed to approve grade." };
  }
}
