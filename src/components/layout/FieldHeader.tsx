"use client";

import { Bell, ShieldCheck, UserCheck, Menu } from "lucide-react";
import { NetworkStatusBadge } from "@/components/ui/network-status-badge";
import { NotificationCenter } from "@/components/layout/NotificationCenter";
import { useSidebar } from "@/components/layout/SidebarContext";

interface FieldHeaderProps {
  tenantSlug: string;
  supervisorName: string;
  agencyName: string;
  pendingCount?: number;
}

export function FieldHeader({
  tenantSlug,
  supervisorName,
  agencyName,
  pendingCount = 0,
}: FieldHeaderProps) {
  const { toggle } = useSidebar();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <button
          type="button"
          onClick={toggle}
          className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="truncate max-w-[130px] sm:max-w-none">Field Supervisor</span>
        </span>
        <span className="text-slate-300 hidden sm:inline">|</span>
        <span className="text-xs font-medium text-slate-600 hidden lg:inline">
          {agencyName}
        </span>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        <div className="hidden sm:block">
          <NetworkStatusBadge />
        </div>
        <NotificationCenter tenantSlug={tenantSlug} />

        {pendingCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] sm:text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            <span>{pendingCount} Pending</span>
          </div>
        )}

        <div className="flex items-center space-x-2 sm:space-x-3 border-l border-slate-200 pl-2 sm:pl-4">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {supervisorName.slice(0, 2).toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-800">{supervisorName}</div>
            <div className="text-[10px] text-slate-400">Field Supervisor</div>
          </div>
        </div>
      </div>
    </header>
  );
}
