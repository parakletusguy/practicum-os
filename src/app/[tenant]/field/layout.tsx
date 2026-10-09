import { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { SystemRole } from "@prisma/client";
import { db } from "@/lib/db";
import { requireTenantRole } from "@/lib/authz";
import { isDemoMode } from "@/lib/runtime-mode";
import { FieldSidebar } from "@/components/layout/FieldSidebar";
import { FieldHeader } from "@/components/layout/FieldHeader";
import { SidebarProvider } from "@/components/layout/SidebarContext";

export default async function FieldSupervisorLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { tenant: string };
}) {
  const demoMode = isDemoMode();
  let actorId: string | null = null;
  let tenantId: string | null = null;

  if (demoMode) {
    const tenant = await db.organisation.findUnique({ where: { slug: params.tenant } });
    if (!tenant) notFound();
    tenantId = tenant.id;
  } else {
    try {
      const { actor, tenant } = await requireTenantRole(params.tenant, [SystemRole.FIELD_SUPERVISOR]);
      actorId = actor.id;
      tenantId = tenant.id;
    } catch {
      redirect("/auth/login?error=access");
    }
  }

  const fieldSupervisor = await db.person.findFirst({
    where: demoMode
      ? { roleMemberships: { some: { role: "FIELD_SUPERVISOR" } } }
      : { id: actorId! },
    include: {
      fieldSupervisedAllocations: {
        where: { cycle: { tenantId: tenantId! } },
        include: {
          hostOrg: true,
          practiceEvents: { where: { verificationStatus: "PENDING" } },
        },
      },
    },
  });

  const supervisorName = fieldSupervisor
    ? `${fieldSupervisor.firstName} ${fieldSupervisor.lastName}`
    : "Field Supervisor";
  const agencyName =
    fieldSupervisor?.fieldSupervisedAllocations[0]?.hostOrg?.name ||
    "Assigned field agency";
  const pendingCount =
    fieldSupervisor?.fieldSupervisedAllocations.reduce(
      (sum, allocation) => sum + allocation.practiceEvents.length,
      0
    ) || 0;

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
        <FieldSidebar
          tenantSlug={params.tenant}
          supervisorName={supervisorName}
          agencyName={agencyName}
          pendingCount={pendingCount}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <FieldHeader
            tenantSlug={params.tenant}
            supervisorName={supervisorName}
            agencyName={agencyName}
            pendingCount={pendingCount}
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
