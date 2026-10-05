"use client";

import { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  FileText,
  User,
  Hash,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { verifyPracticeEventAction } from "@/modules/supervision/actions";

interface VerificationItem {
  id: string;
  eventDate: string | Date;
  startTime: string;
  endTime: string;
  verifiedMinutes: number;
  category: string;
  clientRef: string | null;
  activityTitle: string;
  activityDescription: string;
  criticalReflection: string;
  competenciesTagged: string[];
  scopeLevel: string;
  evidenceUrl: string | null;
  verificationStatus: "PENDING" | "VERIFIED" | "QUERIED" | "REJECTED";
  supervisorNotes: string | null;
  tamperChecksum: string;
  student: {
    firstName: string;
    lastName: string;
    matricNumber: string;
  };
}

interface Props {
  initialEvents: VerificationItem[];
  tenantSlug: string;
}

export function VerificationTableClient({ initialEvents, tenantSlug }: Props) {
  const [events, setEvents] = useState<VerificationItem[]>(initialEvents);
  const [selectedStatus, setSelectedStatus] = useState<string>("PENDING");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeModalEvent, setActiveModalEvent] = useState<VerificationItem | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filteredEvents = events.filter((e) => {
    const matchesStatus =
      selectedStatus === "ALL" || e.verificationStatus === selectedStatus;
    const matchesSearch =
      e.activityTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${e.student.firstName} ${e.student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.clientRef && e.clientRef.toLowerCase().includes(searchQuery.toLowerCase())) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = events.filter((e) => e.verificationStatus === "PENDING").length;
  const verifiedCount = events.filter((e) => e.verificationStatus === "VERIFIED").length;
  const queriedCount = events.filter((e) => e.verificationStatus === "QUERIED").length;
  const rejectedCount = events.filter((e) => e.verificationStatus === "REJECTED").length;

  const handleAction = async (status: "VERIFIED" | "QUERIED" | "REJECTED") => {
    if (!activeModalEvent) return;
    setIsSubmitting(true);
    setActionMessage(null);

    const formData = new FormData();
    formData.append("eventId", activeModalEvent.id);
    formData.append("status", status);
    formData.append("supervisorNotes", reviewNotes);
    formData.append("tenantSlug", tenantSlug);

    const res = await verifyPracticeEventAction(formData);

    if (res.success) {
      setEvents((prev) =>
        prev.map((item) =>
          item.id === activeModalEvent.id
            ? {
                ...item,
                verificationStatus: status,
                supervisorNotes: reviewNotes || null,
              }
            : item
        )
      );
      setActionMessage({ type: "success", text: res.message || "Event verified successfully." });
      setTimeout(() => {
        setActiveModalEvent(null);
        setReviewNotes("");
        setActionMessage(null);
      }, 1000);
    } else {
      setActionMessage({ type: "error", text: res.error || "Failed to update event." });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Status Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedStatus("PENDING")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedStatus === "PENDING"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pending Review ({pendingCount})
          </button>
          <button
            onClick={() => setSelectedStatus("VERIFIED")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedStatus === "VERIFIED"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified ({verifiedCount})
          </button>
          <button
            onClick={() => setSelectedStatus("QUERIED")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedStatus === "QUERIED"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Queried ({queriedCount})
          </button>
          <button
            onClick={() => setSelectedStatus("REJECTED")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedStatus === "REJECTED"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Rejected ({rejectedCount})
          </button>
          <button
            onClick={() => setSelectedStatus("ALL")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedStatus === "ALL"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Logs ({events.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student, activity, or Case #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Events List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredEvents.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500/60 mb-3" />
            <p className="font-semibold text-slate-700 text-sm">No practice events match this filter</p>
            <p className="text-xs text-slate-400 mt-1">Select another tab or adjust your search.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredEvents.map((event) => {
              const hours = (event.verifiedMinutes / 60).toFixed(1);
              const eventDateStr = new Date(event.eventDate).toLocaleDateString(undefined, {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={event.id}
                  className="p-5 hover:bg-slate-50/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Student & Activity Overview */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {event.student.firstName} {event.student.lastName}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {event.student.matricNumber}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {eventDateStr} ({event.startTime} - {event.endTime}, {hours} hrs)
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-800 hover:text-emerald-700 transition-colors">
                      {event.activityTitle}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {event.activityDescription}
                    </p>

                    {/* Metadata Tags */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {event.category.replace("_", " ")}
                      </span>
                      {event.clientRef && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200">
                          Ref: {event.clientRef}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        Scope: {event.scopeLevel.replace("_", " ")}
                      </span>
                      {event.competenciesTagged.map((comp) => (
                        <span
                          key={comp}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                        >
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right: Verification Status & Action Button */}
                  <div className="flex items-center gap-4 self-end md:self-center flex-shrink-0">
                    <div>
                      {event.verificationStatus === "PENDING" && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Pending Review
                        </span>
                      )}
                      {event.verificationStatus === "VERIFIED" && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      )}
                      {event.verificationStatus === "QUERIED" && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Queried
                        </span>
                      )}
                      {event.verificationStatus === "REJECTED" && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5" />
                          Rejected
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setActiveModalEvent(event);
                        setReviewNotes(event.supervisorNotes || "");
                        setActionMessage(null);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-emerald-600 transition-colors flex items-center gap-1 shadow-sm"
                    >
                      Inspect & Sign
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review & Verification Modal */}
      {activeModalEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-6 my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  Practicum Verification Audit
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2">
                  {activeModalEvent.activityTitle}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Logged by {activeModalEvent.student.firstName} {activeModalEvent.student.lastName} (
                  {activeModalEvent.student.matricNumber})
                </p>
              </div>
              <button
                onClick={() => setActiveModalEvent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Event Clinical Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Date & Hours</span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  {new Date(activeModalEvent.eventDate).toLocaleDateString()}
                </span>
                <span className="text-emerald-700 font-semibold">
                  {(activeModalEvent.verifiedMinutes / 60).toFixed(1)} hrs
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Practice Category</span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  {activeModalEvent.category.replace("_", " ")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">ScopeGuard Level</span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  {activeModalEvent.scopeLevel.replace("_", " ")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Client Ref (Sanitized)</span>
                <span className="font-mono font-bold text-purple-700 mt-0.5 block">
                  {activeModalEvent.clientRef || "DE-IDENTIFIED"}
                </span>
              </div>
            </div>

            {/* Description & Reflection */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-1">
                  Activity Clinical Description
                </label>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                  {activeModalEvent.activityDescription}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-1">
                  Critical Reflection & Self-Evaluation
                </label>
                <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-slate-800 leading-relaxed">
                  {activeModalEvent.criticalReflection}
                </div>
              </div>

              {/* Competencies */}
              <div>
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-1">
                  Tagged Competency Standards
                </label>
                <div className="flex flex-wrap gap-2">
                  {activeModalEvent.competenciesTagged.map((c) => (
                    <span
                      key={c}
                      className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* SHA-256 Tamper Checksum Seal */}
              <div className="p-3 rounded-xl bg-slate-900 text-slate-300 font-mono text-[10px] flex items-center justify-between border border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>SHA-256 Checksum: {activeModalEvent.tamperChecksum}</span>
                </div>
                <span className="text-emerald-400 font-semibold">Integrity Verified</span>
              </div>
            </div>

            {/* Supervisor Feedback Input */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 text-xs flex items-center justify-between">
                <span>Field Supervisor Comments & Evaluative Feedback</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  (Returned to student and recorded in official audit ledger)
                </span>
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="E.g., Well documented case assessment. Good demonstration of active listening and trauma-informed interviewing techniques."
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {actionMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  actionMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {actionMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                )}
                <span>{actionMessage.text}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleAction("REJECTED")}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors border border-rose-200 disabled:opacity-50"
                >
                  Reject Entry
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleAction("QUERIED")}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors border border-purple-200 disabled:opacity-50"
                >
                  Query / Request Revision
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveModalEvent(null)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleAction("VERIFIED")}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting ? "Signing..." : "Verify & Approve Hours"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
