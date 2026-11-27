import type { Prisma } from "@prisma/client";

export const reportStages = ["PERIODIC", "FINAL"] as const;
export type ReportStage = typeof reportStages[number];
export const reportLabels: Record<ReportStage, string> = { PERIODIC: "Reflection", FINAL: "Final portfolio" };

type Submission = {
  id: string;
  stage: string;
  evaluatorType: string;
  rubricPayload: Prisma.JsonValue;
  totalScore: number;
  maxScore: number;
};

export function reportPayload(payload: Prisma.JsonValue) {
  return payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
}

export function currentPracticeReports<T extends Submission>(newestFirst: T[]) {
  return reportStages.map((stage) => {
    const submission = newestFirst.find((item) =>
      item.stage === stage && item.evaluatorType === "STUDENT_SELF" &&
      reportPayload(item.rubricPayload).kind === "PRACTICE_REPORT",
    );
    const review = submission && newestFirst.find((item) =>
      item.evaluatorType === "ACADEMIC_SUPERVISOR" &&
      reportPayload(item.rubricPayload).kind === "PRACTICE_REPORT_REVIEW" &&
      reportPayload(item.rubricPayload).submissionId === submission.id,
    );
    return { stage, submission, review };
  });
}
