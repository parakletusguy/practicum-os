"use client";

import { useState } from "react";
import {
  CalendarCheck,
  Plus,
  MapPin,
  Video,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Building2,
  User,
} from "lucide-react";
import { createSupervisionVisitAction } from "@/modules/supervision/actions";

interface AllocationOption {
  id: string;
  studentName: string;
  matricNumber: string;
  agencyName: string;
}

interface VisitItem {
  id: string;
  visitDate: string | Date;
  visitType: "PHYSICAL_ON_SITE" | "REMOTE_VIDEO" | "TELEPHONE";
  generalObservations: string;
  agencyFeedback: string | null;
  actionItems: string[];
  studentProgressRating: string | null;
  followUpRequired: boolean;
  followUpDate: string | Date | null;
  studentName: string;
  matricNumber: string;
  agencyName: string;
  supervisorName: string;
}

interface Props {
  allocations: AllocationOption[];
  initialVisits: VisitItem[];
  supervisorPersonId: string;
  tenantSlug: string;
  preselectedAllocationId?: string;
}

export function SupervisionVisitModalClient({
  allocations,
  initialVisits,
  supervisorPersonId,
  tenantSlug,
  preselectedAllocationId,
}: Props) {
  const [visits, setVisits] = useState<VisitItem[]>(initialVisits);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(!!preselectedAllocationId);
  const [selectedAllocationId, setSelectedAllocationId] = useState<string>(
    preselectedAllocationId || (allocations[0]?.id ?? "")
  );
  const [visitType, setVisitType] = useState<"PHYSICAL_ON_SITE" | "REMOTE_VIDEO" | "TELEPHONE">(
    "PHYSICAL_ON_SITE"
  );
  const [visitDate, setVisitDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [generalObservations, setGeneralObservations] = useState<string>("");
  const [agencyFeedback, setAgencyFeedback] = useState<string>("");
  const [actionItemsText, setActionItemsText] = useState<string>("");
  const [studentProgressRating, setStudentProgressRating] = useState<string>("SATISFACTORY");
  const [followUpRequired, setFollowUpRequired] = useState<boolean>(false);
  const [followUpDate, setFollowUpDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append("allocationId", selectedAllocationId);
    formData.append("supervisorPersonId", supervisorPersonId);
    formData.append("visitDate", visitDate);
    formData.append("visitType", visitType);
    formData.append("generalObservations", generalObservations);
    formData.append("agencyFeedback", agencyFeedback);
    formData.append("actionItems", actionItemsText);
    formData.append("studentProgressRating", studentProgressRating);
    formData.append("followUpRequired", followUpRequired ? "true" : "false");
    formData.append("followUpDate", followUpDate);
    formData.append("tenantSlug", tenantSlug);

    const res = await createSupervisionVisitAction(formData);

    if (res.success && res.visit) {
      const selectedAlloc = allocations.find((a) => a.id === selectedAllocationId);
      const newVisit: VisitItem = {
        id: res.visit.id,
        visitDate: res.visit.visitDate,
        visitType: res.visit.visitType,
        generalObservations: res.visit.generalObservations,
        agencyFeedback: res.visit.agencyFeedback,
        actionItems: res.visit.actionItems,
        studentProgressRating: res.visit.studentProgressRating,
        followUpRequired: res.visit.followUpRequired,
        followUpDate: res.visit.followUpDate,
        studentName: selectedAlloc?.studentName || "Student",
        matricNumber: selectedAlloc?.matricNumber || "",
        agencyName: selectedAlloc?.agencyName || "",
        supervisorName: "Faculty Supervisor",
      };

      setVisits([newVisit, ...visits]);
      setStatusMessage({ type: "success", text: "Supervision visit logged successfully." });

      setTimeout(() => {
        setIsModalOpen(false);
        setGeneralObservations("");
        setAgencyFeedback("");
        setActionItemsText("");
        setStatusMessage(null);
      }, 1000);
    } else {
      setStatusMessage({ type: "error", text: res.error || "Failed to log visit." });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{visits.length}</span> documented
          supervision visits in your academic cycle.
        </div>
        <button
          onClick={() => {
            setIsModalOpen(true);
            setStatusMessage(null);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          Record New Supervision Visit
        </button>
      </div>

      {/* Visits Timeline / Card List */}
      <div className="space-y-4">
        {visits.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
            <CalendarCheck className="w-12 h-12 mx-auto text-blue-500/50" />
            <h4 className="text-base font-bold text-slate-800">No Supervision Visits Documented</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              You have not recorded any physical on-site or virtual liaison visits for this cohort.
              Click the button above to log your first supervision visit.
            </p>
          </div>
        ) : (
          visits.map((visit) => {
            const isAtRisk = visit.studentProgressRating === "AT_RISK";
            const isNeedsImp = visit.studentProgressRating === "NEEDS_IMPROVEMENT";

            return (
              <div
                key={visit.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 hover:border-blue-300 transition-all"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow ${
                        visit.visitType === "PHYSICAL_ON_SITE"
                          ? "bg-emerald-600"
                          : visit.visitType === "REMOTE_VIDEO"
                          ? "bg-blue-600"
                          : "bg-indigo-600"
                      }`}
                    >
                      {visit.visitType === "PHYSICAL_ON_SITE" ? (
                        <MapPin className="w-5 h-5" />
                      ) : visit.visitType === "REMOTE_VIDEO" ? (
                        <Video className="w-5 h-5" />
                      ) : (
                        <Phone className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">
                          {visit.studentName}
                        </h3>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {visit.matricNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {visit.agencyName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-medium">
                      {new Date(visit.visitDate).toLocaleDateString(undefined, {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        isAtRisk
                          ? "bg-rose-100 text-rose-800 border-rose-200"
                          : isNeedsImp
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-emerald-100 text-emerald-800 border-emerald-200"
                      }`}
                    >
                      {visit.studentProgressRating?.replace("_", " ") || "SATISFACTORY"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                      Academic Supervisor Observations
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                      {visit.generalObservations}
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                      Host Agency Feedback
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                      {visit.agencyFeedback || "No specific agency concerns raised."}
                    </p>
                  </div>
                </div>

                {/* Action Items */}
                {visit.actionItems.length > 0 && (
                  <div className="pt-2 text-xs space-y-1.5">
                    <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block">
                      Agreed Action Items & Development Directives:
                    </span>
                    <ul className="space-y-1">
                      {visit.actionItems.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Follow-up flag */}
                {visit.followUpRequired && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Follow-up visit mandatory
                    </span>
                    {visit.followUpDate && (
                      <span className="font-mono text-[11px]">
                        Target Date: {new Date(visit.followUpDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Record Visit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-6 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                  Institutional Supervision Record
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2">
                  Document Supervision Visit
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record physical site liaison, clinical assessment, and agency feedback.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Student / Placement Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Select Supervised Trainee & Agency *
                </label>
                <select
                  value={selectedAllocationId}
                  onChange={(e) => setSelectedAllocationId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {allocations.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.studentName} ({a.matricNumber}) — {a.agencyName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Visit Modality *
                  </label>
                  <select
                    value={visitType}
                    onChange={(e) => setVisitType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="PHYSICAL_ON_SITE">Physical On-Site Visit</option>
                    <option value="REMOTE_VIDEO">Remote Video Conference</option>
                    <option value="TELEPHONE">Structured Telephone Liaison</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Visit Date *
                  </label>
                  <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Observations */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  General Clinical Observations & Student Performance *
                </label>
                <textarea
                  value={generalObservations}
                  onChange={(e) => setGeneralObservations(e.target.value)}
                  required
                  rows={3}
                  placeholder="Detail trainee's casework competence, professional posture, theoretical integration, and engagement with agency staff..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Agency Feedback */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Field Supervisor / Agency Feedback
                </label>
                <textarea
                  value={agencyFeedback}
                  onChange={(e) => setAgencyFeedback(e.target.value)}
                  rows={2}
                  placeholder="Comments from the on-site field supervisor regarding attendance, ethics, client interaction..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Action items */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Agreed Action Items & Development Targets (One per line)
                </label>
                <textarea
                  value={actionItemsText}
                  onChange={(e) => setActionItemsText(e.target.value)}
                  rows={2}
                  placeholder="1. Deepen documentation on family trauma histories.&#10;2. Co-lead community sensitization meeting next Thursday."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>

              {/* Progress Rating */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Student Progress Rating *
                  </label>
                  <select
                    value={studentProgressRating}
                    onChange={(e) => setStudentProgressRating(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="SATISFACTORY">Satisfactory (On Track)</option>
                    <option value="NEEDS_IMPROVEMENT">Needs Improvement (Notice)</option>
                    <option value="AT_RISK">At Risk (Triggers Early Warning Alert)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={followUpRequired}
                      onChange={(e) => setFollowUpRequired(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Follow-up visit required</span>
                  </label>
                  {followUpRequired && (
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  )}
                </div>
              </div>

              {statusMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    statusMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {statusMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <CalendarCheck className="w-4 h-4" />
                  {isSubmitting ? "Logging Visit..." : "Commit Official Visit Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
