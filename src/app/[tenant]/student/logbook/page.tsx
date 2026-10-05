import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate, formatMinutesToHours } from "@/lib/utils";
import { 
  BookOpenCheck, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Filter, 
  FileText,
  Lock,
  Layers
} from "lucide-react";
import { LogbookModalClient } from "./logbook-modal-client";

interface StudentLogbookPageProps {
  params: {
    tenant: string;
  };
}

export const dynamic = "force-dynamic";

export default async function StudentLogbookPage({ params }: StudentLogbookPageProps) {
  const tenantSlug = params.tenant;

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
  const allocation = enrollment?.allocation;
  const events = allocation?.practiceEvents || [];

  const verifiedMinutes = events
    .filter((e) => e.verificationStatus === "VERIFIED")
    .reduce((sum, e) => sum + e.verifiedMinutes, 0);

  const pendingMinutes = events
    .filter((e) => e.verificationStatus === "PENDING")
    .reduce((sum, e) => sum + e.verifiedMinutes, 0);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            <span>Student Workspace</span>
            <span>•</span>
            <span className="text-emerald-600">Practice Execution</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            E-Logbook & Practice Events
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Log clinical hours, record critical reflections, and submit evidence under ScopeGuard governance.
          </p>
        </div>

        {allocation && (
          <LogbookModalClient
            tenantSlug={tenantSlug}
            allocationId={allocation.id}
          />
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Verified Practice Hours
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {formatMinutesToHours(verifiedMinutes)}
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved by Field Supervisor
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Pending Hours Review
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">
            {formatMinutesToHours(pendingMinutes)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Awaiting field supervisor sign-off
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Logged Practice Events
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {events.length} Entries
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Tamper-evident checksums committed
          </div>
        </div>
      </div>

      {/* Events Register List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Practice Activity Records ({events.length})
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cryptographic SHA-256 Protected</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {events.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No practice events recorded yet. Click &quot;Log Practice Event&quot; above to submit your first entry.
            </div>
          ) : (
            events.map((event) => {
              const isVerified = event.verificationStatus === "VERIFIED";

              return (
                <div key={event.id} className="py-5 first:pt-0 last:pb-0 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {event.activityTitle}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {event.category.replace("_", " ")}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="font-mono text-xs text-slate-500 font-semibold">
                          {event.clientRef}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                        {event.activityDescription}
                      </p>
                    </div>

                    <div className="text-left sm:text-right flex-shrink-0">
                      <div className="inline-block text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {formatMinutesToHours(event.verifiedMinutes)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {formatDate(event.eventDate)} ({event.startTime} – {event.endTime})
                      </div>
                    </div>
                  </div>

                  {/* Critical Reflection block */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 italic">
                    <strong className="text-slate-700 font-sans not-italic block text-[10px] uppercase tracking-wider mb-1">
                      Critical Reflection & Ethical Insight:
                    </strong>
                    &quot;{event.criticalReflection}&quot;
                  </div>

                  {/* Competency badges & Verification footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                        DNA Competencies:
                      </span>
                      {event.competenciesTagged.map((tag, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-medium bg-emerald-50 border border-emerald-100 text-emerald-800 px-2 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400 font-mono">
                        Scope: {event.scopeLevel}
                      </span>

                      {isVerified ? (
                        <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-amber-600 font-semibold text-xs">
                          Awaiting Review
                        </span>
                      )}
                    </div>
                  </div>

                  {event.supervisorNotes && (
                    <div className="mt-2 text-xs p-2 rounded-lg bg-emerald-50/50 border border-emerald-100 text-emerald-900">
                      <strong>Supervisor Feedback:</strong> {event.supervisorNotes}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
