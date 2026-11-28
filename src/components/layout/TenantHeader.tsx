"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, ChevronDown, Menu } from "lucide-react";
import { NetworkStatusBadge } from "@/components/ui/network-status-badge";
import { NotificationCenter } from "@/components/layout/NotificationCenter";
import { PracticumMark } from "@/components/layout/PracticumLogo";
import { useSidebar } from "@/components/layout/SidebarContext";
import { actionStyle } from "@/components/ui/action-styles";

interface TenantHeaderProps {
  tenantSlug: string;
  tenantName: string;
  currentRole: string;
  userName: string;
  roleLabel?: string;
  allowRoleSwitch?: boolean;
}

export function TenantHeader({
  tenantSlug,
  tenantName,
  currentRole,
  userName,
  roleLabel,
  allowRoleSwitch = false,
}: TenantHeaderProps) {
  const { isOpen, toggle } = useSidebar();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const roles = [
    { label: "Coordinator", role: "COORDINATOR", href: `/${tenantSlug}/admin` },
    { label: "Academic Supervisor", role: "ACADEMIC_SUPERVISOR", href: `/${tenantSlug}/faculty` },
    { label: "Field Supervisor", role: "FIELD_SUPERVISOR", href: `/${tenantSlug}/field` },
    { label: "Student Trainee", role: "STUDENT", href: `/${tenantSlug}/student` },
  ];

  const currentRoleObj = roles.find((r) => r.role === currentRole) || roles[0];
  const initials = userName.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase();

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-3 sm:px-6 z-20 sticky top-0">
      {/* Left side: Hamburger toggle + breadcrumb */}
      <div className="flex min-w-0 items-center gap-2 pr-2 sm:gap-3">
        <button
          id="tenant-menu-button"
          type="button"
          onClick={toggle}
          className={actionStyle("secondary", "shrink-0 gap-1.5 px-2.5 md:hidden")}
          aria-controls="tenant-admin-navigation"
          aria-expanded={isOpen}
        >
          <Menu aria-hidden="true" className="size-4" /> Menu
        </button>

        <div className="flex min-w-0 items-center gap-2">
          <PracticumMark className="size-7 md:hidden" />
          <span className="truncate text-xs font-semibold text-slate-700 sm:text-sm">
            {tenantName}
          </span>
        </div>
      </div>

      {/* Right side: Role switcher + sync badge + notifications + user */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Desktop Role Switcher */}
        {allowRoleSwitch && <div className="hidden lg:flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
          <Shield className="w-3.5 h-3.5 text-emerald-600 ml-1.5" />
          <span className="text-[11px] font-semibold text-slate-600">Switch View:</span>
          <div className="flex gap-1">
            {roles.map((r) => (
              <Link
                key={r.role}
                href={r.href}
                className={`text-[11px] font-medium px-2 py-1 rounded-lg transition-all ${
                  currentRole === r.role
                    ? "bg-white text-emerald-700 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {r.label.split(" ")[0]}
              </Link>
            ))}
          </div>
        </div>}

        {/* Mobile / Tablet Role Switcher Dropdown */}
        {allowRoleSwitch && <div className="relative lg:hidden">
          <button
            type="button"
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
          >
            <Shield className="w-3 h-3 text-emerald-600" />
            <span className="truncate max-w-[70px] sm:max-w-[100px]">{currentRoleObj.label.split(" ")[0]}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs">
              <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Switch Role View
              </div>
              {roles.map((r) => (
                <Link
                  key={r.role}
                  href={r.href}
                  onClick={() => setRoleDropdownOpen(false)}
                  className={`block px-3 py-2 text-xs font-medium transition-colors ${
                    currentRole === r.role
                      ? "bg-emerald-50 text-emerald-700 font-bold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {r.label}
                </Link>
              ))}
            </div>
          )}
        </div>}

        {/* Offline / Online Network Sync Badge */}
        <div className="hidden sm:block">
          <NetworkStatusBadge />
        </div>

        {/* Safeguarding & Alerts Notification Center */}
        <NotificationCenter tenantSlug={tenantSlug} />

        {/* User Card */}
        <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-200" title={`${userName} · ${roleLabel ?? currentRoleObj.label}`}>
          <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {initials}
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-bold text-slate-800 leading-tight">
              {userName}
            </div>
            <div className="text-[10px] text-emerald-600 font-medium">
              {roleLabel ?? currentRoleObj.label}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
