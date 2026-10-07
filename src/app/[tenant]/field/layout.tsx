import { ReactNode } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
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
  const tenant = await prisma.organisation.findUnique({
    where: { slug: params.tenant },
  });

  if (!tenant) {
    notFound();
  }

  // Find the primary field supervisor for this tenant or default to Ngozi Okonkwo
  const fieldSupervisor = await prisma.person.findFirst({
    where: {
      roleMemberships: {
        some: {
          role: "FIELD_SUPERVISOR",
        },
      },
    },
    include: {
      fieldSupervisedAllocations: {
        include: {
          hostOrg: true,
          practiceEvents: {
            where: {
              verificationStatus: "PENDING",
            },
          },
        },
      },
    },
  });

  const supervisorName = fieldSupervisor
    ? `${fieldSupervisor.firstName} ${fieldSupervisor.lastName}`
    : "Field Supervisor";

  const agencyName =
    fieldSupervisor?.fieldSupervisedAllocations[0]?.hostOrg?.name ||
    "Lagos State Ministry of Youth & Social Development";

  const pendingCount =
    fieldSupervisor?.fieldSupervisedAllocations.reduce(
      (sum, alloc) => sum + alloc.practiceEvents.length,
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
