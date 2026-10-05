import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { SupervisionVisitModalClient } from "@/app/[tenant]/faculty/visits/supervision-visit-modal-client";
import { CalendarCheck, ShieldCheck } from "lucide-react";

export default async function AdminVisitsPage({
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
          cohortStudent: {
            include: { person: true },
          },
          supervisionVisits: {
            include: { supervisor: true },
            orderBy: { visitDate: "desc" },
          },
        },
      },
    },
  });

  if (!cycle) {
    notFound();
  }

  const coordinator = await prisma.person.findFirst({
    where: {
      roleMemberships: {
        some: {
          role: "COORDINATOR",
        },
      },
    },
  });

  const allocations = cycle.allocations;

  const allocationOptions = allocations.map((a) => ({
    id: a.id,
    studentName: `${a.cohortStudent.person.firstName} ${a.cohortStudent.person.lastName}`,
    matricNumber: a.cohortStudent.matricNumber,
    agencyName: a.hostOrg.name,
  }));

  const allVisits = allocations.flatMap((a) =>
    a.supervisionVisits.map((v) => ({
      id: v.id,
      visitDate: v.visitDate,
      visitType: v.visitType as "PHYSICAL_ON_SITE" | "REMOTE_VIDEO" | "TELEPHONE",
      generalObservations: v.generalObservations,
      agencyFeedback: v.agencyFeedback,
      actionItems: v.actionItems,
      studentProgressRating: v.studentProgressRating,
      followUpRequired: v.followUpRequired,
      followUpDate: v.followUpDate,
      studentName: `${a.cohortStudent.person.firstName} ${a.cohortStudent.person.lastName}`,
      matricNumber: a.cohortStudent.matricNumber,
      agencyName: a.hostOrg.name,
      supervisorName: `${v.supervisor.firstName} ${v.supervisor.lastName}`,
    }))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
          <CalendarCheck className="w-4 h-4 text-blue-600" />
          Directorate of Field Education
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Supervision Visits Audit & Compliance
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete institution-wide register of faculty site visits, virtual liaison meetings, agency appraisals, and follow-up directives.
        </p>
      </div>

      <SupervisionVisitModalClient
        allocations={allocationOptions}
        initialVisits={allVisits}
        supervisorPersonId={coordinator?.id || ""}
        tenantSlug={params.tenant}
      />
    </div>
  );
}
