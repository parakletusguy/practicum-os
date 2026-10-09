import { describe, expect, it } from "vitest";
import { calculateLetterGrade } from "../../src/modules/grading/formula";

describe("calculateLetterGrade", () => {
  it.each([
    [100, "A"],
    [70, "A"],
    [69.99, "B"],
    [60, "B"],
    [50, "C"],
    [45, "D"],
    [44.99, "F"],
    [0, "F"],
  ])("maps %s to %s on the default scale", (score, expectedGrade) => {
    expect(calculateLetterGrade(score)).toBe(expectedGrade);
  });
});
