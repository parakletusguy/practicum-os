export interface GradingFormulaConfig {
  components: {
    name: string;
    weight: number;
    key: "fieldEval" | "academicEval" | "logbookHours" | "reports";
  }[];
  gradeScale: Record<string, [number, number]>;
}

export const DEFAULT_GRADING_FORMULA: GradingFormulaConfig = {
  components: [
    { name: "Field Supervisor Evaluation", weight: 0.4, key: "fieldEval" },
    { name: "Academic Supervisor Review", weight: 0.3, key: "academicEval" },
    { name: "Verified E-Logbook & Hours", weight: 0.2, key: "logbookHours" },
    { name: "Comprehensive Reflective Report", weight: 0.1, key: "reports" },
  ],
  gradeScale: {
    A: [70, 100],
    B: [60, 69.99],
    C: [50, 59.99],
    D: [45, 49.99],
    F: [0, 44.99],
  },
};

export function calculateLetterGrade(
  score: number,
  scale = DEFAULT_GRADING_FORMULA.gradeScale,
): string {
  for (const [letter, [min, max]] of Object.entries(scale)) {
    if (score >= min && score <= max) return letter;
  }
  return score >= 70 ? "A" : score >= 60 ? "B" : score >= 50 ? "C" : score >= 45 ? "D" : "F";
}
