"use client";

import { useActionState, useState } from "react";
import { reviewPartnerAgencyAction } from "@/modules/placement-matching/agency-actions";

export function AccreditationReviewForm({ tenantSlug, agencyId, version, dueOn }: {
  tenantSlug: string; agencyId: string; version: string; dueOn: string | null;
}) {
  const [state, action, pending] = useActionState(reviewPartnerAgencyAction.bind(null, tenantSlug, agencyId, version), { success: false, message: "" });
  const [status, setStatus] = useState("VERIFIED");
  return (
    <form action={action} className="space-y-3 rounded-xl border bg-white p-5">
      <h2 className="font-semibold">Record accreditation review</h2>
      <label className="block text-sm">Decision
        <select className="block w-full rounded border p-2" name="status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="VERIFIED">Approve or renew</option>
          <option value="SUSPENDED">Suspend accreditation</option>
        </select>
      </label>
      <label className="block text-sm">Next renewal date
        <input className="block w-full rounded border p-2" type="date" name="renewalDueOn" defaultValue={dueOn ?? ""} required={status === "VERIFIED"} />
      </label>
      <label className="block text-sm">Review notes
        <textarea className="block w-full rounded border p-2" name="notes" rows={3} minLength={10} maxLength={2000} required />
      </label>
      <button className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={pending}>{pending ? "Saving…" : "Save review"}</button>
      {state.message && <p role={state.success ? "status" : "alert"} className="text-sm">{state.message}</p>}
    </form>
  );
}
