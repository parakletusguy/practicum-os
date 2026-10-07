"use client";

import { useState, useTransition } from "react";
import { Plus, X, Loader2, ShieldAlert, CheckCircle2, AlertTriangle, FileText, UploadCloud, Paperclip, Trash2 } from "lucide-react";
import { createPracticeEventAction } from "@/modules/logbook/actions";
import { PracticeScopeLevel } from "@prisma/client";
import { evaluateScopeGuard } from "@/modules/scope-guard/policy";

interface LogbookModalClientProps {
  tenantSlug: string;
  allocationId: string;
}

export function LogbookModalClient({
  tenantSlug,
  allocationId,
}: LogbookModalClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [scopeNotice, setScopeNotice] = useState<string | null>(null);

  // Evidence upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedEvidence, setUploadedEvidence] = useState<{
    url: string;
    checksum: string;
    name: string;
    size: number;
  } | null>(null);

  const [formData, setFormData] = useState({
    eventDate: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "16:00",
    category: "DIRECT_CLIENT",
    clientRef: "CASE-2026-CFW-095",
    activityTitle: "",
    activityDescription: "",
    criticalReflection: "",
    competenciesTagged: ["Ethical & Professional Conduct"],
    scopeLevel: "CO_PRACTICE" as PracticeScopeLevel,
  });

  const availableCompetencies = [
    "Ethical & Professional Conduct",
    "Advancing Human Rights & Social Justice",
    "Inclusive & Anti-Oppressive Practice",
    "Evidence-Informed Practice",
    "Social Policy & Advocacy",
    "Client Engagement & Building Trust",
    "Comprehensive Needs Assessment",
    "Collaborative Interventions",
    "Evaluating Client Outcomes",
  ];

  // Live ScopeGuard check as user types title
  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({ ...prev, activityTitle: title }));
    const check = evaluateScopeGuard(title, formData.category, formData.scopeLevel);
    if (!check.allowed) {
      setScopeNotice(`Safety Guideline: "${check.rule?.activity}" requires ${check.rule?.allowedScope}. ${check.rule?.rationale}`);
    } else {
      setScopeNotice(null);
    }
  };

  const handleScopeChange = (scope: PracticeScopeLevel) => {
    setFormData((prev) => ({ ...prev, scopeLevel: scope }));
    const check = evaluateScopeGuard(formData.activityTitle, formData.category, scope);
    if (!check.allowed) {
      setScopeNotice(`Safety Guideline: "${check.rule?.activity}" requires ${check.rule?.allowedScope}. ${check.rule?.rationale}`);
    } else {
      setScopeNotice(null);
    }
  };

  const toggleCompetency = (comp: string) => {
    setFormData((prev) => {
      const exists = prev.competenciesTagged.includes(comp);
      const updated = exists
        ? prev.competenciesTagged.filter((c) => c !== comp)
        : [...prev.competenciesTagged, comp];
      return { ...prev, competenciesTagged: updated.length > 0 ? updated : [comp] };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/storage/upload", {
        method: "POST",
        body: data,
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setUploadedEvidence({
          url: result.url,
          checksum: result.checksum,
          name: result.sanitizedFilename,
          size: result.fileSizeBytes,
        });
      } else {
        setUploadError(result.error || "Upload failed. Please try again.");
      }
    } catch (err: any) {
      setUploadError(err.message || "Network error uploading file.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await createPracticeEventAction({
        tenantSlug,
        allocationId,
        ...formData,
        evidenceUrl: uploadedEvidence?.url,
      });

      if (res.success) {
        setIsOpen(false);
        setUploadedEvidence(null);
      } else {
        setError(res.error || "Failed to log practice event.");
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        Log Activity & Hours
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] sm:max-h-[88vh]">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Log Fieldwork Activity
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record your practice hours, tasks, and reflections for your supervisor.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {error}
              </div>
            )}

            {scopeNotice && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>{scopeNotice}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
              {/* Activity Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Activity Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Initial intake session with family / Community sensitization workshop"
                  value={formData.activityTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Category & Scope Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Activity Type
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="DIRECT_CLIENT">Direct Client Meeting</option>
                    <option value="CASE_CONFERENCE">Case Conference / Multi-Agency</option>
                    <option value="HOME_VISIT">Home Visit / Needs Assessment</option>
                    <option value="COMMUNITY_OUTREACH">Community Outreach & Workshop</option>
                    <option value="ADMIN">Documentation & Case Notes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Supervision Level
                  </label>
                  <select
                    value={formData.scopeLevel}
                    onChange={(e) => handleScopeChange(e.target.value as PracticeScopeLevel)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="CO_PRACTICE">Co-Practice (Working with supervisor)</option>
                    <option value="DIRECT_SUPERVISION">Direct Observation (Supervisor watching)</option>
                    <option value="INDEPENDENT">Independent (Authorized tasks only)</option>
                  </select>
                </div>
              </div>

              {/* Date & Time Range */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Client Ref (Privacy Safeguard) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Confidential Case Reference *
                  </label>
                  <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Privacy Protected
                  </span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. CASE-2026-095 (Never use real client names or numbers)"
                  value={formData.clientRef}
                  onChange={(e) => setFormData({ ...formData, clientRef: e.target.value })}
                  className="w-full text-xs sm:text-sm font-mono px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  What tasks did you carry out? *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Summarize the activities, context, and your specific role..."
                  value={formData.activityDescription}
                  onChange={(e) => setFormData({ ...formData, activityDescription: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Reflection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Key Learnings & Reflections *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="What went well? What challenges arose, and what did you learn from this experience?"
                  value={formData.criticalReflection}
                  onChange={(e) => setFormData({ ...formData, criticalReflection: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Competency Tagging */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Skills & Competencies Practiced
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                  {availableCompetencies.map((comp) => {
                    const isSelected = formData.competenciesTagged.includes(comp);
                    return (
                      <button
                        type="button"
                        key={comp}
                        onClick={() => toggleCompetency(comp)}
                        className={`text-left p-2 rounded-lg text-xs font-medium transition-colors ${
                          isSelected
                            ? "bg-emerald-600 text-white font-semibold"
                            : "text-slate-600 hover:bg-slate-200/70"
                        }`}
                      >
                        {isSelected ? `✓ ${comp}` : `+ ${comp}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Document Attachment */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-emerald-600" />
                    Supporting Documents (Kept Confidential)
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">PDF, PNG, JPG (Max 10MB)</span>
                </div>

                {uploadError && (
                  <p className="text-[11px] text-rose-600 font-medium">{uploadError}</p>
                )}

                {uploadedEvidence ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-emerald-200 shadow-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                        <Paperclip className="w-4 h-4" />
                      </div>
                      <div className="text-left truncate">
                        <div className="text-xs font-semibold text-slate-800 truncate">
                          {uploadedEvidence.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {(uploadedEvidence.size / 1024).toFixed(1)} KB • Encrypted & Protected
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <a
                        href={uploadedEvidence.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-800"
                      >
                        View
                      </a>
                      <button
                        type="button"
                        onClick={() => setUploadedEvidence(null)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-slate-300 hover:border-emerald-500 rounded-xl bg-white cursor-pointer transition-colors group">
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                          <span className="text-xs text-slate-600 font-medium">
                            Protecting privacy & uploading file...
                          </span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                          <span className="text-xs text-slate-600 font-medium group-hover:text-slate-900">
                            Attach Case Document, Notes, or Fieldwork Form
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isPending ? "Submitting..." : "Submit for Supervisor Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
