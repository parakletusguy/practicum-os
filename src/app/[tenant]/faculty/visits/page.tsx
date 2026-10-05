import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { SupervisionVisitModalClient } from "./supervision-visit-modal-client";
import { CalendarCheck, ShieldCheck } from "lucide-react";

export default async function FacultyVisitsPage({
  params,
  searchParams,
}: {
  params: { tenant: string };
  searchParams: { allocationId?: string };
}) {
  const tenant = await prisma.organisation.findUnique({
    where: { slug: params.tenant },
  });

  if (!tenant) {
    notFound();
  }

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

  const allocations = faculty?.academicSupervisedAllocations || [];

  const allocationOptions = allocations.map((a) => ({
    id: a.id,
    studentName: `${a.cohortStudent.person.firstName} ${a.cohortStudent.person.lastName}`,
    matricNumber: a.cohortStudent.matricNumber,
    agencyName: a.hostOrg.name,
  }));

  const initialVisits = allocations.flatMap((a) =>
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
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
          <CalendarCheck className="w-4 h-4 text-blue-600" />
          Academic Supervision Desk
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Supervision Visits & Agency Liaison
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Document physical on-site inspections, remote video debriefs, clinical appraisals, and development milestones for your assigned practicum students.
        </p>
      </div>

      <SupervisionVisitModalClient
        allocations={allocationOptions}
        initialVisits={initialVisits}
        supervisorPersonId={faculty?.id || ""}
        tenantSlug={params.tenant}
        preselectedAllocationId={searchParams?.allocationId}
      />
    </div>
  );
}
