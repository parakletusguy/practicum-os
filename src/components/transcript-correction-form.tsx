"use client";

import { useState, useTransition } from "react";
import { reviewTranscriptCorrectionAction } from "@/modules/grading/transcript-actions";

export function TranscriptCorrectionForm({ tenantSlug, reference }: { tenantSlug: string; reference: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  return (
    <form className="space-y-2 border-t pt-4 print:hidden" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      startTransition(async () => setResult(await reviewTranscriptCorrectionAction(tenantSlug, reference, String(form.get("reason") || ""))));
    }}>
      <label className="block text-sm">Correction reason
        <textarea name="reason" rows={2} minLength={10} maxLength={2000} required className="block w-full rounded border p-2" />
      </label>
      <button disabled={pending} className="rounded-lg border px-3 py-2 text-sm font-semibold">Record correction decision</button>
      {result && <p role={result.success ? "status" : "alert"} className="text-sm">{result.message}</p>}
    </form>
  );
}
