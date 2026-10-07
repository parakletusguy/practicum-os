import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate, formatMinutesToHours } from "@/lib/utils";
import { 
  Clock, 
  CheckCircle2, 
  Building2, 
  BookOpenCheck, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  FileText,
  Layers,
  Award
} from "lucide-react";

interface StudentDashboardProps {
  params: {
    tenant: string;
  };
}

export const dynamic = "force-dynamic";

export default async function StudentDashboard({ params }: StudentDashboardProps) {
  const tenantSlug = params.tenant;

  // Fetch student Eze (sample student)
  const student = await db.person.findFirst({
    where: { email: "c.eze@student.unilag.edu.ng" },
    include: {
      cohortEnrollments: {
        include: {
          cycle: true,
          allocation: {
            include: {
              hostOrg: true,
              fieldSupervisor: true,
              academicSupervisor: true,
              practiceEvents: {
                orderBy: { eventDate: "desc" },
              },
            },
          },
        },
      },
    },
  });

  const enrollment = student?.cohortEnrollments[0];
  const cycle = enrollment?.cycle;
  const allocation = enrollment?.allocation;
  const events = allocation?.practiceEvents || [];

  const verifiedMinutes = events
    .filter((e) => e.verificationStatus === "VERIFIED")
    .reduce((sum, e) => sum + e.verifiedMinutes, 0);

  const pendingMinutes = events
    .filter((e) => e.verificationStatus === "PENDING")
    .reduce((sum, e) => sum + e.verifiedMinutes, 0);

  const totalRequiredHours = cycle?.requiredHours || 400;
  const verifiedHoursNumber = Number((verifiedMinutes / 60).toFixed(1));
  const progressPercent = Math.min(100, Math.round((verifiedHoursNumber / totalRequiredHours) * 100));

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 rounded-2xl p-5 sm:p-8 text-white shadow-lg border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Student Placement Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {student?.firstName ?? "Student"}!
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            {cycle?.name ?? "Supervised Field Practicum"} • Matric No: <span className="font-mono font-bold text-white">{enrollment?.matricNumber}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <Link
            href={`/${tenantSlug}/student/placement`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors"
          >
            <Building2 className="w-4 h-4 text-purple-400" />
            Placement Details
          </Link>
          <Link
            href={`/${tenantSlug}/student/guide`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <BookOpenCheck className="w-4 h-4" />
            Fieldwork Guide
          </Link>
        </div>
      </div>

      {/* Progress Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        {/* Hours Progress Ring / Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Verified Fieldwork Hours
              </span>
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <div className="text-4xl font-extrabold text-slate-900">
                {verifiedHoursNumber}
              </div>
              <span className="text-sm font-semibold text-slate-400">
                / {totalRequiredHours} Hours
              </span>
            </div>

            <div className="mt-3 w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">{progressPercent}% Completed</span>
            <span className="text-amber-600 font-semibold">
              {formatMinutesToHours(pendingMinutes)} Awaiting Review
            </span>
          </div>
        </div>

        {/* Host Setting Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Placement Agency
              </span>
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>

            <h3 className="text-base font-bold text-slate-900 mt-4 leading-snug">
              {allocation?.hostOrg.name ?? "Pending Assignment"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Field Supervisor: <strong className="text-slate-700">{allocation?.fieldSupervisor?.firstName ?? "Assigned by Agency"} {allocation?.fieldSupervisor?.lastName}</strong>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Placement Confirmed
            </span>
            <Link
              href={`/${tenantSlug}/student/placement`}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              View Details <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Safety & Supervision Bounds */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Safety Guidelines
              </span>
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="mt-4 font-bold text-slate-900 text-sm">
              Practice Safeguards Active
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              High-risk activities and home visits must be directly observed or co-practiced with your supervisor.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Training Level: 400L Senior</span>
            <Link
              href={`/${tenantSlug}/student/guide`}
              className="text-emerald-600 font-semibold hover:underline"
            >
              Review Rules →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Practice Log Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Recent Fieldwork Activities
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified records of your supervised tasks and personal reflections.
            </p>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            {events.length} Entries Logged
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {events.map((event) => (
            <div key={event.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                      {event.activityTitle}
                    </span>
                    <span className="text-[11px] text-slate-400">•</span>
                    <span className="text-xs font-mono font-medium text-slate-500">
                      {event.clientRef ?? "CASE-ANON"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {event.activityDescription}
                  </p>
                  <p className="text-xs text-slate-500 italic mt-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    &quot;{event.criticalReflection}&quot;
                  </p>
                </div>

                <div className="sm:text-right flex-shrink-0 flex sm:flex-col items-center sm:items-end justify-between">
                  <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {formatMinutesToHours(event.verifiedMinutes)}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {formatDate(event.eventDate)}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-50">
                <div className="flex flex-wrap gap-1">
                  {event.competenciesTagged.map((tag, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="text-[11px] font-semibold">
                  {event.verificationStatus === "VERIFIED" ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified by Supervisor
                    </span>
                  ) : (
                    <span className="text-amber-600">Awaiting Verification</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
