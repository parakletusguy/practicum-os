import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { VerificationTableClient } from "./verification-table-client";
import { CheckCircle2, ShieldCheck } from "lucide-react";

export default async function FieldVerificationsPage({
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

  // Find the field supervisor and their allocations
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

  const allocations = fieldSupervisor?.fieldSupervisedAllocations || [];

  const flattenedEvents = allocations.flatMap((alloc) =>
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Field Clinical Supervision Desk
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            E-Logbook Verification & Hours Sign-Off
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review submitted practice events, confirm ScopeGuard compliance, verify direct client interactions, and approve authentic clinical hours.
          </p>
        </div>
      </div>

      <VerificationTableClient initialEvents={flattenedEvents} tenantSlug={params.tenant} />
    </div>
  );
}
