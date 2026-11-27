import { z } from "zod";
import { DEFAULT_GRADING_FORMULA, type GradingFormulaConfig } from "./formula";

const weight = z.number().min(0).max(100).refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.000001);
const band = z.object({ label: z.string().trim().toUpperCase().regex(/^[A-Z][A-Z0-9+-]{0,7}$/), minimum: z.number().min(0).max(100).refine((value) => Math.abs(value * 10 - Math.round(value * 10)) < 0.000001) });
const settings = z.object({ weights: z.array(weight).length(4), bands: z.array(band).min(2).max(12) });

export function buildGradingFormula(input: unknown): GradingFormulaConfig {
  const parsed = settings.safeParse(input);
  if (!parsed.success) throw new Error("Enter four weights and 2–12 grade bands. Use up to two decimal places for weights and one for grade thresholds.");
  const { weights } = parsed.data;
  if (weights.reduce((sum, value) => sum + Math.round(value * 100), 0) !== 10000) {
    throw new Error("Grading weights must total 100%.");
  }
  const bands = [...parsed.data.bands].sort((left, right) => right.minimum - left.minimum);
  if (new Set(bands.map(({ label }) => label)).size !== bands.length ||
      new Set(bands.map(({ minimum }) => minimum)).size !== bands.length || bands.at(-1)?.minimum !== 0) {
    throw new Error("Use unique grade labels and thresholds, with the lowest threshold set to 0%.");
  }
  return {
    components: DEFAULT_GRADING_FORMULA.components.map((component, index) => ({ ...component, weight: weights[index] / 100 })),
    gradeScale: Object.fromEntries(bands.map(({ label, minimum }, index) => [
      label, [minimum, index === 0 ? 100 : Math.round(bands[index - 1].minimum * 10 - 1) / 10],
    ])),
  };
}
