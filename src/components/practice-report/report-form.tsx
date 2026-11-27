"use client";

import { useState, useTransition } from "react";
import { savePracticeReportAction } from "@/modules/grading/report-actions";
import { reportLabels, type ReportStage } from "@/modules/grading/practice-report";
import type { PortfolioEvidence } from "@/modules/grading/portfolio-evidence";

export function ReportForm({ tenantSlug, allocationId, stage, submissionId, initialBody, evidenceOptions = [], selectedEvidence = [] }: {
  tenantSlug: string; allocationId: string; stage: ReportStage; submissionId?: string; initialBody?: string;
  evidenceOptions?: (Omit<PortfolioEvidence, "includeAttachment"> & { attachment: boolean })[];
  selectedEvidence?: PortfolioEvidence[];
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [entries, setEntries] = useState(() => selectedEvidence.map(({ id }) => id));
  const [attachments, setAttachments] = useState(() => selectedEvidence.filter(({ includeAttachment }) => includeAttachment).map(({ id }) => id));
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
        <textarea name={submissionId ? "feedback" : "body"} defaultValue={initialBody} required minLength={20} maxLength={12000} rows={5} className="block w-full rounded border p-2" />
      </label>
      {!submissionId && stage === "FINAL" && (
        <fieldset className="space-y-2">
          <legend className="font-semibold">Verified portfolio evidence</legend>
          {!evidenceOptions.length && <p className="text-sm text-slate-600">Entries will appear here after field supervisor verification.</p>}
          {evidenceOptions.length > 0 && <div className="max-h-80 divide-y overflow-y-auto rounded-lg border px-3">
            {evidenceOptions.map(({ id, title, date, attachment }) => (
              <div key={id} className="space-y-1 py-2 text-sm">
                <label className="flex items-start gap-2"><input type="checkbox" name="entryId" value={id} checked={entries.includes(id)} onChange={(event) => {
                  if (event.target.checked) setEntries([...entries, id]);
                  else {
                    setEntries(entries.filter((item) => item !== id));
                    setAttachments(attachments.filter((item) => item !== id));
                  }
                }} /> <span>{title} · {date}</span></label>
                {attachment && <div className="ml-6 flex flex-wrap gap-2">
                  <label className="flex gap-2"><input type="checkbox" name="attachmentId" value={id} disabled={!entries.includes(id)} checked={attachments.includes(id)}
                    onChange={(event) => setAttachments(event.target.checked ? [...attachments, id] : attachments.filter((item) => item !== id))} /> Include approved attachment</label>
                  <a href={`/api/evidence/${id}`} target="_blank" rel="noreferrer" className="text-emerald-800 underline">Open attachment</a>
                </div>}
              </div>
            ))}
          </div>}
        </fieldset>
      )}
      <button disabled={pending} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {pending ? "Saving…" : submissionId ? "Record assessment" : "Submit for review"}
      </button>
      {result && <p role={result.success ? "status" : "alert"} className="text-sm">{result.message}</p>}
    </form>
  );
}
