"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Building2, 
  Shuffle, 
  MailCheck, 
  BookOpenCheck, 
  Car, 
  AlertTriangle, 
  FileSpreadsheet, 
  GraduationCap, 
  ShieldAlert, 
  History,
  ShieldCheck,
  ChevronRight,
  HeartHandshake,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/layout/SidebarContext";

interface TenantSidebarProps {
  tenantSlug: string;
  tenantName: string;
}

export function TenantSidebar({ tenantSlug, tenantName }: TenantSidebarProps) {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();

  const navigationGroups = [
    {
      title: "Core Administration",
      items: [
        {
          name: "Dashboard",
          href: `/${tenantSlug}/admin`,
          icon: LayoutDashboard,
        },
        {
          name: "Placement Cycles",
          href: `/${tenantSlug}/admin/cycles`,
          icon: Calendar,
        },
        {
          name: "Student Roster",
          href: `/${tenantSlug}/admin/cohort`,
          icon: Users,
        },
      ],
    },
    {
      title: "Placements & Agencies",
      items: [
        {
          name: "Partner Agencies & Slots",
          href: `/${tenantSlug}/admin/agencies`,
          icon: Building2,
        },
        {
          name: "Matching Workspace",
          href: `/${tenantSlug}/admin/matching`,
          icon: Shuffle,
        },
        {
          name: "Postings & Offer Letters",
          href: `/${tenantSlug}/admin/postings`,
          icon: MailCheck,
        },
        {
          name: "Community Care Requests",
          href: `/${tenantSlug}/admin/needs`,
          icon: HeartHandshake,
        },
      ],
    },
    {
      title: "Supervision & Tracking",
      items: [
        {
          name: "Logbook Reviews",
          href: `/${tenantSlug}/admin/logbook`,
          icon: BookOpenCheck,
        },
        {
          name: "Field Visits",
          href: `/${tenantSlug}/admin/visits`,
          icon: Car,
        },
        {
          name: "Student Alerts",
          href: `/${tenantSlug}/admin/alerts`,
          icon: AlertTriangle,
          badge: "1 Alert",
        },
      ],
    },
    {
      title: "Grades & Compliance",
      items: [
        {
          name: "Grades & Evaluations",
          href: `/${tenantSlug}/admin/grading`,
          icon: FileSpreadsheet,
        },
        {
          name: "Transcripts & Reports",
          href: `/${tenantSlug}/admin/reports`,
          icon: GraduationCap,
        },
        {
          name: "Safety & Scope Policies",
          href: `/${tenantSlug}/admin/scope-guard`,
          icon: ShieldAlert,
        },
        {
          name: "Activity History",
          href: `/${tenantSlug}/admin/audit`,
          icon: History,
        },
      ],
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
          "w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800 transition-transform duration-200 ease-in-out z-50",
          "fixed inset-y-0 left-0 md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Institution Branding */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-700/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <h2 className="text-sm font-bold text-white truncate" title={tenantName}>
                  {tenantName}
                </h2>
                <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Coordinator Portal
                </div>
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

          {/* Active Cycle Badge */}
          <div className="mt-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
            <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Active Placement Cycle
            </div>
            <div className="text-slate-200 font-medium truncate mt-0.5">
              2026/27 SWK Practicum II
            </div>
            <div className="text-[10px] text-emerald-400 mt-1">
              400 Required Hours • 2nd Semester
            </div>
          </div>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
          {navigationGroups.map((group, idx) => (
            <div key={idx}>
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={close}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group",
                        isActive
                          ? "bg-emerald-600/15 text-emerald-400 font-semibold"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={cn(
                            "w-4 h-4 transition-colors",
                            isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"
                          )}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>

                      {item.badge ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {item.badge}
                        </span>
                      ) : isActive ? (
                        <ChevronRight className="w-3.5 h-3.5 text-emerald-400/80" />
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Footer / Gateway link */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <Link
            href="/"
            onClick={close}
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span>Back to Main Site</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>
    </>
  );
}
