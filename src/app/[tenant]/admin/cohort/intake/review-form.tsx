"use client";

import { useActionState } from "react";
import { reviewRsuStudentIntakeAction } from "@/modules/practicum-core/student-intake-actions";

export function IntakeReviewForm({ responseId, cycles }: {
  responseId: string;
  cycles: { id: string; name: string }[];
}) {
  const [error, action, pending] = useActionState(reviewRsuStudentIntakeAction, null);
  const labelId = `cycle-${responseId}`;

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="responseId" value={responseId} />
      <fieldset disabled={pending} className="flex flex-wrap items-end gap-2">
        {cycles.length > 0 && (
          <>
            <div className="min-w-0 max-w-full">
              <label htmlFor={labelId} className="mb-1 block text-sm font-medium">Practicum cycle</label>
              <select id={labelId} name="cycleId" defaultValue={cycles.length === 1 ? cycles[0].id : ""} required
                className="max-w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value="" disabled>Choose a cycle</option>
                {cycles.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </select>
            </div>
            <button type="submit" name="decision" value="enrol"
              className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
              Add to roster
            </button>
          </>
        )}
        <button type="submit" name="decision" value="dismiss" formNoValidate
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
          Dismiss
        </button>
      </fieldset>
      {pending && <p role="status" className="text-sm text-slate-600">Saving review…</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </form>
  );
}
