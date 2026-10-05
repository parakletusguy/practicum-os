import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AlertTriageClient } from "./alert-triage-client";
import { AlertTriangle, ShieldAlert } from "lucide-react";

export default async function FacultyAlertsPage({
  params,
}: {
  params: { tenant: string };
}) {
  const tenant = await prisma.organisation.findUnique({
    where: { slug: params.tenant },
  });

  if (!tenant) {
    notFound();
  }

  // Get active cycle
  const cycle = await prisma.practicumCycle.findFirst({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });

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
          hostOrg: true,
          fieldSupervisor: true,
          cohortStudent: {
            include: { person: true },
          },
          earlyWarningAlerts: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  const allocations = faculty?.academicSupervisedAllocations || [];

  const initialAlerts = allocations.flatMap((alloc) =>
    alloc.earlyWarningAlerts.map((alert) => ({
      id: alert.id,
      alertType: alert.alertType,
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      isResolved: alert.isResolved,
      resolvedAt: alert.resolvedAt,
      resolutionNotes: alert.resolutionNotes,
      createdAt: alert.createdAt,
      studentName: `${alloc.cohortStudent.person.firstName} ${alloc.cohortStudent.person.lastName}`,
      matricNumber: alloc.cohortStudent.matricNumber,
      agencyName: alloc.hostOrg.name,
      fieldSupervisorName: alloc.fieldSupervisor
        ? `${alloc.fieldSupervisor.firstName} ${alloc.fieldSupervisor.lastName}`
        : undefined,
      allocationId: alloc.id,
    }))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 uppercase tracking-wider mb-1">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          Proactive Quality Assurance
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Early Warning Risk Triage & Intervention Desk
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Detect clinical hours deficits, logbook non-compliance, missed supervision appointments, and ScopeGuard boundary breaches across your placement cohort.
        </p>
      </div>

      <AlertTriageClient
        initialAlerts={initialAlerts}
        cycleId={cycle?.id || ""}
        tenantSlug={params.tenant}
      />
    </div>
  );
}
