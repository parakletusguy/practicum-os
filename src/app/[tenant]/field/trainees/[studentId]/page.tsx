import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Award,
  Calendar,
  Building2,
  Mail,
  Phone,
  FileCheck,
} from "lucide-react";

export default async function FieldTraineeDetailPage({
  params,
}: {
  params: { tenant: string; studentId: string };
}) {
  const tenant = await prisma.organisation.findUnique({
    where: { slug: params.tenant },
  });

  if (!tenant) {
    notFound();
  }

  const cohortStudent = await prisma.cohortStudent.findUnique({
    where: { id: params.studentId },
    include: {
      person: true,
      cycle: true,
      allocation: {
        include: {
          hostOrg: true,
          academicSupervisor: true,
          fieldSupervisor: true,
          practiceEvents: {
            orderBy: { eventDate: "desc" },
          },
          supervisionVisits: {
            orderBy: { visitDate: "desc" },
            include: { supervisor: true },
          },
        },
      },
    },
  });

  if (!cohortStudent || !cohortStudent.allocation) {
    notFound();
  }

  const student = cohortStudent.person;
  const alloc = cohortStudent.allocation;
  const events = alloc.practiceEvents;
  const verifiedMins = events
    .filter((e) => e.verificationStatus === "VERIFIED")
    .reduce((s, e) => s + e.verifiedMinutes, 0);
  const verifiedHours = (verifiedMins / 60).toFixed(1);
  const targetHours = cohortStudent.cycle.requiredHours || 400;
  const progressPct = Math.min(100, Math.round(((verifiedMins / 60) / targetHours) * 100));

  // Tally competencies
  const competencyCounts: Record<string, number> = {};
  events
    .filter((e) => e.verificationStatus === "VERIFIED")
    .forEach((e) => {
      e.competenciesTagged.forEach((c) => {
        competencyCounts[c] = (competencyCounts[c] || 0) + 1;
      });
    });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          href={`/${params.tenant}/field/trainees`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Trainee Roster
        </Link>
      </div>

      {/* Trainee Banner */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-slate-900/20">
            {student.firstName[0]}
            {student.lastName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {student.firstName} {student.lastName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {cohortStudent.matricNumber}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {cohortStudent.specialty || "Social Welfare Practicum"} • Cohort Level:{" "}
              {cohortStudent.level || "400L"}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {student.email}
              </span>
              {student.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {student.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link
            href={`/${params.tenant}/field/verifications`}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition-all text-center flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Verify Entries
          </Link>
        </div>
      </div>

      {/* Progress & Competencies Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Hours Progress Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Practicum Completion
            </span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900">{verifiedHours} hrs</div>
            <p className="text-xs text-slate-500 mt-0.5">Required target: {targetHours} hrs</p>
          </div>
          <div className="space-y-1.5">
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${progressPct}%` }}
              ></div>
            </div>
            <div className="text-right text-[11px] font-bold text-slate-600">
              {progressPct}% of target reached
            </div>
          </div>
        </div>

        {/* Competencies Progress */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              EPAS Core Competency Coverage
            </span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {[
              "EPAS-1: Ethical & Professional Conduct",
              "EPAS-2: Diversity & Difference",
              "EPAS-3: Human Rights & Justice",
              "EPAS-4: Practice-Informed Research",
              "EPAS-5: Policy Practice",
              "EPAS-6: Engagement",
              "EPAS-7: Assessment",
              "EPAS-8: Intervention",
              "EPAS-9: Evaluation",
            ].map((comp) => {
              const code = comp.split(":")[0];
              const count = competencyCounts[code] || 0;
              return (
                <div
                  key={code}
                  className={`p-2.5 rounded-xl border flex items-center justify-between ${
                    count > 0
                      ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}
                >
                  <span className="font-semibold truncate mr-2">{comp}</span>
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      count > 0 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {count}x
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Complete Logbook History */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Practice Logbook History</h3>
            <p className="text-xs text-slate-500">
              All submitted clinical logs, ScopeGuard checks, and verification records
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">{events.length} Total Events</span>
        </div>

        <div className="divide-y divide-slate-100">
          {events.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No practice events have been submitted by this trainee yet.
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="py-4 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">{event.activityTitle}</span>
                    <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {(event.verifiedMinutes / 60).toFixed(1)} hrs
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">
                      {new Date(event.eventDate).toLocaleDateString()}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        event.verificationStatus === "VERIFIED"
                          ? "bg-emerald-100 text-emerald-800"
                          : event.verificationStatus === "PENDING"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {event.verificationStatus}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600">{event.activityDescription}</p>

                {event.supervisorNotes && (
                  <div className="p-2.5 bg-slate-50 border-l-2 border-emerald-500 rounded-r-lg text-xs text-slate-700">
                    <span className="font-bold text-slate-900 block text-[11px]">
                      Supervisor Feedback:
                    </span>
                    {event.supervisorNotes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
