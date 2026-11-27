"use client";

import { useState, useTransition } from "react";
import type { ContractRole } from "@/modules/placement-matching/learning-contract";
import { signLearningContractAction } from "@/modules/placement-matching/contract-actions";

export function ContractForm({ tenantSlug, allocationId, role, version }: {
  tenantSlug: string; allocationId: string; role: ContractRole; version: string;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  return (
    <form className="space-y-3" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      startTransition(async () => setResult(await signLearningContractAction({
        tenantSlug, allocationId, role, version,
        agreed: form.get("agreed") === "on",
        signature: String(form.get("signature") || ""),
      })));
    }}>
      <label className="flex gap-2 text-sm"><input type="checkbox" name="agreed" required /> I agree to this version of the learning contract.</label>
      <label className="block text-sm">Full name
        <input name="signature" maxLength={200} required className="block w-full rounded-lg border p-2" />
      </label>
      <button disabled={pending || result?.success} className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50">
        {pending ? "Signing…" : "Sign contract"}
      </button>
      {result && <p role={result.success ? "status" : "alert"}>{result.message}</p>}
    </form>
  );
}
