import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LayoutGrid, LogOut, Network, ShieldCheck, Users } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { PracticumLogo } from "@/components/layout/PracticumLogo";
import { actionStyle } from "@/components/ui/action-styles";
import { signOutAction } from "@/app/auth/login/actions";
import { AuthenticationError, AuthorizationError, requirePlatformAdmin } from "@/lib/authz";
import { db } from "@/lib/db";
import { fieldDirectorFromSettings, isDemoInstitution } from "@/lib/institution-settings";

export const metadata: Metadata = { title: "Platform administration · PracticumOS" };
export const dynamic = "force-dynamic";

export default async function PlatformPage() {
  const actor = await requirePlatformAdmin().catch((error: unknown) => {
    if (error instanceof AuthenticationError) redirect("/auth/login?next=%2Fplatform");
    if (error instanceof AuthorizationError) notFound();
    throw error;
  });

  const organisations = await db.organisation.findMany({
    where: { tenantId: null, orgType: { in: ["UNIVERSITY", "COLLEGE"] } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      settings: true,
      _count: { select: { practicumCycles: { where: { status: "ACTIVE" } } } },
      memberships: {
        where: { personId: actor.id, status: "ACTIVE", role: { in: ["INSTITUTION_ADMIN", "COORDINATOR"] } },
        select: { role: true },
      },
    },
  });
  const institutions = organisations.filter(({ settings }) => !isDemoInstitution(settings));
  const activeCycles = institutions.reduce((total, { _count }) => total + _count.practicumCycles, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4 sm:px-8">
          <PracticumLogo />
          <nav aria-label="Account" className="flex flex-wrap items-center gap-2">
            <Link href="/auth/workspaces" className={actionStyle("secondary")}><LayoutGrid aria-hidden="true" className="size-4" /> Your workspaces</Link>
            <form action={signOutAction}><button type="submit" className={actionStyle("secondary")}><LogOut aria-hidden="true" className="size-4" /> Sign out</button></form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-5 py-8 sm:px-8 sm:py-12">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Platform administration</h1>
          <p className="text-sm text-slate-600">{actor.firstName} {actor.lastName} · Super administrator</p>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 border-y border-slate-200 py-5 sm:max-w-md sm:gap-x-6">
          <div className="flex flex-col justify-between gap-1">
            <dt className="text-sm text-slate-600">Institutions</dt>
            <dd className="text-2xl font-semibold tabular-nums">{institutions.length}</dd>
          </div>
          <div className="flex flex-col justify-between gap-1">
            <dt className="text-sm text-slate-600">Active practicum cycles</dt>
            <dd className="text-2xl font-semibold tabular-nums">{activeCycles}</dd>
          </div>
        </dl>

        <section aria-labelledby="institutions-heading" className="space-y-3">
          <h2 id="institutions-heading" className="text-xl font-semibold">Institutions</h2>
          {institutions.length ? (
            <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
              {institutions.map((institution) => {
                const fieldDirector = fieldDirectorFromSettings(institution.settings);
                const adminPath = `/${institution.slug}/admin`;
                const count = institution._count.practicumCycles;
                const canManageStaff = institution.memberships.some(({ role }) => role === "INSTITUTION_ADMIN");
                return (
                  <li key={institution.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-5 py-4">
                    <div className="space-y-1">
                      <h3 className="font-semibold">{institution.name}</h3>
                      {fieldDirector && <p className="text-sm text-slate-700">{fieldDirector.name} · Field Director</p>}
                      <p className="text-sm text-slate-600">{count ? `${count} active practicum ${count === 1 ? "cycle" : "cycles"}` : "No active practicum cycle"}</p>
                    </div>
                    {institution.memberships.length > 0 && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-sm">
                        {canManageStaff && <Link href={adminPath + "/access"} aria-label={`Manage staff access for ${institution.name}`} className={actionStyle("secondary")}><Users aria-hidden="true" className="size-4" /> Manage staff access</Link>}
                        <Link href={adminPath} aria-label={`Open dashboard for ${institution.name}`} className={actionStyle()}>Open dashboard <ArrowRight aria-hidden="true" className="size-4" /></Link>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : <p className="text-sm text-slate-600">No institutions have been set up.</p>}
        </section>

        <section aria-labelledby="community-heading" className="space-y-3">
          <h2 id="community-heading" className="text-xl font-semibold">Community services</h2>
          <ul className="flex flex-wrap gap-3">
            <li><Link href="/gateways/matching" className={actionStyle("secondary")}><Network aria-hidden="true" className="size-4" /> Matching desk</Link></li>
            <li><Link href="/gateways/cases" className={actionStyle("secondary")}><ShieldCheck aria-hidden="true" className="size-4" /> Cases and provider vetting</Link></li>
          </ul>
        </section>
      </main>
    </div>
  );
}
