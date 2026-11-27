"use client";

import { useActionState } from "react";
import { updateMembershipAction } from "@/modules/practicum-core/membership-actions";

export function MembershipForm({ tenantSlug, membershipId, requestedEmail }: { tenantSlug: string; membershipId?: string; requestedEmail?: string }) {
  const [state, action, pending] = useActionState(
    updateMembershipAction.bind(null, tenantSlug),
    { success: false, message: "" },
  );
  const inputStyle = "block w-full rounded-lg border border-slate-300 p-2";
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="operation" value={membershipId ? "suspend" : "grant"} />
      {membershipId ? <input type="hidden" name="membershipId" value={membershipId} /> : (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">First name<input required name="firstName" className={inputStyle} /></label>
          <label className="space-y-1 text-sm">Last name<input required name="lastName" className={inputStyle} /></label>
          <label className="space-y-1 text-sm">Email<input required type="email" name="email" defaultValue={requestedEmail} readOnly={Boolean(requestedEmail)} className={inputStyle} /></label>
          <label className="space-y-1 text-sm">Role
            <select name="role" className={inputStyle}>
              <option value="STUDENT">Student</option>
              <option value="FIELD_SUPERVISOR">Field supervisor</option>
              <option value="ACADEMIC_SUPERVISOR">Faculty supervisor</option>
              <option value="COORDINATOR">Coordinator</option>
            </select>
          </label>
        </div>
      )}
      <button type="submit" disabled={pending} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 disabled:opacity-50">
        {pending ? "Saving…" : membershipId ? "Suspend" : "Grant access"}
      </button>
      {state.message && <p role={state.success ? "status" : "alert"} className={state.success ? "text-sm text-emerald-700" : "text-sm text-red-700"}>{state.message}</p>}
    </form>
  );
}
