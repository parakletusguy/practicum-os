"use client";

import Link from "next/link";
import { Bell, Shield, User, ChevronDown } from "lucide-react";
import { NetworkStatusBadge } from "@/components/ui/network-status-badge";

interface TenantHeaderProps {
  tenantSlug: string;
  currentRole?: string;
  userName?: string;
}

export function TenantHeader({
  tenantSlug,
  currentRole = "COORDINATOR",
  userName = "Dr. Adebayo Ogunlesi",
}: TenantHeaderProps) {
  const roles = [
    { label: "Practicum Coordinator", role: "COORDINATOR", href: `/${tenantSlug}/admin` },
    { label: "Academic Supervisor", role: "ACADEMIC_SUPERVISOR", href: `/${tenantSlug}/faculty` },
    { label: "Field Supervisor", role: "FIELD_SUPERVISOR", href: `/${tenantSlug}/field` },
    { label: "Student / Trainee", role: "STUDENT", href: `/${tenantSlug}/student` },
  ];

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Faculty of Social Sciences
        </span>
        <span className="text-slate-300">•</span>
        <span className="text-xs font-medium text-slate-600">
          Department of Social Work
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Role Switcher (Simulates the Universal Person's Contextual Role) */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <Shield className="w-3.5 h-3.5 text-emerald-600 ml-1.5" />
          <span className="text-[11px] font-semibold text-slate-600">Simulate Role:</span>
          <div className="flex gap-1">
            {roles.map((r) => (
              <Link
                key={r.role}
                href={r.href}
                className={`text-[11px] font-medium px-2 py-1 rounded transition-all ${
                  currentRole === r.role
                    ? "bg-white text-emerald-700 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {r.label.split(" ")[0]}
              </Link>
            ))}
          </div>
        </div>

        {/* Offline / Online Network Sync Badge */}
        <NetworkStatusBadge />

        {/* Notifications */}
        <button
          type="button"
          className="relative p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="1 Active Alert"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
        </button>

        {/* User Card */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            AO
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-800 leading-tight">
              {userName}
            </div>
            <div className="text-[10px] text-emerald-600 font-medium">
              Field Director & Admin
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
