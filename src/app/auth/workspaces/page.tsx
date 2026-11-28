import Link from "next/link";
import { ArrowRight, Building2, House, LogOut, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { PracticumLogo } from "@/components/layout/PracticumLogo";
import { actionStyle } from "@/components/ui/action-styles";
import { AuthenticationError, AuthorizationError, requireAuthenticatedActor } from "@/lib/authz";
import { db } from "@/lib/db";
import { isDemoMode } from "@/lib/runtime-mode";
import { signOutAction } from "@/app/auth/login/actions";

export const dynamic = "force-dynamic";

export default async function WorkspacesPage() {
  if (isDemoMode()) redirect("/auth/login");
  const actor = await requireAuthenticatedActor().catch((error: unknown) => {
    if (error instanceof AuthenticationError) redirect("/auth/login");
    if (error instanceof AuthorizationError) return null;
    throw error;
  });

  const workspaces = new Map<string, { name: string; role: string }>();
  if (actor) {
    const [memberships, placements] = await Promise.all([
      db.orgMembership.findMany({
        where: { personId: actor.id, status: "ACTIVE" },
        select: { role: true, organisation: { select: { slug: true, name: true, orgType: true, verificationStatus: true } } },
      }),
      db.placementAllocation.findMany({
        where: {
          fieldSupervisorId: actor.id,
          cycle: { tenant: { verificationStatus: { not: "SUSPENDED" } } },
          hostOrg: { memberships: { some: { personId: actor.id, role: "FIELD_SUPERVISOR", status: "ACTIVE" } } },
        },
        select: { cycle: { select: { tenant: { select: { slug: true, name: true } } } } },
        distinct: ["cycleId"],
      }),
    ]);
    if (memberships.some(({ role }) => role === "PLATFORM_SUPERADMIN")) {
      workspaces.set("/platform", { name: "Platform administration", role: "Super administrator" });
    }
    for (const { role, organisation } of memberships) {
      if (organisation.verificationStatus === "SUSPENDED") continue;
      if (role === "STUDENT") workspaces.set(`/${organisation.slug}/student`, { name: organisation.name, role: "Student" });
      if (role === "ACADEMIC_SUPERVISOR") workspaces.set(`/${organisation.slug}/faculty`, { name: organisation.name, role: "Faculty supervisor" });
      if (role === "FIELD_SUPERVISOR" && (organisation.orgType === "UNIVERSITY" || organisation.orgType === "COLLEGE")) {
        workspaces.set(`/${organisation.slug}/field`, { name: organisation.name, role: "Field supervisor" });
      }
      if (role === "COORDINATOR" || role === "INSTITUTION_ADMIN") {
        workspaces.set(`/${organisation.slug}/admin`, { name: organisation.name, role: "Institutional administration" });
      }
    }
    for (const { cycle: { tenant } } of placements) {
      workspaces.set(`/${tenant.slug}/field`, { name: tenant.name, role: "Field supervisor" });
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-7 px-5 py-10 sm:py-16">
      <PracticumLogo />
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Your workspaces</h1>
      {workspaces.size ? (
        <ul className="space-y-3">
          {Array.from(workspaces, ([href, { name, role }]) => {
            const Icon = href === "/platform" ? ShieldCheck : Building2;
            return (
              <li key={href}>
                <Link href={href} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-emerald-700 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><Icon aria-hidden="true" className="size-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-slate-900">{name}</span>
                    <span className="text-sm text-slate-600">{role}</span>
                  </span>
                  <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-emerald-700" />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5">
          <Building2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-emerald-700" />
          <p className="text-sm leading-6 text-slate-700">This account is awaiting workspace access. Ask your practicum office to confirm your email and role.</p>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <Link href="/" className={actionStyle("secondary")}><House aria-hidden="true" className="size-4" /> Return home</Link>
        <form action={signOutAction}><button type="submit" className={actionStyle("secondary")}><LogOut aria-hidden="true" className="size-4" /> Sign out</button></form>
      </div>
    </main>
  );
}
