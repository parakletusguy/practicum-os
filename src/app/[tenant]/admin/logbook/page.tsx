import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { VerificationTableClient } from "@/app/[tenant]/field/verifications/verification-table-client";
import { BookOpenCheck, ShieldCheck } from "lucide-react";

export default async function AdminLogbookPage({
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
          cohortStudent: {
            include: { person: true },
          },
          practiceEvents: {
            orderBy: { eventDate: "desc" },
          },
        },
      },
    },
  });

  if (!cycle) {
    notFound();
  }

  const allEvents = cycle.allocations.flatMap((alloc) =>
    alloc.practiceEvents.map((event) => ({
      id: event.id,
      eventDate: event.eventDate,
      startTime: event.startTime,
      endTime: event.endTime,
      verifiedMinutes: event.verifiedMinutes,
      category: event.category,
      clientRef: event.clientRef,
      activityTitle: event.activityTitle,
      activityDescription: event.activityDescription,
      criticalReflection: event.criticalReflection,
      competenciesTagged: event.competenciesTagged,
      scopeLevel: event.scopeLevel,
      evidenceUrl: event.evidenceUrl,
      verificationStatus: event.verificationStatus as "PENDING" | "VERIFIED" | "QUERIED" | "REJECTED",
      supervisorNotes: event.supervisorNotes,
      tamperChecksum: event.tamperChecksum,
      student: {
        firstName: alloc.cohortStudent.person.firstName,
        lastName: alloc.cohortStudent.person.lastName,
        matricNumber: alloc.cohortStudent.matricNumber,
      },
    }))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
          <BookOpenCheck className="w-4 h-4 text-emerald-600" />
          Directorate E-Logbook Registry
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Cohort E-Logbook & Clinical Practice Repository
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete institutional oversight of all practice logs, hours verification statuses, ScopeGuard levels, and tamper-checksum digital seals.
        </p>
      </div>

      <VerificationTableClient initialEvents={allEvents} tenantSlug={params.tenant} />
    </div>
  );
}
