"use client";

import { useState, useTransition } from "react";
import type { CycleStatus } from "@prisma/client";
import { updateCycleStatusAction } from "@/modules/practicum-core/actions";

const labels: Record<CycleStatus, string> = {
  PLANNING: "Return to planning",
  CAPACITY_OPEN: "Open capacity collection",
  MATCHING: "Open matching",
  ACTIVE: "Start the cycle",
  ASSESSMENT: "Open assessment",
  GRADING: "Open grading",
  ARCHIVED: "Archive cycle",
};

export function CycleStatusControl({ tenantSlug, cycleId, nextStatus }: {
  tenantSlug: string;
  cycleId: string;
  nextStatus: CycleStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  function advance() {
    if (nextStatus === "ARCHIVED" && !window.confirm("Archive this cycle and make it read-only?")) return;
    setError("");
    startTransition(async () => {
      const result = await updateCycleStatusAction(tenantSlug, cycleId, nextStatus);
      if (!result.success) setError(result.error || "The cycle could not be updated.");
    });
  }

  return (
    <div className="mt-3 space-y-2">
      <button type="button" onClick={advance} disabled={pending} className="rounded-lg border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-800 disabled:opacity-50">
        {pending ? "Updating…" : labels[nextStatus]}
      </button>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
