import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate, formatMinutesToHours } from "@/lib/utils";
import { 
  Users, 
  Building2, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Calendar, 
  ShieldAlert, 
  Shuffle, 
  MailCheck, 
  FileSpreadsheet,
  Award
} from "lucide-react";

interface AdminDashboardProps {
  params: {
    tenant: string;
  };
}

export const dynamic = "force-dynamic";

export default async function AdminDashboard({ params }: AdminDashboardProps) {
  const tenantSlug = params.tenant;

  // 1. Fetch Tenant Organisation
  const tenant = await db.organisation.findUnique({
    where: { slug: tenantSlug },
    include: {
      departments: {
        include: {
          programmes: true,
        },
      },
    },
  });

  if (!tenant) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">Institution Not Found</h2>
        <p className="text-slate-500 text-sm mt-2">
          Tenant slug <code className="bg-slate-100 px-2 py-0.5 rounded font-mono">{tenantSlug}</code> does not exist in the database.
        </p>
      </div>
    );
  }

  // 2. Fetch Active Cycle
  const activeCycle = await db.practicumCycle.findFirst({
    where: {
      tenantId: tenant.id,
      status: "ACTIVE",
    },
    include: {
      programme: true,
      students: {
        include: {
          person: true,
          allocation: {
            include: {
              hostOrg: true,
              fieldSupervisor: true,
              academicSupervisor: true,
            },
          },
        },
      },
      placementOffers: {
        include: {
          hostOrg: true,
        },
      },
    },
  });

  // 3. Aggregate Metrics
  const totalStudents = activeCycle?.students.length ?? 0;
  const placedStudents = activeCycle?.students.filter((s) => s.allocation?.status === "ACTIVE").length ?? 0;
  const placementRate = totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0;

  const totalAgencySlots = activeCycle?.placementOffers.reduce((acc, o) => acc + o.totalSlots, 0) ?? 0;
  const availableSlots = activeCycle?.placementOffers.reduce((acc, o) => acc + o.availableSlots, 0) ?? 0;

  // 4. Fetch Active Early Warning Alerts
  const activeAlerts = await db.earlyWarningAlert.findMany({
    where: {
      allocation: {
        cycleId: activeCycle?.id,
      },
      isResolved: false,
    },
    include: {
      allocation: {
        include: {
          studentPerson: true,
          hostOrg: true,
        },
      },
    },
    take: 5,
  });

  // 5. Fetch Recent Practice Events
  const recentEvents = await db.practiceEvent.findMany({
    where: {
      allocation: {
        cycleId: activeCycle?.id,
      },
    },
    include: {
      allocation: {
        include: {
          studentPerson: true,
          hostOrg: true,
          fieldSupervisor: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  // Total verified minutes logged in cycle
  const totalVerifiedMinutes = await db.practiceEvent.aggregate({
    where: {
      allocation: { cycleId: activeCycle?.id },
      verificationStatus: "VERIFIED",
    },
    _sum: {
      verifiedMinutes: true,
    },
  });

  const verifiedHoursFormatted = formatMinutesToHours(totalVerifiedMinutes._sum.verifiedMinutes ?? 0);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Cycle Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 rounded-2xl p-5 sm:p-8 text-white shadow-lg border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Active Placement Cycle
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {activeCycle?.name ?? "Placement Management Workspace"}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            {activeCycle?.programme?.name ?? "Field Education"} • {activeCycle?.academicYear} • Target: {activeCycle?.requiredHours} Hours
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <Link
            href={`/${tenantSlug}/admin/matching`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <Shuffle className="w-4 h-4" />
            Match Placements
          </Link>
          <Link
            href={`/${tenantSlug}/admin/postings`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors"
          >
            <MailCheck className="w-4 h-4" />
            Placement Letters
          </Link>
          <Link
            href={`/${tenantSlug}/admin/grading`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Grades & Scorebook
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Enrolled Students
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">{totalStudents}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="font-semibold text-emerald-600">{placedStudents} Placed</span>
              <span>•</span>
              <span>{totalStudents - placedStudents} Awaiting Match</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Agency Capacity
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">{totalAgencySlots}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="font-semibold text-purple-600">{availableSlots} Open Slots</span>
              <span>•</span>
              <span>{placementRate}% Placed</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Verified Hours
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">{verifiedHoursFormatted}</div>
            <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified by Supervisors
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Student Alerts
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-amber-600">{activeAlerts.length}</div>
            <div className="text-xs text-slate-500 mt-1">
              {activeAlerts.length > 0 ? "Requires Faculty Guidance" : "All Students on Track"}
            </div>
          </div>
        </div>
      </div>

      {/* Main Split: Early Warning Feed & Recent Logbook Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column: Early Warning & Risk Interventions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Student Support Alerts
                </h3>
              </div>
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Active
              </span>
            </div>

            {activeAlerts.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No active student alerts. Everyone is progressing smoothly.
              </p>
            ) : (
              <div className="space-y-3">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-amber-900">
                        {alert.allocation.studentPerson.firstName} {alert.allocation.studentPerson.lastName}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-800">
                        {alert.severity}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800">
                      {alert.title}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {alert.description}
                    </p>
                    <div className="mt-3 pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Agency: {alert.allocation.hostOrg.name}</span>
                      <Link
                        href={`/${tenantSlug}/admin/visits`}
                        className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                      >
                        Schedule Field Visit →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Safety Guidelines Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Practice Safety Rules</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Automatic safeguards ensure students only perform tasks aligned with their level of training.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-700">High-Risk Home Visit</span>
                <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 text-[10px]">
                  Direct Observation
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-700">Court Hearing & Deposition</span>
                <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 text-[10px]">
                  Direct Observation
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-700">Routine Intake & Case Notes</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px]">
                  Independent Allowed
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live E-Logbook Practice Stream (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Recent Verified Activities
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live feed of student logbook entries and field supervisor verifications.
                </p>
              </div>
              <Link
                href={`/${tenantSlug}/admin/logbook`}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                View Full Logbook <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentEvents.map((event) => (
                <div key={event.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {event.allocation.studentPerson.firstName} {event.allocation.studentPerson.lastName}
                        </span>
                        <span className="text-[11px] text-slate-400">•</span>
                        <span className="text-xs text-slate-500">
                          {event.allocation.hostOrg.name}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-800 mt-1">
                        {event.activityTitle}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {event.activityDescription}
                      </p>
                    </div>

                    <div className="sm:text-right flex-shrink-0 flex sm:flex-col items-center sm:items-end justify-between">
                      <span className="inline-block text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {formatMinutesToHours(event.verifiedMinutes)}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {formatDate(event.eventDate)}
                      </div>
                    </div>
                  </div>

                  {/* Competency tags & Verification status */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-50">
                    <div className="flex flex-wrap gap-1.5">
                      {event.competenciesTagged.map((tag, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-semibold">
                      {event.verificationStatus === "VERIFIED" ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verified by {event.allocation.fieldSupervisor?.firstName ?? "Supervisor"}
                        </span>
                      ) : (
                        <span className="text-amber-600">Pending Review</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Practicum Workflow Tracker */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm">
            <h3 className="text-sm font-bold tracking-tight text-white mb-2">
              Placement Cycle Progress
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-400 mb-2">
              <span>Phase 3: Active Fieldwork & Hours Verification</span>
              <span className="text-emerald-400 font-bold">52% Completed</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-[52%]" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="text-[10px] text-slate-400 uppercase">Phase 1</div>
                <div className="font-semibold text-emerald-400 mt-0.5">Enrollment</div>
                <div className="text-[10px] text-slate-400">Completed</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="text-[10px] text-slate-400 uppercase">Phase 2</div>
                <div className="font-semibold text-emerald-400 mt-0.5">Assignments</div>
                <div className="text-[10px] text-slate-400">Completed</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-emerald-500/40">
                <div className="text-[10px] text-emerald-400 uppercase font-bold">Phase 3 (Active)</div>
                <div className="font-semibold text-white mt-0.5">Fieldwork</div>
                <div className="text-[10px] text-emerald-300">In Progress</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="text-[10px] text-slate-400 uppercase">Phase 4</div>
                <div className="font-semibold text-slate-400 mt-0.5">Final Grades</div>
                <div className="text-[10px] text-slate-500">Upcoming</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
