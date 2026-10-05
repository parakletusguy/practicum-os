"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { acknowledgeLearningContractAction } from "@/modules/placement-matching/posting-actions";

interface LearningContractClientProps {
  tenantSlug: string;
  allocationId: string;
  isAlreadySigned: boolean;
  studentFullName: string;
}

export function LearningContractClient({
  tenantSlug,
  allocationId,
  isAlreadySigned,
  studentFullName,
}: LearningContractClientProps) {
  const [signed, setSigned] = useState(isAlreadySigned);
  const [signature, setSignature] = useState(studentFullName);
  const [agreed, setAgreed] = useState(isAlreadySigned);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed || !signature.trim()) return;

    startTransition(async () => {
      const res = await acknowledgeLearningContractAction({
        tenantSlug,
        allocationId,
        studentSignature: signature.trim(),
      });

      if (res.success) {
        setSigned(true);
        setFeedback(res.message || "Contract signed successfully.");
      }
    });
  };

  if (signed) {
    return (
      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-emerald-900 font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>Learning Contract & Professional Code of Ethics Signed & Active</span>
        </div>
        <span className="font-mono text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
          Digital Seal Verified
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {feedback && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          {feedback}
        </div>
      )}

      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="agreeCheck"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
        />
        <label htmlFor="agreeCheck" className="text-xs text-slate-700 cursor-pointer">
          I have read and agree to all terms of the <strong>PracticumOS Learning Contract</strong> and the University Code of Professional Practice.
        </label>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Digital Signature (Type Full Legal Name)
          </label>
          <input
            type="text"
            required
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            className="w-full text-xs font-serif italic px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
          />
        </div>

        <button
          type="submit"
          disabled={!agreed || !signature.trim() || isPending}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors disabled:opacity-50 mt-auto cursor-pointer"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPending ? "Registering Signature..." : "Sign & Accept Contract"}
        </button>
      </div>
    </form>
  );
}
