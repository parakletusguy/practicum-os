import { fieldSupervisorScope } from "@/lib/record-access";
import { requirePortalAccess } from "@/lib/portal-access";
import { ReactNode } from "react";
import { db } from "@/lib/db";
import { isDemoMode } from "@/lib/runtime-mode";
import { FieldSidebar } from "@/components/layout/FieldSidebar";
import { FieldHeader } from "@/components/layout/FieldHeader";
import { SidebarProvider } from "@/components/layout/SidebarContext";

export default async function FieldSupervisorLayout(
  props: {
    children: ReactNode;
    params: Promise<{ tenant: string }>;
  }
) {
  const params = await props.params;

  const {
    children
  } = props;

  const demoMode = isDemoMode();
  const { actor, tenant } = await requirePortalAccess(params.tenant, "field");

  const fieldSupervisor = await db.person.findUnique({
    where: { id: actor.id },
    include: {
      fieldSupervisedAllocations: {
        where: fieldSupervisorScope(actor.id, tenant.id),
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
