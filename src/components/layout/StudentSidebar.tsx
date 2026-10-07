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
  ChevronRight,
  GraduationCap,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/layout/SidebarContext";

interface StudentSidebarProps {
  tenantSlug: string;
  studentName?: string;
}

export function StudentSidebar({
  tenantSlug,
  studentName = "Chukwuemeka Eze",
}: StudentSidebarProps) {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();

  const navigationItems = [
    {
      name: "Dashboard",
      href: `/${tenantSlug}/student`,
      icon: LayoutDashboard,
    },
    {
      name: "Placement Details",
      href: `/${tenantSlug}/student/placement`,
      icon: Building2,
    },
    {
      name: "Fieldwork Guide",
      href: `/${tenantSlug}/student/guide`,
      icon: BookOpen,
    },
    {
      name: "Logbook & Hours",
      href: `/${tenantSlug}/student/logbook`,
      icon: BookOpenCheck,
    },
    {
      name: "Skills & Progress",
      href: `/${tenantSlug}/student/dna`,
      icon: Layers,
    },
    {
      name: "Verified Portfolio",
      href: `/${tenantSlug}/student/passport`,
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
          "w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800 transition-transform duration-200 ease-in-out z-50",
          "fixed inset-y-0 left-0 md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Student Profile Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-700/30">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <h2 className="text-sm font-bold text-white truncate">
                  {studentName}
                </h2>
                <div className="text-[11px] text-emerald-400 font-medium">
                  Student Trainee
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

          {/* Placement Status Chip */}
          <div className="mt-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Current Placement
            </div>
            <div className="text-slate-200 font-semibold truncate mt-0.5">
              Lagos State Social Dev
            </div>
            <div className="text-[10px] text-emerald-400 mt-1 font-medium">
              2026/27 Field Practicum II
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Student Workspace
          </div>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group",
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

        {/* Footer Quick Return */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <Link
            href={`/${tenantSlug}/admin`}
            onClick={close}
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span>Coordinator View</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>
    </>
  );
}
