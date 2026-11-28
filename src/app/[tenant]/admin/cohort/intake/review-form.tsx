"use client";

import { useActionState, useState } from "react";
import { ArchiveX, UserPlus } from "lucide-react";
import { actionStyle, formControlStyle } from "@/components/ui/action-styles";
import { reviewRsuStudentIntakeAction } from "@/modules/practicum-core/student-intake-actions";

export function IntakeReviewForm({ responseId, cycles }: {
  responseId: string;
  cycles: { id: string; name: string }[];
}) {
  const [error, action, pending] = useActionState(reviewRsuStudentIntakeAction, null);
  const [confirmDismissal, setConfirmDismissal] = useState(false);
  const labelId = `cycle-${responseId}`;

  return (
    <form action={action} aria-busy={pending} className="max-w-full space-y-2">
      <input type="hidden" name="responseId" value={responseId} />
      <fieldset disabled={pending} className="flex flex-wrap items-end gap-2">
        {cycles.length > 0 && (
          <>
            <div className="min-w-0 max-w-full">
              <label htmlFor={labelId} className="mb-1 block text-sm font-medium">Practicum cycle</label>
              <select id={labelId} name="cycleId" defaultValue={cycles.length === 1 ? cycles[0].id : ""} required
                className={formControlStyle}>
                <option value="" disabled>Choose a cycle</option>
                {cycles.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </select>
            </div>
            <button type="submit" name="decision" value="enrol" className={actionStyle()}>
              <UserPlus aria-hidden="true" className="size-4" /> Add to roster
            </button>
          </>
        )}
        {confirmDismissal ? (
          <div className="basis-full space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-slate-800">Dismiss this registration and remove it from the review queue?</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setConfirmDismissal(false)} className={actionStyle("secondary")}>Keep response</button>
              <button type="submit" name="decision" value="dismiss" formNoValidate className={actionStyle("danger")}>Dismiss registration</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmDismissal(true)} className={actionStyle("secondary")}>
            <ArchiveX aria-hidden="true" className="size-4" /> Dismiss
          </button>
        )}
      </fieldset>
      {pending && <p role="status" className="text-sm text-slate-600">Saving review…</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </form>
  );
}
