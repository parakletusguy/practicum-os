"use server";

import { createHash, randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { AssessmentStage, CycleStatus, EvaluatorType, Prisma, SystemRole } from "@prisma/client";
import { AuthorizationError, requireTenantRole } from "@/lib/authz";
import { isDemoMode } from "@/lib/runtime-mode";
import { calculateWeightedGrade, readGradingFormula } from "./formula";
import { getAssessmentScores } from "./assessment-scores";
import { hasAuthorizedGradeCorrection, transcriptSeal } from "./transcript";
import { fieldSupervisorScope } from "@/lib/record-access";

const GRADING_ADMIN_ROLES = [SystemRole.COORDINATOR, SystemRole.INSTITUTION_ADMIN];
const assessmentInputs = {
  practiceEvents: true,
  assessments: { orderBy: [{ submittedAt: "desc" }, { id: "desc" }] },
} satisfies Prisma.PlacementAllocationInclude;


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
            allocation: { include: assessmentInputs },
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

    const formula = readGradingFormula(cycle.gradingFormula);
    const requiredHours = cycle.requiredHours || 400;

    let updatedCount = 0;
    let lockedCount = 0;
    let incompleteCount = 0;

    for (const student of cycle.students) {
      if (student.grade?.isApproved) {
        lockedCount++;
        continue;
      }

      const scores = getAssessmentScores(student.allocation, requiredHours);
      const result = calculateWeightedGrade(scores, formula);
      if (!result.complete) {
        incompleteCount++;
        continue;
      }
      const values = {
        logbookHoursScore: scores.logbookHours,
        fieldEvalScore: scores.fieldEval,
        academicEvalScore: scores.academicEval,
        reportsScore: scores.reports,
        compositeScore: result.compositeScore,
        letterGrade: result.letterGrade,
      };
      const saved = await prisma.$transaction(async (tx) => {
        const changed = await tx.cohortGrade.updateMany({
          where: { cohortStudentId: student.id, isApproved: false, cycle: { status: CycleStatus.GRADING } },
          data: values,
        });
        if (changed.count === 1) return true;
        if (student.grade) return false;
        const currentCycle = await tx.practicumCycle.findUnique({ where: { id: cycle.id }, select: { status: true } });
        if (currentCycle?.status !== CycleStatus.GRADING) return false;
        const created = await tx.cohortGrade.createMany({
          data: [{ cycleId: cycle.id, cohortStudentId: student.id, ...values }],
          skipDuplicates: true,
        });
        return created.count === 1;
      });
      if (!saved) continue;
      updatedCount++;
    }

    await prisma.auditLog.create({
      data: {
        tenantId: cycle.tenantId,
        actorPersonId: authorization?.actor.id,
        actionType: "COHORT_GRADES_CALCULATED",
        resourceType: "PracticumCycle",
        resourceId: cycle.id,
        afterState: { updatedCount, lockedCount, incompleteCount },
      },
    });

    revalidatePath(`/${tenantSlug}/admin/grading`);
    revalidatePath(`/${tenantSlug}/student`);

    return {
      success: true,
      message: `Calculated ${updatedCount} grades. ${incompleteCount} are incomplete and ${lockedCount} were already approved.`,
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
        studentPersonId: true,
        cycle: { select: { status: true } },
      },
    });
    if (!allocation) return { success: false, error: "Placement allocation not found for this institution." };
    const existingGrade = await prisma.cohortGrade.findUnique({ where: { cohortStudentId: allocation.cohortStudentId } });
    const correcting = allocation.cycle.status === CycleStatus.GRADING && await hasAuthorizedGradeCorrection(existingGrade);
    if (!correcting && allocation.cycle.status !== CycleStatus.ASSESSMENT && !(allocation.cycle.status === CycleStatus.ACTIVE && stage === "MIDPOINT")) {
      return { success: false, error: "Midpoint rubrics open during fieldwork. Final rubrics open during assessment." };
    }
    if (existingGrade?.isApproved) {
      return { success: false, error: "This student's grade has already been approved and cannot be changed." };
    }
    let actorId = evaluatorPersonId;
    if (!isDemoMode()) {
      const role = evaluatorType === "FIELD_SUPERVISOR" ? SystemRole.FIELD_SUPERVISOR
        : evaluatorType === "ACADEMIC_SUPERVISOR" ? SystemRole.ACADEMIC_SUPERVISOR : SystemRole.STUDENT;
      const { actor, tenant } = await requireTenantRole(tenantSlug, [role]);
      actorId = actor.id;
      const assignedSupervisor = evaluatorType === EvaluatorType.FIELD_SUPERVISOR
        ? allocation.fieldSupervisorId
        : evaluatorType === EvaluatorType.ACADEMIC_SUPERVISOR ? allocation.academicSupervisorId : allocation.studentPersonId;
      if (actor.id !== evaluatorPersonId || actor.id !== assignedSupervisor) {
        throw new AuthorizationError("Only the assigned supervisor may submit this assessment.");
      }
      if (role === SystemRole.FIELD_SUPERVISOR && !await prisma.placementAllocation.findFirst({
        where: { id: allocationId, ...fieldSupervisorScope(actor.id, tenant.id) },
        select: { id: true },
      })) throw new AuthorizationError();
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
  const gradeId = String(formData.get("gradeId") || "");
  const tenantSlug = String(formData.get("tenantSlug") || "");
  const remarks = String(formData.get("moderationRemarks") || "").trim();
  if (!gradeId || !remarks || remarks.length > 2000) return { success: false, error: "Enter moderation remarks before approving." };

  try {
    const { actor, tenant } = await requireTenantRole(tenantSlug, GRADING_ADMIN_ROLES);
    const approval = await prisma.$transaction(async (tx) => {
      const grade = await tx.cohortGrade.findFirst({
        where: { id: gradeId, cycle: { tenantId: tenant.id, status: CycleStatus.GRADING }, isApproved: false },
        include: {
          cycle: { select: { requiredHours: true, gradingFormula: true, name: true, academicYear: true } },
          cohortStudent: { select: {
            matricNumber: true, person: { select: { firstName: true, lastName: true } },
            allocation: { include: assessmentInputs },
          } },
        },
      });
      if (!grade) throw new Error("Only a draft grade in the grading stage can be approved.");
      const scores = getAssessmentScores(grade.cohortStudent.allocation, grade.cycle.requiredHours);
      const computed = calculateWeightedGrade(scores, readGradingFormula(grade.cycle.gradingFormula));
      if (!computed.complete || computed.compositeScore !== grade.compositeScore || computed.letterGrade !== grade.letterGrade ||
        scores.fieldEval !== grade.fieldEvalScore || scores.academicEval !== grade.academicEvalScore ||
        scores.logbookHours !== grade.logbookHoursScore || scores.reports !== grade.reportsScore) {
        throw new Error("The grade is incomplete or out of date. Recalculate it before approval.");
      }
      const priorTranscript = await tx.auditLog.findFirst({
        where: { tenantId: tenant.id, resourceType: "CohortGrade", resourceId: grade.id, actionType: "TRANSCRIPT_ISSUED" },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: { id: true },
      });
      const version = createHash("sha256").update(JSON.stringify([grade.id, priorTranscript?.id, scores, grade.compositeScore, grade.letterGrade])).digest("hex");
      const previous = await tx.auditLog.findMany({
        where: {
          tenantId: tenant.id, resourceType: "CohortGrade", resourceId: grade.id,
          actionType: "GRADE_MODERATION_RECORDED", afterState: { path: ["version"], equals: version },
        },
        select: { actorPersonId: true },
      });
      if (previous.some((record) => record.actorPersonId === actor.id)) {
        throw new Error("You already approved this grade. A different authorized person must give the second approval.");
      }
      const approvers = previous.flatMap(({ actorPersonId }) => actorPersonId ? [actorPersonId] : []);
      const precedingApproval = approvers.length > 0 && await tx.orgMembership.findFirst({
        where: { organisationId: tenant.id, role: { in: GRADING_ADMIN_ROLES }, status: "ACTIVE", personId: { in: approvers } },
        select: { id: true },
      });
      const locked = Boolean(precedingApproval);
      const changed = await tx.cohortGrade.updateMany({
        where: { id: grade.id, updatedAt: grade.updatedAt, isApproved: false, cycle: { status: CycleStatus.GRADING } },
        data: locked
          ? { isApproved: true, approvedByPersonId: actor.id, approvedAt: new Date(), moderationRemarks: remarks }
          : { updatedAt: new Date() },
      });
      if (changed.count !== 1) throw new Error("This grade changed. Refresh it before approving.");
      await tx.auditLog.create({
        data: {
          tenantId: tenant.id, actorPersonId: actor.id, resourceType: "CohortGrade", resourceId: grade.id,
          actionType: locked ? "GRADE_MODERATED_AND_APPROVED" : "GRADE_MODERATION_RECORDED",
          afterState: { version, compositeScore: grade.compositeScore, letterGrade: grade.letterGrade, remarks, isApproved: locked },
        },
      });
      if (locked) {
        const reference = randomUUID();
        const snapshot = {
          studentName: `${grade.cohortStudent.person.firstName} ${grade.cohortStudent.person.lastName}`,
          matricNumber: grade.cohortStudent.matricNumber,
          institution: tenant.name,
          cycle: grade.cycle.name,
          academicYear: grade.cycle.academicYear,
          compositeScore: grade.compositeScore,
          letterGrade: grade.letterGrade,
          issuedAt: new Date().toISOString(),
        };
        await tx.auditLog.create({
          data: {
            id: reference, tenantId: tenant.id, actorPersonId: actor.id, actionType: "TRANSCRIPT_ISSUED",
            resourceType: "CohortGrade", resourceId: grade.id,
            afterState: { snapshot, seal: transcriptSeal(reference, snapshot) },
          },
        });
      }
      return locked;
    }, { isolationLevel: "Serializable" });
    revalidatePath("/" + tenantSlug, "layout");
    return { success: true, locked: approval, message: approval ? "Grade approved and locked." : "First approval recorded. A second authorized person can now approve." };
  } catch (error) {
    return { success: false, error: error instanceof Error && !("code" in error) ? error.message : "Approval could not be saved. Refresh and try again." };
  }
}
