"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  Users,
  Award,
  LogOut,
  Building2,
  ExternalLink,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/layout/SidebarContext";

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
  const { isOpen, close } = useSidebar();

  const links = [
    {
      name: "Supervisor Dashboard",
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
      name: "Assigned Students",
      href: `/${tenantSlug}/field/trainees`,
      icon: Users,
    },
    {
      name: "Student Evaluations",
      href: `/${tenantSlug}/field/evaluations`,
      icon: Award,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 text-slate-300 transition-transform duration-200 ease-in-out z-50",
          "fixed inset-y-0 left-0 md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Agency & Brand Header */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-white text-sm leading-tight">Field Supervisor</h1>
                <p className="text-[11px] text-emerald-400 font-medium">Agency Workspace</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={close}
              className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Agency Badge */}
          <div className="mt-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
            <div className="text-slate-400 font-medium truncate">{agencyName}</div>
            <div className="text-white font-semibold flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
              {supervisorName}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Agency Tasks
          </div>
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== `/${tenantSlug}/field` && pathname.startsWith(link.href));
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={close}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all",
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                )}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{link.name}</span>
                </div>
                {link.badge && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-4 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Switch Portals
          </div>
          <Link
            href={`/${tenantSlug}/student`}
            onClick={close}
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Student View
            </span>
          </Link>
          <Link
            href={`/${tenantSlug}/faculty`}
            onClick={close}
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Academic Supervisor
            </span>
          </Link>
          <Link
            href={`/${tenantSlug}/admin`}
            onClick={close}
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Coordinator Portal
            </span>
          </Link>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800">
          <Link
            href="/"
            onClick={close}
            className="flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
