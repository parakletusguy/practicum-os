"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  CalendarCheck,
  AlertTriangle,
  Users,
  Award,
  LogOut,
  ExternalLink,
  BookOpen,
} from "lucide-react";

interface FacultySidebarProps {
  tenantSlug: string;
  facultyName: string;
  departmentName: string;
  activeAlertsCount?: number;
}

export function FacultySidebar({
  tenantSlug,
  facultyName,
  departmentName,
  activeAlertsCount = 0,
}: FacultySidebarProps) {
  const pathname = usePathname();

  const links = [
    {
      name: "Faculty Caseload",
      href: `/${tenantSlug}/faculty`,
      icon: Users,
    },
    {
      name: "Supervision Visits",
      href: `/${tenantSlug}/faculty/visits`,
      icon: CalendarCheck,
    },
    {
      name: "Early Warning Triage",
      href: `/${tenantSlug}/faculty/alerts`,
      icon: AlertTriangle,
      badge: activeAlertsCount > 0 ? activeAlertsCount : null,
    },
    {
      name: "Academic Evaluations",
      href: `/${tenantSlug}/faculty/evaluations`,
      icon: Award,
    },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col flex-shrink-0 text-slate-300">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight">Faculty Desk</h1>
            <p className="text-xs text-blue-400 font-medium">Academic Supervision</p>
          </div>
        </div>

        {/* Faculty Profile Card */}
        <div className="mt-4 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          <div className="text-slate-400 font-medium truncate">{departmentName}</div>
          <div className="text-white font-semibold flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>
            {facultyName}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Supervision Modules
        </div>
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== `/${tenantSlug}/faculty` && pathname.startsWith(link.href));
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{link.name}</span>
              </div>
              {link.badge && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-4 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Cross-Role Workspaces
        </div>
        <Link
          href={`/${tenantSlug}/field`}
          className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            Field Supervisor Desk
          </span>
        </Link>
        <Link
          href={`/${tenantSlug}/student`}
          className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            Trainee Practice View
          </span>
        </Link>
        <Link
          href={`/${tenantSlug}/admin`}
          className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            Coordinator Admin Portal
          </span>
        </Link>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <Link
          href="/"
          className="flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit to PracticumOS Gateways</span>
        </Link>
      </div>
    </aside>
  );
}
