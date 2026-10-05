import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  Users,
  Award,
  Clock,
  ArrowRight,
  CheckCircle2,
  FileText,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";

export default async function FieldTraineesRosterPage({
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
          cycle: true,
          cohortStudent: {
            include: { person: true },
          },
          practiceEvents: true,
          supervisionVisits: true,
        },
      },
    },
  });

  const allocations = fieldSupervisor?.fieldSupervisedAllocations || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
          <Users className="w-4 h-4 text-emerald-600" />
          Agency Practice Roster
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Assigned Practicum Trainees
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor your supervisees, track their cumulative clinical hours, and assess individual competency evolution.
        </p>
      </div>

      {/* Roster Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allocations.map((alloc) => {
          const student = alloc.cohortStudent.person;
          const events = alloc.practiceEvents;
          const verifiedMins = events
            .filter((e) => e.verificationStatus === "VERIFIED")
            .reduce((s, e) => s + e.verifiedMinutes, 0);
          const verifiedHours = (verifiedMins / 60).toFixed(1);
          const pendingCount = events.filter((e) => e.verificationStatus === "PENDING").length;
          const targetHours = alloc.cycle.requiredHours || 400;
          const progressPct = Math.min(
            100,
            Math.round(((verifiedMins / 60) / targetHours) * 100)
          );

          // Count unique competencies demonstrated
          const allCompetencies = new Set<string>();
          events.forEach((e) => e.competenciesTagged.forEach((c) => allCompetencies.add(c)));

          return (
            <div
              key={alloc.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-bold text-lg flex items-center justify-center shadow">
                      {student.firstName[0]}
                      {student.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">
                        {student.firstName} {student.lastName}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {alloc.cohortStudent.matricNumber}
                        </span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                          {alloc.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{student.email}</span>
                  </div>
                  {student.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{student.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {alloc.cohortStudent.specialty || "Social Work"} • {alloc.cohortStudent.level || "400L"}
                    </span>
                  </div>
                </div>

                {/* Hours Progress */}
                <div className="mt-5 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">Verified Practice Hours</span>
                    <span className="text-slate-900">
                      {verifiedHours} / {targetHours} hrs ({progressPct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${progressPct}%` }}
                    ></div>
                  </div>
                </div>

                {/* Competencies & Metrics summary */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Competencies
                    </span>
                    <span className="text-slate-800 font-bold text-sm">
                      {allCompetencies.size} / 9 EPAS
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Pending Reviews
                    </span>
                    <span
                      className={`font-bold text-sm ${
                        pendingCount > 0 ? "text-amber-600" : "text-emerald-600"
                      }`}
                    >
                      {pendingCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link
                  href={`/${params.tenant}/field/trainees/${alloc.cohortStudentId}`}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                >
                  Inspect Practice Dossier
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
