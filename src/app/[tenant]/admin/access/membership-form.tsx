"use client";

import { useActionState } from "react";
import { LoaderCircle, ShieldMinus, UserRoundPlus } from "lucide-react";
import { updateMembershipAction } from "@/modules/practicum-core/membership-actions";
import { actionStyle, formControlStyle } from "@/components/ui/action-styles";

export function MembershipForm({ tenantSlug, membershipId, requestedEmail }: { tenantSlug: string; membershipId?: string; requestedEmail?: string }) {
  const [state, action, pending] = useActionState(
    updateMembershipAction.bind(null, tenantSlug),
    { success: false, message: "" },
  );
  return (
    <form action={action} aria-busy={pending} className="space-y-3">
      <input type="hidden" name="operation" value={membershipId ? "suspend" : "grant"} />
      {membershipId ? <input type="hidden" name="membershipId" value={membershipId} /> : (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">First name<input required name="firstName" autoComplete="given-name" maxLength={100} className={formControlStyle} /></label>
          <label className="text-sm font-medium">Last name<input required name="lastName" autoComplete="family-name" maxLength={100} className={formControlStyle} /></label>
          <label className="text-sm font-medium">Email address<input required type="email" name="email" maxLength={254} defaultValue={requestedEmail} readOnly={Boolean(requestedEmail)} className={formControlStyle} /></label>
          <label className="text-sm font-medium">Role
            <select name="role" required defaultValue="" className={formControlStyle}>
              <option value="" disabled>Choose a role</option>
              <option value="COORDINATOR">Coordinator</option>
              <option value="ACADEMIC_SUPERVISOR">Faculty supervisor</option>
              <option value="FIELD_SUPERVISOR">Field supervisor</option>
              <option value="STUDENT">Student</option>
            </select>
          </label>
        </div>
      )}
      <button type="submit" disabled={pending} className={actionStyle(membershipId ? "secondary" : "primary")}>
        {pending ? <LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin" /> : membershipId
          ? <ShieldMinus aria-hidden="true" className="size-4" /> : <UserRoundPlus aria-hidden="true" className="size-4" />}
        {pending ? "Saving…" : membershipId ? "Suspend" : "Grant access"}
      </button>
      {state.message && <p role={state.success ? "status" : "alert"} className={state.success ? "text-sm text-emerald-700" : "text-sm text-red-700"}>{state.message}</p>}
    </form>
  );
}
