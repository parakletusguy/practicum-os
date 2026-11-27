import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { signOutAction } from "@/app/auth/login/actions";
import { AuthenticationError, AuthorizationError, requirePlatformAdmin } from "@/lib/authz";
import { db } from "@/lib/db";
import { fieldDirectorFromSettings } from "@/lib/institution-settings";

export const metadata: Metadata = { title: "Platform administration · PracticumOS" };
export const dynamic = "force-dynamic";

export default async function PlatformPage() {
  const actor = await requirePlatformAdmin().catch((error: unknown) => {
    if (error instanceof AuthenticationError) redirect("/auth/login?next=%2Fplatform");
    if (error instanceof AuthorizationError) notFound();
    throw error;
  });

  const [institutions, openRequests] = await Promise.all([
    db.organisation.findMany({
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
    }),
    db.needRequest.count({ where: { status: "OPEN" } }),
  ]);
  const activeCycles = institutions.reduce((total, { _count }) => total + _count.practicumCycles, 0);
  const textLink = "font-semibold text-emerald-800 underline underline-offset-4 hover:text-emerald-950";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4 sm:px-8">
          <span className="text-lg font-semibold text-emerald-900">PracticumOS</span>
          <nav aria-label="Account" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <Link href="/auth/workspaces" className={textLink}>Your workspaces</Link>
            <form action={signOutAction}><button className={textLink}>Sign out</button></form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-5 py-8 sm:px-8 sm:py-12">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Platform administration</h1>
          <p className="text-sm text-slate-600">{actor.firstName} {actor.lastName} · Super administrator</p>
        </div>

        <dl className="grid grid-cols-3 gap-x-3 border-y border-slate-200 py-5 sm:gap-x-6">
          <div className="flex flex-col justify-between gap-1">
            <dt className="text-sm text-slate-600">Institutions</dt>
            <dd className="text-2xl font-semibold tabular-nums">{institutions.length}</dd>
          </div>
          <div className="flex flex-col justify-between gap-1">
            <dt className="text-sm text-slate-600">Active practicum cycles</dt>
            <dd className="text-2xl font-semibold tabular-nums">{activeCycles}</dd>
          </div>
          <div className="flex flex-col justify-between gap-1">
            <dt className="text-sm text-slate-600">Open community requests</dt>
            <dd className="text-2xl font-semibold tabular-nums">{openRequests}</dd>
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
                        {canManageStaff && <Link href={adminPath + "/access"} aria-label={`Manage staff access for ${institution.name}`} className={textLink}>Manage staff access</Link>}
                        <Link href={adminPath} aria-label={`Open dashboard for ${institution.name}`} className="rounded-md bg-emerald-700 px-3 py-2 font-semibold text-white hover:bg-emerald-800">Open dashboard</Link>
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
          <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <li><Link href="/gateways/matching" className={textLink}>Matching desk</Link></li>
            <li><Link href="/gateways/cases" className={textLink}>Cases and provider vetting</Link></li>
          </ul>
        </section>
      </main>
    </div>
  );
}
