"use client";

import { Bell, ShieldCheck, UserCheck } from "lucide-react";
import { NetworkStatusBadge } from "@/components/ui/network-status-badge";
import { NotificationCenter } from "@/components/layout/NotificationCenter";

interface FieldHeaderProps {
  supervisorName: string;
  agencyName: string;
  pendingCount?: number;
}

export function FieldHeader({
  supervisorName,
  agencyName,
  pendingCount = 0,
}: FieldHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center space-x-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Field Practice Supervisor
        </span>
        <span className="text-slate-400">|</span>
        <span className="text-xs font-medium text-slate-600 hidden md:inline">
          {agencyName}
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <NetworkStatusBadge />
        <NotificationCenter />

        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            {pendingCount} Logbook {pendingCount === 1 ? "Entry" : "Entries"} Awaiting Verification
          </div>
        )}

        <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
            {supervisorName.slice(0, 2).toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-800">{supervisorName}</div>
            <div className="text-[10px] text-slate-400">Certified Field Instructor</div>
          </div>
        </div>
      </div>
    </header>
  );
}
