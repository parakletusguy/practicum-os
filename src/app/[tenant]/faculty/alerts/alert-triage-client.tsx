"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  Building2,
  User,
  ArrowRight,
} from "lucide-react";
import {
  resolveEarlyWarningAlertAction,
  runEarlyWarningScanAction,
} from "@/modules/supervision/actions";

interface AlertItem {
  id: string;
  alertType: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  isResolved: boolean;
  resolvedAt: string | Date | null;
  resolutionNotes: string | null;
  createdAt: string | Date;
  studentName: string;
  matricNumber: string;
  agencyName: string;
  fieldSupervisorName?: string;
  allocationId: string;
}

interface Props {
  initialAlerts: AlertItem[];
  cycleId: string;
  tenantSlug: string;
}

export function AlertTriageClient({ initialAlerts, cycleId, tenantSlug }: Props) {
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [resolvedFilter, setResolvedFilter] = useState<"UNRESOLVED" | "RESOLVED" | "ALL">(
    "UNRESOLVED"
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeModalAlert, setActiveModalAlert] = useState<AlertItem | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filteredAlerts = alerts.filter((a) => {
    const matchesSeverity = severityFilter === "ALL" || a.severity === severityFilter;
    const matchesResolved =
      resolvedFilter === "ALL"
        ? true
        : resolvedFilter === "RESOLVED"
        ? a.isResolved
        : !a.isResolved;
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.matricNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSeverity && matchesResolved && matchesSearch;
  });

  const unresolvedCount = alerts.filter((a) => !a.isResolved).length;
  const criticalCount = alerts.filter((a) => !a.isResolved && a.severity === "CRITICAL").length;
  const highCount = alerts.filter((a) => !a.isResolved && a.severity === "HIGH").length;

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalAlert) return;
    setIsSubmitting(true);
    setToastMessage(null);

    const formData = new FormData();
    formData.append("alertId", activeModalAlert.id);
    formData.append("resolutionNotes", resolutionNotes);
    formData.append("tenantSlug", tenantSlug);

    const res = await resolveEarlyWarningAlertAction(formData);

    if (res.success) {
      setAlerts((prev) =>
        prev.map((item) =>
          item.id === activeModalAlert.id
            ? {
                ...item,
                isResolved: true,
                resolvedAt: new Date(),
                resolutionNotes: resolutionNotes,
              }
            : item
        )
      );
      setToastMessage({ type: "success", text: "Alert resolved and documented in audit log." });
      setTimeout(() => {
        setActiveModalAlert(null);
        setResolutionNotes("");
        setToastMessage(null);
      }, 1000);
    } else {
      setToastMessage({ type: "error", text: res.error || "Failed to resolve alert." });
    }

    setIsSubmitting(false);
  };

  const handleRunScan = async () => {
    setIsScanning(true);
    setToastMessage(null);

    const res = await runEarlyWarningScanAction(cycleId, tenantSlug);

    if (res.success) {
      setToastMessage({
        type: "success",
        text: res.message || "Heuristic scan completed successfully.",
      });
      // reload or window refresh to pull any newly generated alerts
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } else {
      setToastMessage({ type: "error", text: res.error || "Failed to run early warning scan." });
    }

    setIsScanning(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Automated Scanner Button */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl border border-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            Heuristic Early Warning Engine
          </div>
          <h3 className="text-xl font-bold">Automated Practicum Risk Triage</h3>
          <p className="text-xs text-slate-300 max-w-xl mt-1">
            Scan your entire cohort for hours deficit, overdue logbook entries, missed supervisory visits, and ScopeGuard policy breaches.
          </p>
        </div>

        <button
          onClick={handleRunScan}
          disabled={isScanning}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-400 text-slate-950 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 flex-shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
          {isScanning ? "Scanning Cohort..." : "Execute Automated Risk Scan"}
        </button>
      </div>

      {toastMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Status filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setResolvedFilter("UNRESOLVED")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              resolvedFilter === "UNRESOLVED"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Unresolved ({unresolvedCount})
          </button>
          <button
            onClick={() => setResolvedFilter("RESOLVED")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              resolvedFilter === "RESOLVED"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Resolved History
          </button>
          <button
            onClick={() => setResolvedFilter("ALL")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              resolvedFilter === "ALL"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Alerts ({alerts.length})
          </button>
        </div>

        {/* Severity & Search */}
        <div className="flex items-center gap-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Severity</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium Severity</option>
            <option value="LOW">Low Severity</option>
          </select>

          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/60" />
            <h4 className="text-sm font-bold text-slate-800">No Alerts Found</h4>
            <p className="text-xs text-slate-400">All matching criteria are clear and on track.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === "CRITICAL";
            const isHigh = alert.severity === "HIGH";

            return (
              <div
                key={alert.id}
                className={`bg-white rounded-2xl border p-6 space-y-3 shadow-sm transition-all ${
                  alert.isResolved
                    ? "border-slate-200 opacity-70"
                    : isCritical
                    ? "border-rose-300 hover:border-rose-400 bg-rose-50/20"
                    : isHigh
                    ? "border-amber-300 hover:border-amber-400 bg-amber-50/20"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        alert.isResolved
                          ? "bg-slate-100 text-slate-700"
                          : isCritical
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : isHigh
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-blue-100 text-blue-800 border border-blue-200"
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {alert.severity}
                    </span>

                    <span className="text-xs font-bold text-slate-900">
                      {alert.studentName} ({alert.matricNumber})
                    </span>

                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-xs text-slate-500">{alert.agencyName}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{new Date(alert.createdAt).toLocaleDateString()}</span>
                    {alert.isResolved ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Resolved
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        Active Risk
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{alert.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {alert.description}
                  </p>
                </div>

                {/* If resolved: notes */}
                {alert.isResolved && alert.resolutionNotes && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                    <span className="font-bold text-slate-900 block text-[11px]">
                      Intervention / Resolution Audit Record:
                    </span>
                    {alert.resolutionNotes}
                  </div>
                )}

                {/* Action button if unresolved */}
                {!alert.isResolved && (
                  <div className="pt-2 flex items-center justify-end">
                    <button
                      onClick={() => {
                        setActiveModalAlert(alert);
                        setResolutionNotes("");
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-emerald-600 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Triage & Resolve Alert
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Triage & Resolution Modal */}
      {activeModalAlert && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                  Risk Resolution Protocol
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">
                  Resolve Early Warning Alert
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Trainee: {activeModalAlert.studentName} ({activeModalAlert.matricNumber})
                </p>
              </div>
              <button
                onClick={() => setActiveModalAlert(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-100 text-xs text-rose-950">
              <span className="font-bold block">{activeModalAlert.title}</span>
              <p className="mt-1 text-slate-600">{activeModalAlert.description}</p>
            </div>

            <form onSubmit={handleResolve} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Supervisory Intervention Notes & Corrective Actions *
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  required
                  rows={4}
                  placeholder="Detail the intervention taken (e.g. Consulted with agency supervisor, arranged 15 additional clinical hours, reviewed case documentation standards)..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModalAlert(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting ? "Documenting..." : "Confirm Alert Resolution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
