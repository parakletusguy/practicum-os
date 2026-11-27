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
  canManageAccess: boolean;
  canOpenPlatform: boolean;
  demo: boolean;
}

export function TenantSidebar({ tenantSlug, tenantName, canManageAccess, canOpenPlatform, demo }: TenantSidebarProps) {
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
        ...(canManageAccess ? [{
          name: "Institutional Access",
          href: `/${tenantSlug}/admin/access`,
          icon: ShieldCheck,
        }] : []),
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
        ...(canOpenPlatform || demo ? [{
          name: "Community Care Requests",
          href: `/${tenantSlug}/admin/needs`,
          icon: HeartHandshake,
        }] : []),
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
                <div className="text-xs font-medium text-slate-300">Practicum administration</div>
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

        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
          {navigationGroups.map((group, idx) => (
            <div key={idx}>
              <div className="mb-1 px-3 text-xs font-semibold text-slate-400">
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
                      aria-current={isActive ? "page" : undefined}
                      onClick={close}
                      className={cn(
                        "group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
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
            href={canOpenPlatform ? "/platform" : demo ? "/" : "/auth/workspaces"}
            onClick={close}
            className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <span>{canOpenPlatform ? "Platform administration" : demo ? "Return home" : "Your workspaces"}</span>
            <ChevronRight aria-hidden="true" className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>
    </>
  );
}
