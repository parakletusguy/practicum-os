"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, AlertTriangle, ShieldAlert, CheckCircle2, X, ExternalLink, Clock } from "lucide-react";

interface AlertItem {
  id: string;
  title: string;
  description: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  alertType: string;
  isResolved: boolean;
  createdAt: string;
  studentName: string;
  agencyName: string;
}

export function NotificationCenter({ tenantSlug = "unilag" }: { tenantSlug?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/notifications?tenant=${encodeURIComponent(tenantSlug)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setAlerts(data.alerts);
        setActiveCount(data.activeCount);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [tenantSlug]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "HIGH":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "MEDIUM":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        title={activeCount > 0 ? `${activeCount} Active Safeguarding Alerts` : "Notification Center"}
      >
        <Bell className="w-4 h-4" />
        {activeCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border border-white" />
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-xl border border-slate-200 z-50 overflow-hidden text-left font-sans">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-100">
                Safeguarding & Alerts
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {activeCount} Active
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2">
            {alerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2 opacity-80" />
                No pending early warning alerts. Practicum safety normal.
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="p-3 hover:bg-slate-50 rounded-xl transition-colors space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getSeverityBadge(
                        alert.severity
                      )}`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-slate-800 leading-snug">
                    {alert.title}
                  </h5>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {alert.description}
                  </p>

                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                    <span className="font-medium text-slate-600 truncate">{alert.studentName}</span>
                    <span className="truncate">{alert.agencyName}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Link */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link
              href={`/${tenantSlug}/admin/alerts`}
              onClick={() => setIsOpen(false)}
              className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
            >
              <span>Open Early Warning Center</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <button
              onClick={fetchAlerts}
              className="text-[11px] text-slate-500 hover:text-slate-800"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
