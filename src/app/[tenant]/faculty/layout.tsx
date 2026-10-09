import { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { SystemRole } from "@prisma/client";
import { db } from "@/lib/db";
import { requireTenantRole } from "@/lib/authz";
import { isDemoMode } from "@/lib/runtime-mode";
import { FacultySidebar } from "@/components/layout/FacultySidebar";
import { FacultyHeader } from "@/components/layout/FacultyHeader";
import { SidebarProvider } from "@/components/layout/SidebarContext";

export default async function FacultySupervisorLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { tenant: string };
}) {
  const demoMode = isDemoMode();
  let actorId: string | null = null;
  let tenantId: string | null = null;
  let tenantName = "Practicum Institution";

  if (demoMode) {
    const tenant = await db.organisation.findUnique({ where: { slug: params.tenant } });
    if (!tenant) notFound();
    tenantId = tenant.id;
    tenantName = tenant.name;
  } else {
    try {
      const { actor, tenant } = await requireTenantRole(params.tenant, [
        SystemRole.ACADEMIC_SUPERVISOR,
      ]);
      actorId = actor.id;
      tenantId = tenant.id;
      tenantName = tenant.name;
    } catch {
      redirect("/auth/login?error=access");
    }
  }

  const faculty = await db.person.findFirst({
    where: demoMode
      ? { roleMemberships: { some: { role: "ACADEMIC_SUPERVISOR" } } }
      : { id: actorId! },
    include: {
      academicSupervisedAllocations: {
        where: { cycle: { tenantId: tenantId! } },
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
