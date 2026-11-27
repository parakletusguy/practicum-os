import { describe, expect, it } from "vitest";
import { calculateWeightedGrade } from "../../src/modules/grading/formula";
import { buildGradingFormula } from "../../src/modules/grading/grading-settings";

const weights = [40, 30, 20, 10];
describe("cycle grading settings", () => {
  it("builds contiguous bands at the scorebook's decimal precision", () => {
    const formula = buildGradingFormula({
      weights,
      bands: [{ label: "Pass", minimum: 55.5 }, { label: "F", minimum: 0 }, { label: "A+", minimum: 95 }],
    });
    expect(formula.gradeScale).toEqual({ "A+": [95, 100], PASS: [55.5, 94.9], F: [0, 55.4] });
    expect(calculateWeightedGrade({ fieldEval: 55.5, academicEval: 55.5, logbookHours: 55.5, reports: 55.5 }, formula))
      .toMatchObject({ compositeScore: 55.5, letterGrade: "PASS" });
  });

  it("rejects duplicate or incomplete bands and weights that do not total 100", () => {
    expect(() => buildGradingFormula({ weights: [40, 30, 20, 9], bands: [{ label: "A", minimum: 70 }, { label: "F", minimum: 0 }] })).toThrow("100%");
    expect(() => buildGradingFormula({ weights, bands: [{ label: "A", minimum: 70 }, { label: "a", minimum: 0 }] })).toThrow("unique");
    expect(() => buildGradingFormula({ weights, bands: [{ label: "A", minimum: 70 }, { label: "F", minimum: 5 }] })).toThrow("0%");
  });
});
