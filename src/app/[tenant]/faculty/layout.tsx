import { ReactNode } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
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
  const tenant = await prisma.organisation.findUnique({
    where: { slug: params.tenant },
  });

  if (!tenant) {
    notFound();
  }

  // Find academic supervisor (or fallback to Adeleke)
  const faculty = await prisma.person.findFirst({
    where: {
      roleMemberships: {
        some: {
          role: "ACADEMIC_SUPERVISOR",
        },
      },
    },
    include: {
      academicSupervisedAllocations: {
        include: {
          earlyWarningAlerts: {
            where: { isResolved: false },
          },
        },
      },
    },
  });

  const facultyName = faculty ? `${faculty.firstName} ${faculty.lastName}` : "Faculty Supervisor";
  const departmentName = "Department of Social Work (UNILAG)";

  const activeAlertsCount =
    faculty?.academicSupervisedAllocations.reduce(
      (sum, alloc) => sum + alloc.earlyWarningAlerts.length,
      0
    ) || 0;

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
        <FacultySidebar
          tenantSlug={params.tenant}
          facultyName={facultyName}
          departmentName={departmentName}
          activeAlertsCount={activeAlertsCount}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <FacultyHeader
            facultyName={facultyName}
            departmentName={departmentName}
            activeAlertsCount={activeAlertsCount}
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
