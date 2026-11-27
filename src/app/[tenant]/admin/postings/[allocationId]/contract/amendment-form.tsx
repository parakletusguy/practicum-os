"use client";

import { useActionState } from "react";
import { issueContractAmendmentAction } from "@/modules/placement-matching/contract-actions";

export function AmendmentForm({ tenantSlug, allocationId, version, addendum }: {
  tenantSlug: string; allocationId: string; version: string; addendum?: string;
}) {
  const [result, action, pending] = useActionState(issueContractAmendmentAction.bind(null, tenantSlug, allocationId, version), { success: false, message: "" });
  return (
    <form action={action} className="space-y-3 rounded-xl border bg-white p-5">
      <h2 className="font-semibold">Issue an amendment</h2>
      <p className="text-sm text-slate-600">The signed contract and its signature history will be kept. Work pauses until all three parties sign the amended version.</p>
      <label className="block text-sm">Revised addendum
        <textarea name="addendum" rows={5} minLength={10} maxLength={4000} defaultValue={addendum} required className="block w-full rounded-lg border p-2" />
      </label>
      <label className="block text-sm">Reason for amendment
        <textarea name="reason" rows={2} minLength={10} maxLength={1000} required className="block w-full rounded-lg border p-2" />
      </label>
      <button disabled={pending} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Issuing…" : "Request fresh signatures"}</button>
      {result.message && <p role={result.success ? "status" : "alert"} className="text-sm">{result.message}</p>}
    </form>
  );
}
