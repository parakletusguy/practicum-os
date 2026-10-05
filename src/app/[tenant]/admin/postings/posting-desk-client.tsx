"use client";

import { useState, useTransition } from "react";
import { Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { dispatchPostingLettersAction } from "@/modules/placement-matching/posting-actions";

interface PostingDeskClientProps {
  tenantSlug: string;
  cycleId: string;
  pendingCount: number;
}

export function PostingDeskClient({
  tenantSlug,
  cycleId,
  pendingCount,
}: PostingDeskClientProps) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleDispatch = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await dispatchPostingLettersAction(tenantSlug, cycleId);
      if (res.success) {
        setFeedback(res.message || "Posting letters dispatched successfully.");
      } else {
        setFeedback(res.error || "Failed to dispatch posting letters.");
      }
    });
  };

  return (
    <div className="flex items-center gap-3">
      {feedback && (
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          {feedback}
        </span>
      )}

      <button
        type="button"
        disabled={isPending}
        onClick={handleDispatch}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        Dispatch Posting Letters ({pendingCount})
      </button>
    </div>
  );
}
