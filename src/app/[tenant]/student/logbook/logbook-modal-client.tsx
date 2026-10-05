"use client";

import { useState, useTransition } from "react";
import { Plus, X, Loader2, ShieldAlert, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
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

  const [formData, setFormData] = useState({
    eventDate: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "16:00",
    category: "DIRECT_CLIENT",
    clientRef: "CASE-2026-CFW-095",
    activityTitle: "",
    activityDescription: "",
    criticalReflection: "",
    competenciesTagged: ["EPAS-1: Ethical & Professional Behavior"],
    scopeLevel: "CO_PRACTICE" as PracticeScopeLevel,
  });

  const availableCompetencies = [
    "EPAS-1: Ethical & Professional Behavior",
    "EPAS-2: Advance Human Rights & Justice",
    "EPAS-3: Anti-Oppressive Practice",
    "EPAS-4: Practice-Informed Research",
    "EPAS-5: Policy Practice",
    "EPAS-6: Engage with Service Users",
    "EPAS-7: Psychosocial Assessment",
    "EPAS-8: Collaborative Intervention",
    "EPAS-9: Evaluate Practice Outcomes",
  ];

  // Live ScopeGuard check as user types title
  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({ ...prev, activityTitle: title }));
    const check = evaluateScopeGuard(title, formData.category, formData.scopeLevel);
    if (!check.allowed) {
      setScopeNotice(`ScopeGuard Alert: "${check.rule?.activity}" requires ${check.rule?.allowedScope}. ${check.rule?.rationale}`);
    } else {
      setScopeNotice(null);
    }
  };

  const handleScopeChange = (scope: PracticeScopeLevel) => {
    setFormData((prev) => ({ ...prev, scopeLevel: scope }));
    const check = evaluateScopeGuard(formData.activityTitle, formData.category, scope);
    if (!check.allowed) {
      setScopeNotice(`ScopeGuard Alert: "${check.rule?.activity}" requires ${check.rule?.allowedScope}. ${check.rule?.rationale}`);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await createPracticeEventAction({
        tenantSlug,
        allocationId,
        ...formData,
      });

      if (res.success) {
        setIsOpen(false);
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
        Log Practice Event
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  New Practice Event Entry
                </h3>
                <p className="text-xs text-slate-500">
                  Log supervised activity hours with ScopeGuard governance and reflection.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {error}
              </div>
            )}

            {scopeNotice && (
              <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>{scopeNotice}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
              {/* Activity Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Activity Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Psychosocial Assessment of Foster Minor / Community Sensitization on Child Labor"
                  value={formData.activityTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Category & Scope Level */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Practice Typology
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="DIRECT_CLIENT">Direct Client Consultation</option>
                    <option value="CASE_CONFERENCE">Case Conference / Inter-Agency</option>
                    <option value="HOME_VISIT">Home Visit / Environmental Scan</option>
                    <option value="COMMUNITY_OUTREACH">Community Outreach & Dialogue</option>
                    <option value="ADMIN">Documentation & Case Review</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Scope of Practice Level
                  </label>
                  <select
                    value={formData.scopeLevel}
                    onChange={(e) => handleScopeChange(e.target.value as PracticeScopeLevel)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="CO_PRACTICE">Co-Practice with Senior Practitioner</option>
                    <option value="DIRECT_SUPERVISION">Direct Observation by Field Supervisor</option>
                    <option value="INDEPENDENT">Independent (Permitted Tasks Only)</option>
                  </select>
                </div>
              </div>

              {/* Date & Time Range */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Client Ref (Anti-PII) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    De-Identified Client Reference
                  </label>
                  <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Zero PII Enforced
                  </span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. CASE-2026-CFW-095 (Never use real names or phone numbers)"
                  value={formData.clientRef}
                  onChange={(e) => setFormData({ ...formData, clientRef: e.target.value })}
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Practice Activity Description
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Describe specifically what practice occurred, the context, and your concrete role..."
                  value={formData.activityDescription}
                  onChange={(e) => setFormData({ ...formData, activityDescription: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Critical Reflection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Critical Reflection & Learning Insight
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="What ethical challenges arose? How did you apply theory to practice? What would you do differently?"
                  value={formData.criticalReflection}
                  onChange={(e) => setFormData({ ...formData, criticalReflection: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 italic"
                />
              </div>

              {/* Competency Tagging */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Demonstrated Competencies (Practice DNA)
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-2 rounded-lg border border-slate-100 bg-slate-50 text-xs">
                  {availableCompetencies.map((comp) => {
                    const isSelected = formData.competenciesTagged.includes(comp);
                    return (
                      <button
                        type="button"
                        key={comp}
                        onClick={() => toggleCompetency(comp)}
                        className={`text-left p-1.5 rounded text-[11px] font-medium transition-colors ${
                          isSelected
                            ? "bg-emerald-600 text-white font-semibold"
                            : "text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {comp}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isPending ? "Committing Event..." : "Submit to Field Supervisor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
