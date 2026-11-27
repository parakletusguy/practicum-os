"use client";

import { useState, useTransition } from "react";
import { savePracticeReportAction } from "@/modules/grading/report-actions";
import { reportLabels, type ReportStage } from "@/modules/grading/practice-report";

export function ReportForm({ tenantSlug, allocationId, stage, submissionId }: {
  tenantSlug: string; allocationId: string; stage: ReportStage; submissionId?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  return (
    <form className="space-y-3" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      startTransition(async () => setResult(await savePracticeReportAction(tenantSlug, allocationId, form)));
    }}>
      <input type="hidden" name="role" value={submissionId ? "faculty" : "student"} />
      <input type="hidden" name="stage" value={stage} />
      {submissionId && <>
        <input type="hidden" name="submissionId" value={submissionId} />
        <label className="block text-sm">Score out of 100<input className="block rounded border p-2" name="score" required type="number" min="0" max="100" step="0.01" /></label>
      </>}
      <label className="block text-sm">{submissionId ? "Feedback" : reportLabels[stage]}
        <textarea name={submissionId ? "feedback" : "body"} required minLength={20} maxLength={12000} rows={5} className="block w-full rounded border p-2" />
      </label>
      <button disabled={pending} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {pending ? "Saving…" : submissionId ? "Record assessment" : "Submit for review"}
      </button>
      {result && <p role={result.success ? "status" : "alert"} className="text-sm">{result.message}</p>}
    </form>
  );
}
