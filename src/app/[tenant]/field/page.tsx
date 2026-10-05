import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Calendar,
  FileCheck,
  Building2,
  Sparkles,
} from "lucide-react";

export default async function FieldSupervisorDashboardPage({
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

  // Find the active field supervisor
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
          cohortStudent: {
            include: {
              person: true,
            },
          },
          practiceEvents: {
            orderBy: { eventDate: "desc" },
          },
        },
      },
    },
  });

  const allocations = fieldSupervisor?.fieldSupervisedAllocations || [];
  const allEvents = allocations.flatMap((a) =>
    a.practiceEvents.map((e) => ({ ...e, student: a.cohortStudent.person }))
  );

  const pendingEvents = allEvents.filter((e) => e.verificationStatus === "PENDING");
  const verifiedEvents = allEvents.filter((e) => e.verificationStatus === "VERIFIED");
  const queriedEvents = allEvents.filter((e) => e.verificationStatus === "QUERIED");

  const totalVerifiedMinutes = verifiedEvents.reduce((sum, e) => sum + e.verifiedMinutes, 0);
  const totalVerifiedHours = (totalVerifiedMinutes / 60).toFixed(1);

  const agencyName = allocations[0]?.hostOrg?.name || "Practice Placement Agency";

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 rounded-2xl p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3">
              <Building2 className="w-3.5 h-3.5" />
              {agencyName}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Field Practice Supervision Desk
            </h1>
            <p className="mt-2 text-slate-300 text-sm max-w-2xl leading-relaxed">
              Verify trainee clinical hours, supervise ethical practice events, review ScopeGuard compliance, and guide professional social work competencies under NASW / IFSW standards.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/${params.tenant}/field/verifications`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/25 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Open Verification Desk ({pendingEvents.length})
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Assigned Trainees
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{allocations.length}</h3>
            <p className="text-xs text-slate-500 mt-1">Active field placements</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Sign-Offs
            </p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{pendingEvents.length}</h3>
            <p className="text-xs text-amber-600/80 font-medium mt-1">Requires supervisor review</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Verified Agency Hours
            </p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{totalVerifiedHours} hrs</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              Across {verifiedEvents.length} practice events
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Queried / In Revision
            </p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{queriedEvents.length}</h3>
            <p className="text-xs text-slate-500 mt-1">Clarifications pending</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Trainees & Pending Action Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Assigned Trainees Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Assigned Practice Trainees</h2>
              <p className="text-xs text-slate-500">
                Monitored candidates under your direct field supervision
              </p>
            </div>
            <Link
              href={`/${params.tenant}/field/trainees`}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              View Roster <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {allocations.map((alloc) => {
              const student = alloc.cohortStudent.person;
              const studentEvents = alloc.practiceEvents;
              const studentVerifiedMins = studentEvents
                .filter((e) => e.verificationStatus === "VERIFIED")
                .reduce((s, e) => s + e.verifiedMinutes, 0);
              const studentHours = studentVerifiedMins / 60;
              const pendingStudentEvents = studentEvents.filter(
                (e) => e.verificationStatus === "PENDING"
              );
              const progressPct = Math.min(100, Math.round((studentHours / 400) * 100));

              return (
                <div
                  key={alloc.id}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow">
                        {student.firstName[0]}
                        {student.lastName[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base">
                            {student.firstName} {student.lastName}
                          </h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {alloc.cohortStudent.matricNumber}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {alloc.cohortStudent.specialty || "General Social Welfare"} • Level:{" "}
                          {alloc.cohortStudent.level || "400L"}
                        </p>
                      </div>
                    </div>

                    {pendingStudentEvents.length > 0 && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {pendingStudentEvents.length} Pending Sign-off
                      </span>
                    )}
                  </div>

                  {/* Progress bar towards 400 hrs */}
                  <div className="mt-5 space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-600">Hours Velocity</span>
                      <span className="font-bold text-slate-900">
                        {studentHours.toFixed(1)} / 400 hrs ({progressPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Action footer */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="text-slate-500 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>{studentEvents.length} Practice Events Recorded</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/${params.tenant}/field/trainees/${alloc.cohortStudentId}`}
                        className="text-slate-600 hover:text-slate-900 font-medium"
                      >
                        Trainee Profile
                      </Link>
                      <Link
                        href={`/${params.tenant}/field/verifications`}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold"
                      >
                        Verify Events →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Pending Verification Queue & ScopeGuard Notices */}
        <div className="space-y-6">
          {/* Quick Verification Queue */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Urgent Sign-Off Queue
              </h3>
              <span className="text-xs font-bold text-slate-500">
                {pendingEvents.length} items
              </span>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {pendingEvents.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  <p className="text-xs font-medium">All trainee practice events are up to date!</p>
                </div>
              ) : (
                pendingEvents.slice(0, 4).map((event) => (
                  <div key={event.id} className="py-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">
                        {event.student.firstName} {event.student.lastName}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(event.eventDate).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium line-clamp-1">
                      {event.activityTitle}
                    </p>
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-emerald-700 font-semibold">
                        {(event.verifiedMinutes / 60).toFixed(1)} hrs • {event.category}
                      </span>
                      <Link
                        href={`/${params.tenant}/field/verifications`}
                        className="text-emerald-600 font-bold hover:underline"
                      >
                        Review →
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

            {pendingEvents.length > 4 && (
              <div className="pt-3 border-t border-slate-100 text-center">
                <Link
                  href={`/${params.tenant}/field/verifications`}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                >
                  View all {pendingEvents.length} pending events
                </Link>
              </div>
            )}
          </div>

          {/* ScopeGuard Standards Card */}
          <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl shadow-sm border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-bold text-sm text-white">ScopeGuard Verification Rules</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              As an accredited Field Supervisor, ensure that high-risk activities such as court testimony, statutory removals, or unaccompanied home visits were conducted with DIRECT_SUPERVISION.
            </p>
            <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800 flex items-center justify-between">
              <span>Standard: CSWE / IFSW 2026</span>
              <span className="text-emerald-400 font-semibold">Protected Audit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
