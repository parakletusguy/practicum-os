import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  Users,
  CalendarCheck,
  AlertTriangle,
  Clock,
  Building2,
  ArrowRight,
  ShieldCheck,
  Video,
  MapPin,
  CheckCircle2,
} from "lucide-react";

export default async function FacultyDashboardPage({
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
          practiceEvents: true,
          supervisionVisits: {
            orderBy: { visitDate: "desc" },
          },
          earlyWarningAlerts: {
            where: { isResolved: false },
          },
        },
      },
    },
  });

  const allocations = faculty?.academicSupervisedAllocations || [];

  const totalVisits = allocations.reduce((sum, a) => sum + a.supervisionVisits.length, 0);
  const totalAlerts = allocations.reduce((sum, a) => sum + a.earlyWarningAlerts.length, 0);

  // Compute total verified hours across all students
  const totalVerifiedMinutes = allocations.reduce((acc, a) => {
    return (
      acc +
      a.practiceEvents
        .filter((e) => e.verificationStatus === "VERIFIED")
        .reduce((s, e) => s + e.verifiedMinutes, 0)
    );
  }, 0);
  const avgVerifiedHours = allocations.length > 0 ? (totalVerifiedMinutes / 60 / allocations.length).toFixed(1) : "0.0";

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 rounded-2xl p-5 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-3">
              <Building2 className="w-3.5 h-3.5" />
              University Field Education
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Academic Supervisor Workspace
            </h1>
            <p className="mt-2 text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Oversee your assigned students, schedule supervision visits, and provide timely guidance throughout their fieldwork placement.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/${params.tenant}/faculty/visits`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all"
            >
              <CalendarCheck className="w-4 h-4" />
              Schedule Supervision Visit
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Assigned Caseload
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{allocations.length} Students</h3>
            <p className="text-xs text-slate-500 mt-1">Across partner agencies</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Supervision Visits
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalVisits} Logged</h3>
            <p className="text-xs text-slate-500 mt-1">Physical & Virtual debriefs</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Early Warning Alerts
            </p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">{totalAlerts} Active</h3>
            <p className="text-xs text-rose-600/80 font-medium mt-1">Requiring faculty intervention</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Avg Verified Hours
            </p>
            <h3 className="text-2xl font-bold text-indigo-600 mt-1">{avgVerifiedHours} hrs</h3>
            <p className="text-xs text-slate-500 mt-1">Per student pace</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Caseload Roster & Quick Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Assigned Supervisees */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Academic Supervision Roster</h2>
              <p className="text-xs text-slate-500">
                Trainees placed at partner facilities under your university mentorship
              </p>
            </div>
            <Link
              href={`/${params.tenant}/faculty/visits`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              All Visits <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {allocations.map((alloc) => {
              const student = alloc.cohortStudent.person;
              const hostOrg = alloc.hostOrg;
              const fieldSup = alloc.fieldSupervisor;
              const latestVisit = alloc.supervisionVisits[0];
              const unresolvedAlerts = alloc.earlyWarningAlerts;

              const verifiedMins = alloc.practiceEvents
                .filter((e) => e.verificationStatus === "VERIFIED")
                .reduce((s, e) => s + e.verifiedMinutes, 0);
              const verifiedHours = (verifiedMins / 60).toFixed(1);

              return (
                <div
                  key={alloc.id}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-900 text-white font-bold flex items-center justify-center text-base shadow">
                        {student.firstName[0]}
                        {student.lastName[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base">
                            {student.firstName} {student.lastName}
                          </h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {alloc.cohortStudent.matricNumber}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {alloc.cohortStudent.specialty || "Social Work"} • {alloc.cohortStudent.level || "400L"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {unresolvedAlerts.length > 0 && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {unresolvedAlerts.length} Alert
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        {verifiedHours} / 400 hrs
                      </span>
                    </div>
                  </div>

                  {/* Placement Agency Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Placement Agency
                      </span>
                      <span className="font-semibold text-slate-900 block mt-0.5">
                        {hostOrg.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Field Supervisor
                      </span>
                      <span className="font-semibold text-slate-900 block mt-0.5">
                        {fieldSup ? `${fieldSup.firstName} ${fieldSup.lastName}` : "Pending Assignment"}
                      </span>
                    </div>
                  </div>

                  {/* Latest Supervision Status */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="text-slate-500">
                      {latestVisit ? (
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Last Visited: {new Date(latestVisit.visitDate).toLocaleDateString()} (
                          {latestVisit.studentProgressRating})
                        </span>
                      ) : (
                        <span className="text-amber-600 font-semibold flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-500" />
                          No supervision visit logged yet
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/${params.tenant}/faculty/visits?allocationId=${alloc.id}`}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold"
                      >
                        Record Visit →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Alerts Queue & Quick Triage */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Active Early Warning Alerts
              </h3>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                {totalAlerts} items
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {totalAlerts === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  <p className="text-xs font-medium">No unresolved alerts in your caseload!</p>
                </div>
              ) : (
                allocations
                  .flatMap((a) =>
                    a.earlyWarningAlerts.map((alert) => ({
                      ...alert,
                      studentName: `${a.cohortStudent.person.firstName} ${a.cohortStudent.person.lastName}`,
                    }))
                  )
                  .slice(0, 4)
                  .map((alert) => (
                    <div key={alert.id} className="py-3.5 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{alert.studentName}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            alert.severity === "CRITICAL"
                              ? "bg-rose-100 text-rose-900"
                              : alert.severity === "HIGH"
                              ? "bg-amber-100 text-amber-900"
                              : "bg-blue-100 text-blue-900"
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-700">{alert.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{alert.description}</p>
                      <div className="pt-1 text-right">
                        <Link
                          href={`/${params.tenant}/faculty/alerts`}
                          className="text-[11px] font-bold text-blue-600 hover:underline"
                        >
                          Triage Alert →
                        </Link>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-center">
              <Link
                href={`/${params.tenant}/faculty/alerts`}
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                Open Full Triage Desk →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
