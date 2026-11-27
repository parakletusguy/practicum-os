import type { Prisma } from "@prisma/client";
import type { GradeScores } from "./formula";
import { currentPracticeReports, reportPayload } from "./practice-report";

type GradingAssessment = {
  id: string;
  stage: string;
  evaluatorType: string;
  evaluatorPersonId: string;
  rubricPayload: Prisma.JsonValue;
  totalScore: number;
  maxScore: number;
};

export function getAssessmentScores(allocation: {
  fieldSupervisorId: string | null;
  academicSupervisorId: string | null;
  practiceEvents: { verificationStatus: string; verifiedMinutes: number }[];
  assessments: GradingAssessment[];
} | null, requiredHours: number): GradeScores {
  if (!allocation) return { fieldEval: null, academicEval: null, logbookHours: null, reports: null };
  const assessmentScore = (type: string, evaluatorId: string | null) => {
    const result = allocation.assessments.find((item) =>
      item.stage === "FINAL" && item.evaluatorType === type &&
      item.evaluatorPersonId === evaluatorId && reportPayload(item.rubricPayload).kind !== "PRACTICE_REPORT_REVIEW",
    );
    return result && result.maxScore > 0 ? result.totalScore / result.maxScore * 100 : null;
  };
  const verifiedMinutes = allocation.practiceEvents.filter(({ verificationStatus }) =>
    verificationStatus === "VERIFIED",
  ).reduce((sum, item) => sum + item.verifiedMinutes, 0);
  const reports = currentPracticeReports(allocation.assessments);
  const reviewed = reports.every(({ review }) => review && review.evaluatorPersonId === allocation.academicSupervisorId && review.maxScore > 0);
  return {
    fieldEval: assessmentScore("FIELD_SUPERVISOR", allocation.fieldSupervisorId),
    academicEval: assessmentScore("ACADEMIC_SUPERVISOR", allocation.academicSupervisorId),
    logbookHours: Math.min(100, verifiedMinutes / (requiredHours * 60) * 100),
    reports: reviewed ? reports.reduce((sum, { review }) => sum + review!.totalScore / review!.maxScore * 100, 0) / reports.length : null,
  };
}
