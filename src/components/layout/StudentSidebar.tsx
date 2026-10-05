"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Building2, 
  BookOpenCheck, 
  BookOpen, 
  Layers, 
  Award, 
  ShieldCheck, 
  ChevronRight,
  FileCheck2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentSidebarProps {
  tenantSlug: string;
  studentName?: string;
}

export function StudentSidebar({
  tenantSlug,
  studentName = "Chukwuemeka Eze",
}: StudentSidebarProps) {
  const pathname = usePathname();

  const navigationItems = [
    {
      name: "Dashboard",
      href: `/${tenantSlug}/student`,
      icon: LayoutDashboard,
    },
    {
      name: "My Placement Profile",
      href: `/${tenantSlug}/student/placement`,
      icon: Building2,
    },
    {
      name: "E-Practicum Guide",
      href: `/${tenantSlug}/student/guide`,
      icon: BookOpen,
    },
    {
      name: "E-Logbook & Events",
      href: `/${tenantSlug}/student/logbook`,
      icon: BookOpenCheck,
    },
    {
      name: "Practice DNA",
      href: `/${tenantSlug}/student/dna`,
      icon: Layers,
    },
    {
      name: "Practice Passport",
      href: `/${tenantSlug}/student/passport`,
      icon: Award,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800">
      {/* Student Profile Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-700/30">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <h2 className="text-sm font-bold text-white truncate">
              {studentName}
            </h2>
            <div className="text-[11px] text-emerald-400 font-medium">
              Student / Trainee
            </div>
          </div>
        </div>

        {/* Practicum Status Chip */}
        <div className="mt-3 p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Placement Active
          </div>
          <div className="text-slate-200 font-semibold truncate mt-0.5">
            Lagos State Social Dev
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 font-medium">
            2026/27 Field Practicum II
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
        <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Practice Workspace
        </div>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group",
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
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-400/80" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer Return */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <Link
          href={`/${tenantSlug}/admin`}
          className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span>Switch to Admin Portal</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </aside>
  );
}

function GraduationCap(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
      <path d="M22 10v6" />
      <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
    </svg>
  );
}
