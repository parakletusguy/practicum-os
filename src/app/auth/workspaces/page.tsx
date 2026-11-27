import Link from "next/link";
import { redirect } from "next/navigation";
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
        select: { role: true, organisation: { select: { slug: true, name: true, orgType: true } } },
      }),
      db.placementAllocation.findMany({
        where: {
          fieldSupervisorId: actor.id,
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
    <main className="mx-auto max-w-2xl space-y-6 px-5 py-16">
      <h1 className="text-3xl font-bold text-slate-900">Your workspaces</h1>
      {workspaces.size ? (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {Array.from(workspaces, ([href, { name, role }]) => (
            <li key={href}>
              <Link href={href} className="block p-4 hover:bg-emerald-50">
                <span className="block font-semibold text-emerald-900">{name}</span>
                <span className="text-sm text-slate-600">{role}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-slate-700">No institutional workspace is available for this account. Ask your practicum office to confirm your email and role.</p>
      )}
      <div className="flex gap-5 text-sm font-semibold text-emerald-700">
        <Link href="/" className="underline">Return home</Link>
        <form action={signOutAction}><button className="underline">Sign out</button></form>
      </div>
    </main>
  );
}
