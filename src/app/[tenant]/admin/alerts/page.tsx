import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AlertTriageClient } from "@/app/[tenant]/faculty/alerts/alert-triage-client";
import { AlertTriangle, ShieldAlert } from "lucide-react";

export default async function AdminAlertsPage({
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

  const cycle = await prisma.practicumCycle.findFirst({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    include: {
      allocations: {
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

  if (!cycle) {
    notFound();
  }

  const allAlerts = cycle.allocations.flatMap((alloc) =>
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
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 uppercase tracking-wider mb-1">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          Institutional Quality Assurance
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Cohort-Wide Early Warning Risk Triage
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor at-risk placements, supervision deficits, and student logbook inactivity across all partner institutions.
        </p>
      </div>

      <AlertTriageClient
        initialAlerts={allAlerts}
        cycleId={cycle.id}
        tenantSlug={params.tenant}
      />
    </div>
  );
}
