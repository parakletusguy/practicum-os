"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  Users,
  FileCheck,
  Award,
  LogOut,
  Building2,
  ExternalLink,
} from "lucide-react";

interface FieldSidebarProps {
  tenantSlug: string;
  supervisorName: string;
  agencyName: string;
  pendingCount?: number;
}

export function FieldSidebar({
  tenantSlug,
  supervisorName,
  agencyName,
  pendingCount = 0,
}: FieldSidebarProps) {
  const pathname = usePathname();

  const links = [
    {
      name: "Supervision Dashboard",
      href: `/${tenantSlug}/field`,
      icon: ShieldCheck,
    },
    {
      name: "Logbook Verifications",
      href: `/${tenantSlug}/field/verifications`,
      icon: CheckCircle2,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      name: "Assigned Trainees",
      href: `/${tenantSlug}/field/trainees`,
      icon: Users,
    },
    {
      name: "Midpoint / Final Rubrics",
      href: `/${tenantSlug}/field/evaluations`,
      icon: Award,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 text-slate-300">
      {/* Agency & Brand Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight">Field Supervisor</h1>
            <p className="text-xs text-emerald-400 font-medium">Practice Agency Desk</p>
          </div>
        </div>

        {/* Agency Badge */}
        <div className="mt-4 p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
          <div className="text-slate-400 font-medium truncate">{agencyName}</div>
          <div className="text-white font-semibold flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
            {supervisorName}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Agency Workstation
        </div>
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== `/${tenantSlug}/field` && pathname.startsWith(link.href));
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{link.name}</span>
              </div>
              {link.badge && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-4 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Cross-Role Portals
        </div>
        <Link
          href={`/${tenantSlug}/student`}
          className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            Switch to Trainee View
          </span>
        </Link>
        <Link
          href={`/${tenantSlug}/faculty`}
          className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            Academic Supervisor Desk
          </span>
        </Link>
        <Link
          href={`/${tenantSlug}/admin`}
          className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            Coordinator Admin Portal
          </span>
        </Link>
      </nav>

      {/* Footer Return Home */}
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
