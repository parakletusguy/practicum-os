import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Inbox, ShieldCheck, UserRoundPlus, Users } from "lucide-react";
import { AuthenticationError, AuthorizationError, requireTenantRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { isDemoMode } from "@/lib/runtime-mode";
import { MembershipForm } from "./membership-form";
import { actionStyle } from "@/components/ui/action-styles";

export default async function AccessPage({ params }: { params: Promise<{ tenant: string }> }) {
  if (isDemoMode()) notFound();
  const { tenant: tenantSlug } = await params;
  const { actor, tenant } = await requireTenantRole(tenantSlug, ["INSTITUTION_ADMIN"]).catch((error: unknown) => {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) notFound();
    throw error;
  });
  const [memberships, requests] = await Promise.all([db.orgMembership.findMany({
    where: { organisationId: tenant.id, role: { in: ["INSTITUTION_ADMIN", "COORDINATOR", "ACADEMIC_SUPERVISOR", "FIELD_SUPERVISOR", "STUDENT"] } },
    select: { id: true, role: true, status: true, person: { select: { id: true, firstName: true, lastName: true, email: true, authUserId: true, isActive: true } } },
    orderBy: [{ person: { lastName: "asc" } }, { role: "asc" }],
  }), tenant.slug === "rsu" ? db.auditLog.findMany({
    where: { tenantId: tenant.id, actionType: "RSU_PILOT_ACCESS_REQUESTED", resourceType: "AuthIdentity" },
    select: { id: true, afterState: true, createdAt: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  }) : []]);
  const seenEmails = new Set(memberships.filter(({ status, person }) => status === "ACTIVE" && person.isActive).map(({ person }) => person.email));
  const pending = requests.flatMap(({ id, afterState, createdAt }) => {
    if (!afterState || typeof afterState !== "object" || Array.isArray(afterState) ||
      typeof afterState.email !== "string" || seenEmails.has(afterState.email)) return [];
    seenEmails.add(afterState.email);
    return [{ id, email: afterState.email, createdAt }];
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-3 border-b border-slate-200 pb-5">
        <Link href={`/${tenant.slug}/admin`} className={actionStyle("secondary")}>
          <ArrowLeft aria-hidden="true" className="size-4" /> Dashboard
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Institutional access</h1>
        <p className="text-sm text-slate-600">Grant roles and check which accounts have linked their sign-in.</p>
      </header>
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><UserRoundPlus aria-hidden="true" className="size-5 text-emerald-800" /> Grant a role</h2>
        <p className="text-sm text-slate-600">Use the email address the person will sign in with.</p>
        <MembershipForm tenantSlug={tenant.slug} />
      </section>
      {tenant.slug === "rsu" && <section className="space-y-3 rounded-xl border bg-white p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Inbox aria-hidden="true" className="size-5 text-emerald-800" /> Verified email requests</h2>
        {!pending.length && <p className="text-sm text-slate-600">No pending requests.</p>}
        {pending.map(({ id, email, createdAt }) => <details key={id} className="border-t pt-2">
          <summary className="cursor-pointer break-all text-sm font-medium">{email} · {createdAt.toISOString().slice(0, 10)}</summary>
          <div className="mt-3"><MembershipForm tenantSlug={tenant.slug} requestedEmail={email} /></div>
        </details>)}
      </section>}
      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Users aria-hidden="true" className="size-5 text-emerald-800" /> Institutional memberships</h2>
        {memberships.length === 0 && <p className="text-sm text-slate-600">No memberships have been added.</p>}
        <ul className="divide-y">
          {memberships.map(({ id, role, status, person }) => (
            <li key={id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0 space-y-1">
                <p className="font-medium">{person.firstName} {person.lastName}</p>
                <p className="break-all text-sm text-slate-600">{person.email}</p>
                <p className="text-sm capitalize text-slate-600">{role.toLowerCase().replaceAll("_", " ")} · {status.toLowerCase()}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {status === "ACTIVE" && person.isActive && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                    {person.authUserId && <ShieldCheck aria-hidden="true" className="size-4 text-emerald-800" />}
                    {person.authUserId ? "Sign-in linked" : "First sign-in pending"}
                  </span>
                )}
                {role !== "INSTITUTION_ADMIN" && status !== "SUSPENDED" && person.id !== actor.id && <MembershipForm tenantSlug={tenant.slug} membershipId={id} />}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
