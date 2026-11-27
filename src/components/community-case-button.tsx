"use client";

import { useState, useTransition } from "react";
import { reviewCommunityProviderAction, updateCommunityCaseAction } from "@/modules/needs-matching/referral-actions";

export function CommunityCaseButton({ id, operation, label }: {
  id: string; operation: "ACCEPT" | "DECLINE" | "COMPLETE" | "REOPEN" | "CLOSE" | "VERIFIED" | "SUSPENDED"; label: string;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  return (
    <div className="space-y-1">
      <button type="button" disabled={pending || result?.success} className="rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50" onClick={() => {
        startTransition(async () => setResult(operation === "VERIFIED" || operation === "SUSPENDED"
          ? await reviewCommunityProviderAction(id, operation)
          : await updateCommunityCaseAction(id, operation)));
      }}>{pending ? "Saving…" : label}</button>
      {result && <p role={result.success ? "status" : "alert"} className="text-sm">{result.message}</p>}
    </div>
  );
}
