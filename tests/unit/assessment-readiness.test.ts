import { describe, expect, it } from "vitest";
import { getAssessmentScores } from "../../src/modules/grading/assessment-scores";
import { calculateWeightedGrade, DEFAULT_GRADING_FORMULA, readGradingFormula } from "../../src/modules/grading/formula";

describe("grade readiness", () => {
  it("uses configured legacy percentage weights and distinguishes zero from missing work", () => {
    const formula = readGradingFormula({
      fieldEvalWeight: 45, academicEvalWeight: 35, logbookHoursWeight: 20, reportsWeight: 0,
    });
    expect(calculateWeightedGrade({ fieldEval: 80, academicEval: 100, logbookHours: 0, reports: null }, formula))
      .toEqual({ complete: true, compositeScore: 71, letterGrade: "A" });
    expect(calculateWeightedGrade({ fieldEval: null, academicEval: 100, logbookHours: 0, reports: null }, formula))
      .toEqual({ complete: false, missing: ["fieldEval"] });
  });

  it("uses configured keyed weights independently of their input order", () => {
    const base = DEFAULT_GRADING_FORMULA.components;
    const formula = readGradingFormula({
      components: [base[3], base[1], { ...base[0], weight: 0.2 }, { ...base[2], weight: 0.4 }],
    });
    expect(calculateWeightedGrade({ fieldEval: 100, academicEval: 0, logbookHours: 50, reports: 100 }, formula))
      .toEqual({ complete: true, compositeScore: 50, letterGrade: "C" });
  });

  it("requires a review of the current reflection and portfolio, with no default report grade", () => {
    const report = (id: string, stage: string) => ({
      id, stage, evaluatorType: "STUDENT_SELF", evaluatorPersonId: "student",
      totalScore: 0, maxScore: 100, rubricPayload: { kind: "PRACTICE_REPORT" },
    });
    const review = (submissionId: string, stage: string, totalScore: number) => ({
      id: "review-" + submissionId, stage, evaluatorType: "ACADEMIC_SUPERVISOR", evaluatorPersonId: "faculty",
      totalScore, maxScore: 100, rubricPayload: { kind: "PRACTICE_REPORT_REVIEW", submissionId },
    });
    const inputs = {
      fieldSupervisorId: "field", academicSupervisorId: "faculty", practiceEvents: [],
      assessments: [
        report("new-reflection", "PERIODIC"),
        review("portfolio", "FINAL", 60), report("portfolio", "FINAL"),
        review("old-reflection", "PERIODIC", 80), report("old-reflection", "PERIODIC"),
      ],
    };
    const incomplete = getAssessmentScores(inputs, 400);
    expect(incomplete.reports).toBeNull();
    expect(incomplete.academicEval).toBeNull();
    expect(getAssessmentScores({ ...inputs, assessments: [review("new-reflection", "PERIODIC", 100), ...inputs.assessments] }, 400).reports).toBe(80);
  });
});
