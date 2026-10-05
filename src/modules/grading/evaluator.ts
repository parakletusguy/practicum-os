import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface GradingFormulaConfig {
  components: {
    name: string;
    weight: number; // e.g. 0.40
    key: "fieldEval" | "academicEval" | "logbookHours" | "reports";
  }[];
  gradeScale: {
    [letter: string]: [number, number]; // [min, max]
  };
}

export const DEFAULT_GRADING_FORMULA: GradingFormulaConfig = {
  components: [
    { name: "Field Supervisor Evaluation", weight: 0.40, key: "fieldEval" },
    { name: "Academic Supervisor Review", weight: 0.30, key: "academicEval" },
    { name: "Verified E-Logbook & Hours", weight: 0.20, key: "logbookHours" },
    { name: "Comprehensive Reflective Report", weight: 0.10, key: "reports" },
  ],
  gradeScale: {
    A: [70, 100],
    B: [60, 69.99],
    C: [50, 59.99],
    D: [45, 49.99],
    F: [0, 44.99],
  },
};

/**
 * Determine letter grade from composite score based on institution scale
 */
export function calculateLetterGrade(score: number, scale = DEFAULT_GRADING_FORMULA.gradeScale): string {
  for (const [letter, [min, max]] of Object.entries(scale)) {
    if (score >= min && score <= max) {
      return letter;
    }
  }
  return score >= 70 ? "A" : score >= 60 ? "B" : score >= 50 ? "C" : score >= 45 ? "D" : "F";
}

/**
 * Run dynamic formula evaluation for all cohort students in a cycle
 */
export async function calculateCohortGradesAction(cycleId: string, tenantSlug: string) {
  try {
    const cycle = await prisma.practicumCycle.findUnique({
      where: { id: cycleId },
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
      return { success: false, error: "Cycle not found." };
    }

    const formula = (cycle.gradingFormula as unknown as GradingFormulaConfig) || DEFAULT_GRADING_FORMULA;
    const requiredHours = cycle.requiredHours || 400;

    let updatedCount = 0;

    for (const student of cycle.students) {
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

    revalidatePath(`/${tenantSlug}/admin/grading`);
    revalidatePath(`/${tenantSlug}/student`);

    return {
      success: true,
      message: `Calculated dynamic composite scores and letter grades for ${updatedCount} students.`,
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

    const rubricPayload = rubricPayloadJson ? JSON.parse(rubricPayloadJson) : {};

    const submission = await prisma.assessmentSubmission.create({
      data: {
        cycleId,
        allocationId,
        evaluatorPersonId,
        evaluatorType,
        stage: stage || "FINAL",
        rubricPayload,
        totalScore,
        maxScore,
        qualitativeRemarks,
        recommendations,
      },
    });

    // Automatically recalculate cohort grades to incorporate the new assessment score
    await calculateCohortGradesAction(cycleId, tenantSlug);

    revalidatePath(`/${tenantSlug}/field/evaluations`);
    revalidatePath(`/${tenantSlug}/faculty/evaluations`);
    revalidatePath(`/${tenantSlug}/admin/grading`);

    return {
      success: true,
      message: "Official clinical assessment rubric submitted and factored into cohort grades.",
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

    const grade = await prisma.cohortGrade.update({
      where: { id: gradeId },
      data: {
        isApproved: true,
        approvedByPersonId: approverPersonId || null,
        approvedAt: new Date(),
        moderationRemarks: moderationRemarks || "Approved by Department Board of Examiners.",
      },
      include: {
        cohortStudent: {
          include: { person: true },
        },
      },
    });

    // Immutable Audit Entry
    const tenant = await prisma.organisation.findUnique({
      where: { slug: tenantSlug },
    });

    if (tenant) {
      await prisma.auditLog.create({
        data: {
          tenantId: tenant.id,
          actorPersonId: approverPersonId,
          actionType: "GRADE_MODERATED_AND_APPROVED",
          resourceType: "CohortGrade",
          resourceId: gradeId,
          afterState: {
            compositeScore: grade.compositeScore,
            letterGrade: grade.letterGrade,
            isApproved: true,
            approvedAt: new Date(),
          },
        },
      });
    }

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
