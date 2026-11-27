import { notFound } from "next/navigation";
import { AuthenticationError, AuthorizationError, requireTenantRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { isDemoMode } from "@/lib/runtime-mode";
import { MembershipForm } from "./membership-form";

export default async function AccessPage({ params }: { params: Promise<{ tenant: string }> }) {
  if (isDemoMode()) notFound();
  const { tenant: tenantSlug } = await params;
  const { actor, tenant } = await requireTenantRole(tenantSlug, ["INSTITUTION_ADMIN"]).catch((error: unknown) => {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) notFound();
    throw error;
  });
  const memberships = await db.orgMembership.findMany({
    where: { organisationId: tenant.id, role: { in: ["COORDINATOR", "ACADEMIC_SUPERVISOR", "FIELD_SUPERVISOR", "STUDENT"] } },
    select: { id: true, role: true, status: true, person: { select: { id: true, firstName: true, lastName: true, email: true } } },
    orderBy: [{ person: { lastName: "asc" } }, { role: "asc" }],
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Institutional access</h1>
      <section className="space-y-4 rounded-xl border bg-white p-5">
        <h2 className="text-lg font-semibold">Grant a role</h2>
        <p className="text-sm text-slate-600">Enter the email the user will use to sign in. They can then request a sign-in link from PracticumOS.</p>
        <MembershipForm tenantSlug={tenant.slug} />
      </section>
      <section className="space-y-3 rounded-xl border bg-white p-5">
        <h2 className="text-lg font-semibold">Institutional memberships</h2>
        {memberships.length === 0 && <p className="text-sm text-slate-600">No memberships have been added.</p>}
        <ul className="divide-y">
          {memberships.map(({ id, role, status, person }) => (
            <li key={id} className="flex flex-wrap justify-between gap-2 py-3">
              <div>
                <p className="font-medium">{person.firstName} {person.lastName}</p>
                <p className="text-sm text-slate-600">{person.email}</p>
                <p className="text-sm capitalize text-slate-600">{role.toLowerCase().replaceAll("_", " ")} · {status.toLowerCase()}</p>
              </div>
              {status !== "SUSPENDED" && person.id !== actor.id && <MembershipForm tenantSlug={tenant.slug} membershipId={id} />}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
