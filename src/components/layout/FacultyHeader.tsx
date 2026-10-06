"use client";

import { GraduationCap, AlertTriangle } from "lucide-react";
import { NetworkStatusBadge } from "@/components/ui/network-status-badge";
import { NotificationCenter } from "@/components/layout/NotificationCenter";

interface FacultyHeaderProps {
  facultyName: string;
  departmentName: string;
  activeAlertsCount?: number;
}

export function FacultyHeader({
  facultyName,
  departmentName,
  activeAlertsCount = 0,
}: FacultyHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center space-x-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-200">
          <GraduationCap className="w-3.5 h-3.5 text-blue-700" />
          University Faculty Supervisor
        </span>
        <span className="text-slate-400">|</span>
        <span className="text-xs font-medium text-slate-600 hidden md:inline">
          {departmentName}
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <NetworkStatusBadge />
        <NotificationCenter />

        {activeAlertsCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            {activeAlertsCount} Early Warning {activeAlertsCount === 1 ? "Alert" : "Alerts"} Flagged
          </div>
        )}

        <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
          <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-xs">
            {facultyName.slice(0, 2).toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-800">{facultyName}</div>
            <div className="text-[10px] text-slate-400">Academic Supervisor</div>
          </div>
        </div>
      </div>
    </header>
  );
}
