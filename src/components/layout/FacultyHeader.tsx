"use client";

import { GraduationCap, AlertTriangle, Menu } from "lucide-react";
import { NetworkStatusBadge } from "@/components/ui/network-status-badge";
import { NotificationCenter } from "@/components/layout/NotificationCenter";
import { useSidebar } from "@/components/layout/SidebarContext";

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
  const { toggle } = useSidebar();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <button
          type="button"
          onClick={toggle}
          className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
          <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
          <span className="truncate max-w-[130px] sm:max-w-none">Faculty Supervisor</span>
        </span>
        <span className="text-slate-300 hidden sm:inline">|</span>
        <span className="text-xs font-medium text-slate-600 hidden lg:inline">
          {departmentName}
        </span>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        <div className="hidden sm:block">
          <NetworkStatusBadge />
        </div>
        <NotificationCenter />

        {activeAlertsCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-[11px] sm:text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
            <span>{activeAlertsCount} Alert{activeAlertsCount === 1 ? "" : "s"}</span>
          </div>
        )}

        <div className="flex items-center space-x-2 sm:space-x-3 border-l border-slate-200 pl-2 sm:pl-4">
          <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
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
