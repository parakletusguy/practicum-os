"use client";

import { useActionState, useState } from "react";
import type { GradingFormulaConfig } from "@/modules/grading/formula";
import { saveGradingSettingsAction } from "@/modules/grading/grading-settings-action";

export function GradingSettingsForm({ tenantSlug, cycleId, version, formula, locked }: {
  tenantSlug: string; cycleId: string; version: string; formula: GradingFormulaConfig; locked: boolean;
}) {
  const [result, action, pending] = useActionState(saveGradingSettingsAction.bind(null, tenantSlug, cycleId, version), { message: "", success: false });
  const [bands, setBands] = useState(() => Object.entries(formula.gradeScale).sort((a, b) => b[1][0] - a[1][0])
    .map(([label, [minimum]], id) => ({ id, label, minimum: String(minimum) })));
  const [nextId, setNextId] = useState(bands.length);
  const [weights, setWeights] = useState(() => formula.components.map(({ weight }) => String(Math.round(weight * 10000) / 100)));
  const total = weights.reduce((sum, weight) => sum + Number(weight), 0);
  const field = "block w-full rounded-lg border border-slate-300 px-3 py-2";

  return (
    <form action={action} className="space-y-5 rounded-xl border bg-white p-5">
      {locked && <p className="text-sm text-slate-600">These settings are locked because grading has started or results already exist.</p>}
      <fieldset disabled={locked || pending} className="space-y-3">
        <legend className="text-lg font-semibold">Component weights</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {formula.components.map(({ key, name }, index) => (
            <label key={key} className="text-sm">{name} (%)
              <input name="weight" type="number" min="0" max="100" step="0.01" required className={field}
                value={weights[index]} onChange={(event) => setWeights(weights.map((weight, i) => index === i ? event.target.value : weight))} />
            </label>
          ))}
        </div>
        <p className="text-sm text-slate-600" role="status">Total {Math.round(total * 100) / 100}% of 100%</p>
      </fieldset>
      <fieldset disabled={locked || pending} className="space-y-3">
        <legend className="text-lg font-semibold">Grade bands</legend>
        <p className="text-sm text-slate-600">Set the minimum score for each grade. The lowest band starts at 0%.</p>
        {bands.map((band, index) => (
          <div key={band.id} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
            <label className="text-sm">Grade {index + 1}
              <input name="label" value={band.label} onChange={(event) => setBands(bands.map((item) => item.id === band.id ? { ...item, label: event.target.value } : item))} maxLength={8} required className={field} />
            </label>
            <label className="text-sm">Minimum (%)
              <input name="minimum" type="number" step="0.1" min="0" max="100" required value={band.minimum} className={field}
                onChange={(event) => setBands(bands.map((item) => item.id === band.id ? { ...item, minimum: event.target.value } : item))} />
            </label>
            {!locked && <button type="button" disabled={bands.length <= 2} onClick={() => setBands(bands.filter((item) => item.id !== band.id))} className="px-2 py-2 text-sm text-slate-700 disabled:opacity-50" aria-label={`Remove grade ${index + 1}`}>Remove</button>}
          </div>
        ))}
        {!locked && <button type="button" disabled={bands.length >= 12} className="rounded border px-3 py-2 text-sm" onClick={() => {
          setBands([...bands, { id: nextId, label: "", minimum: "" }]);
          setNextId(nextId + 1);
        }}>Add grade band</button>}
      </fieldset>
      {!locked && <button disabled={pending} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Saving…" : "Save grading settings"}</button>}
      {result.message && <p role={result.success ? "status" : "alert"} className="text-sm">{result.message}</p>}
    </form>
  );
}
