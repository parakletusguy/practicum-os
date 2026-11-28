"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
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
  ClipboardCheck,
  HeartHandshake,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/layout/SidebarContext";
import { PracticumLogo } from "@/components/layout/PracticumLogo";

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
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) closeButton.current?.focus();
  }, [isOpen]);

  const closeMenu = () => {
    close();
    document.getElementById("tenant-menu-button")?.focus();
  };

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
        ...(tenantSlug === "rsu" && !demo ? [{
          name: "Review Registrations",
          href: "/rsu/admin/cohort/intake",
          icon: ClipboardCheck,
        }] : []),
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
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      <aside
        id="tenant-admin-navigation"
        onKeyDown={(event) => {
          if (event.key === "Escape" && isOpen) closeMenu();
        }}
        className={cn(
          "w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800 transition-transform duration-200 ease-in-out z-50",
          "fixed inset-y-0 left-0 md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "invisible -translate-x-full md:visible"
        )}
      >
        {/* Institution Branding */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <div className="min-w-0 space-y-2">
              <Link href={`/${tenantSlug}/admin`} onClick={close} className="inline-flex rounded-lg text-white focus-visible:outline-2 focus-visible:outline-emerald-300">
                <PracticumLogo />
              </Link>
              <div className="truncate text-xs font-medium text-slate-300" title={tenantName}>{tenantName}</div>
            </div>

            {/* Mobile Close Button */}
            <button
              ref={closeButton}
              type="button"
              onClick={closeMenu}
              className="grid size-11 shrink-0 place-items-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-300 md:hidden"
              aria-label="Close menu"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>

        </div>

        {/* Navigation Groups */}
        <nav aria-label="Institution navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
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
                        "group flex min-h-11 items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-300",
                        isActive
                          ? "bg-emerald-600/15 text-emerald-400 font-semibold"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          aria-hidden="true"
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
            className="flex min-h-11 items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-300"
          >
            <span>{canOpenPlatform ? "Platform administration" : demo ? "Return home" : "Your workspaces"}</span>
            <ChevronRight aria-hidden="true" className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>
    </>
  );
}
