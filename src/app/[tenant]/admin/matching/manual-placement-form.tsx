"use client";

import { useState, useTransition } from "react";
import { manualAllocateStudentAction } from "@/modules/placement-matching/matching-actions";

type Option = { id: string; name: string };
type Offer = Option & { hostOrgId: string };
type FieldSupervisor = Option & { organisationId: string };

export function ManualPlacementForm({ tenantSlug, tenantId, cycleId, students, offers, faculty, field }: {
  tenantSlug: string; tenantId: string; cycleId: string;
  students: Option[]; offers: Offer[]; faculty: Option[]; field: FieldSupervisor[];
}) {
  const [offerId, setOfferId] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const offer = offers.find((option) => option.id === offerId);
  const availableField = new Map(field.filter((person) =>
    person.organisationId === tenantId || person.organisationId === offer?.hostOrgId
  ).map(({ id, name }) => [id, name]));
  const selectStyle = "block w-full rounded-lg border p-2";

  return (
    <section className="space-y-3 rounded-xl border bg-white p-5">
      <h2 className="text-lg font-semibold">Assign a placement and supervisors</h2>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => {
        event.preventDefault();
        if (!offer) return;
        const data = new FormData(event.currentTarget);
        setMessage("");
        startTransition(async () => {
          const result = await manualAllocateStudentAction({
            tenantSlug, cycleId, hostOrgId: offer.hostOrgId, placementOfferId: offer.id,
            cohortStudentId: String(data.get("student")), academicSupervisorId: String(data.get("faculty")),
            fieldSupervisorId: String(data.get("field")),
          });
          setMessage(result.success ? "Placement and supervisors saved." : result.error || "The placement could not be saved.");
        });
      }}>
        <label className="text-sm">Student
          <select required name="student" defaultValue="" className={selectStyle}>
            <option value="" disabled>Select a student</option>
            {students.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
          </select>
        </label>
        <label className="text-sm">Placement offer
          <select required value={offerId} onChange={(event) => setOfferId(event.target.value)} className={selectStyle}>
            <option value="" disabled>Select an offer</option>
            {offers.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
          </select>
        </label>
        <label className="text-sm">Faculty supervisor
          <select required name="faculty" defaultValue="" className={selectStyle}>
            <option value="" disabled>Select a faculty supervisor</option>
            {faculty.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
          </select>
        </label>
        <label className="text-sm">Field supervisor
          <select key={offerId} required name="field" defaultValue="" disabled={!offer} className={selectStyle}>
            <option value="" disabled>Select a field supervisor</option>
            {Array.from(availableField, ([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </label>
        <button disabled={pending || !offer} className="justify-self-start rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {pending ? "Saving…" : "Save assignment"}
        </button>
        {message && <p role="status" className="text-sm text-slate-700">{message}</p>}
      </form>
    </section>
  );
}
