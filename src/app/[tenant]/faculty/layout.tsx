import { requirePortalAccess } from "@/lib/portal-access";
import { ReactNode } from "react";
import { db } from "@/lib/db";
import { isDemoMode } from "@/lib/runtime-mode";
import { FacultySidebar } from "@/components/layout/FacultySidebar";
import { FacultyHeader } from "@/components/layout/FacultyHeader";
import { SidebarProvider } from "@/components/layout/SidebarContext";

export default async function FacultySupervisorLayout(
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
  const { actor, tenant } = await requirePortalAccess(params.tenant, "faculty");
  const tenantName = tenant.name;

  const faculty = await db.person.findUnique({
    where: { id: actor.id },
    include: {
      academicSupervisedAllocations: {
        where: { cycle: { tenantId: tenant.id } },
        include: { earlyWarningAlerts: { where: { isResolved: false } } },
      },
    },
  });

  const facultyName = faculty
    ? `${faculty.firstName} ${faculty.lastName}`
    : "Faculty Supervisor";
  const activeAlertsCount =
    faculty?.academicSupervisedAllocations.reduce(
      (sum, allocation) => sum + allocation.earlyWarningAlerts.length,
      0
    ) || 0;

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
        <FacultySidebar
          tenantSlug={params.tenant}
          facultyName={facultyName}
          departmentName={tenantName}
          activeAlertsCount={activeAlertsCount}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <FacultyHeader
            tenantSlug={params.tenant}
            facultyName={facultyName}
            departmentName={tenantName}
            activeAlertsCount={activeAlertsCount}
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
