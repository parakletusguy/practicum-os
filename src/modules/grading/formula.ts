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

type GradeComponent = GradingFormulaConfig["components"][number]["key"];
export type GradeScores = Record<GradeComponent, number | null>;

export function readGradingFormula(value: unknown): GradingFormulaConfig {
  if (!value || typeof value !== "object") return DEFAULT_GRADING_FORMULA;
  const stored = value as Record<string, unknown>;
  const scale = stored.gradeScale;
  const gradeScale = scale && typeof scale === "object" && !Array.isArray(scale) &&
    Object.keys(scale).length > 0 && Object.values(scale).every((range) =>
      Array.isArray(range) && range.length === 2 && range.every(Number.isFinite) && range[0] <= range[1],
    ) ? scale as GradingFormulaConfig["gradeScale"] : DEFAULT_GRADING_FORMULA.gradeScale;
  const legacy = [stored.fieldEvalWeight, stored.academicEvalWeight, stored.logbookHoursWeight, stored.reportsWeight];
  const entries = Array.isArray(stored.components) ? stored.components : null;
  const components = DEFAULT_GRADING_FORMULA.components.map((component, index) => {
    const entry = entries?.find((item) => item?.key === component.key) ?? entries?.[index];
    const weight = String(entry?.key || component.key) === component.key ? (entry?.weight ?? legacy[index]) : undefined;
    return { ...component, weight: typeof weight === "number" ? weight : component.weight };
  });
  const weightTotal = components.reduce((sum, component) => sum + component.weight, 0);
  if (components.some(({ weight }) => !Number.isFinite(weight) || weight < 0) ||
      (Math.abs(weightTotal - 1) > 0.00001 && Math.abs(weightTotal - 100) > 0.00001)) {
    throw new Error("Grading weights must total 100%.");
  }
  return { components: components.map(({ weight, ...component }) => ({ ...component, weight: weight / weightTotal })), gradeScale };
}

export function calculateWeightedGrade(scores: GradeScores, formula: GradingFormulaConfig) {
  const missing = formula.components.filter(({ key, weight }) => weight > 0 && scores[key] === null).map(({ key }) => key);
  if (missing.length) return { complete: false as const, missing };
  const compositeScore = Math.round(formula.components.reduce(
    (total, { key, weight }) => total + (scores[key] ?? 0) * weight, 0,
  ) * 10) / 10;
  return { complete: true as const, compositeScore, letterGrade: calculateLetterGrade(compositeScore, formula.gradeScale) };
}
