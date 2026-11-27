"use client";

import { useState, useTransition } from "react";
import { createPracticeEventAction } from "@/modules/logbook/actions";
import { openOrCreateNotebook, saveNotebookDrafts, type OfflineNotebook } from "../../public/offline-logbook/notebook.mjs";

async function prepareOfflinePage() {
  if (!("serviceWorker" in navigator) || !("caches" in window)) throw new Error("This browser does not support offline reopening.");
  const registration = await navigator.serviceWorker.register("/sw.js");
  const installing = registration.installing || registration.waiting;
  if (installing && installing.state !== "activated") {
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        installing.removeEventListener("statechange", checkState);
        reject(new Error("The offline page is still downloading. Try again while connected."));
      }, 10000);
      function checkState() {
        if (installing?.state !== "activated" && installing?.state !== "redundant") return;
        window.clearTimeout(timer);
        installing.removeEventListener("statechange", checkState);
        if (installing.state === "activated") resolve();
        else reject(new Error("Could not install the offline page. Try again while connected."));
      }
      installing.addEventListener("statechange", checkState);
      checkState();
    });
  }
  if (!await caches.match("/offline-logbook/index.html")) throw new Error("The offline page is still downloading. Try again while connected.");
}

export function OfflineLogbook({ tenantSlug, allocationId, scope, canSubmit }: {
  tenantSlug: string; allocationId: string; scope: string; canSubmit: boolean;
}) {
  const [notebook, setNotebook] = useState<OfflineNotebook | null>(null);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ error: boolean; message: string }>();
  const path = `/${tenantSlug}/student/logbook`;
  const offlineUrl = "/offline-logbook/index.html?logbook=" + encodeURIComponent(path);

  function unlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const passphrase = String(new FormData(form).get("passphrase") ?? "");
    form.reset();
    setFeedback(undefined);
    startTransition(async () => {
      try {
        await prepareOfflinePage();
        setNotebook(await openOrCreateNotebook(path, scope, passphrase, canSubmit));
        setFeedback({ error: false, message: "Offline notebook unlocked on this device." });
      } catch (error) {
        setFeedback({ error: true, message: error instanceof Error ? error.message : "Could not unlock the notebook." });
      }
    });
  }

  function sync() {
    if (!notebook || !canSubmit) return;
    if (!navigator.onLine) {
      setFeedback({ error: true, message: "Reconnect before syncing." });
      return;
    }
    setFeedback(undefined);
    startTransition(async () => {
      const remaining = new Map(notebook.drafts.map((entry) => [entry.id, entry]));
      let synced = 0;
      try {
        for (const draft of notebook.drafts) {
          const { id, error: _previousError, ...entry } = draft;
          const result = await createPracticeEventAction({ ...entry, tenantSlug, allocationId, submissionId: id });
          if (result.success) {
            remaining.delete(id);
            synced++;
          } else {
            remaining.set(id, { ...draft, error: result.error || "Submission declined. Review the saved entry." });
          }
        }
        setNotebook(await saveNotebookDrafts(notebook, Array.from(remaining.values())));
        setFeedback({ error: remaining.size > 0, message: `${synced} submitted. ${remaining.size} still saved on this device.` });
      } catch {
        setFeedback({ error: true, message: "Sync stopped. Saved entries can be retried after unlocking again." });
      }
    });
  }

  return (
    <details className="rounded-xl border bg-white p-4">
      <summary className="cursor-pointer text-sm font-semibold text-emerald-800">Offline logbook</summary>
      <div className="mt-3 space-y-3 text-sm">
        <p className="text-slate-600">Set up a passphrase while connected. Reopen this logbook offline to save text entries, then sign in and sync when you reconnect.</p>
        {!notebook ? <form onSubmit={unlock} className="space-y-2">
          <label className="block">Device passphrase
            <input type="password" name="passphrase" minLength={12} maxLength={200} required autoComplete="off" className="mt-1 block w-full max-w-sm rounded-lg border px-3 py-2" />
          </label>
          <button disabled={pending} className="rounded-lg border px-3 py-2 font-semibold text-emerald-800 disabled:opacity-50">{pending ? "Unlocking…" : canSubmit ? "Set up or unlock notebook" : "Unlock notebook"}</button>
        </form> : <>
          <p>{notebook.drafts.length} {notebook.drafts.length === 1 ? "entry" : "entries"} saved on this device.</p>
          {notebook.drafts.some(({ error }) => error) && <ul className="list-disc pl-5">
            {notebook.drafts.filter(({ error }) => error).map(({ id, activityTitle, error }) => <li key={id}>{activityTitle} · {error}</li>)}
          </ul>}
          <div className="flex flex-wrap items-center gap-3">
            <a href={offlineUrl} className="font-semibold text-emerald-800 underline">Open offline notebook</a>
            {canSubmit && notebook.drafts.length > 0 && <button type="button" onClick={sync} disabled={pending} className="rounded-lg border px-3 py-2 font-semibold text-emerald-800 disabled:opacity-50">{pending ? "Syncing…" : "Sync saved entries"}</button>}
            <button type="button" disabled={pending} onClick={() => { setNotebook(null); setFeedback(undefined); }} className="text-slate-700 underline">Lock</button>
          </div>
        </>}
        {feedback && <p role={feedback.error ? "alert" : "status"}>{feedback.message}</p>}
      </div>
    </details>
  );
}
