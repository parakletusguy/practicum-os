"use client";

import { useState, useTransition } from "react";
import { createPlacementOfferAction } from "@/modules/placement-matching/agency-actions";

export function AgencyCapacityControls({ tenantSlug, agencyId, status, cycles }: {
  tenantSlug: string;
  agencyId: string;
  status: string;
  cycles: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const accredited = status === "VERIFIED";
  const buttonStyle = "rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50";
  const inputStyle = "block w-full rounded-lg border border-slate-300 p-2";

  function addCapacity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setMessage("");
    startTransition(async () => {
      const result = await createPlacementOfferAction({
        tenantSlug, hostOrgId: agencyId, cycleId: String(data.get("cycleId")),
        totalSlots: Number(data.get("totalSlots")),
        practiceAreas: String(data.get("practiceAreas")).split(","),
      });
      if (result.success) form.reset();
      setMessage(result.success ? "Placement capacity added." : result.error || "Capacity could not be saved.");
    });
  }

  return (
    <div className="mt-4 space-y-3">
      {accredited && cycles.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-emerald-800">Add placement capacity</summary>
          <form onSubmit={addCapacity} className="mt-2 space-y-2">
            <label className="block text-sm">Cycle
              <select name="cycleId" className={inputStyle}>{cycles.map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.name}</option>)}</select>
            </label>
            <label className="block text-sm">Capacity<input name="totalSlots" type="number" min="1" max="1000" required className={inputStyle} /></label>
            <label className="block text-sm">Practice areas, separated by commas<input name="practiceAreas" required className={inputStyle} /></label>
            <button type="submit" disabled={pending} className={buttonStyle}>Save capacity</button>
          </form>
        </details>
      )}
      {message && <p role="status" className="text-sm text-slate-700">{message}</p>}
    </div>
  );
}
