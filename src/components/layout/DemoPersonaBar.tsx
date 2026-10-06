"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  ShieldAlert, 
  UserCheck, 
  GraduationCap, 
  Stethoscope, 
  BookOpen, 
  KeyRound, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Sparkles,
  LogIn
} from "lucide-react";
import { DEMO_PERSONAS, DemoPersonaKey, DemoPersona } from "@/lib/auth-personas";
import { setActivePersonaAction } from "@/lib/auth-session";

interface DemoPersonaBarProps {
  initialPersonaKey?: DemoPersonaKey;
}

export function DemoPersonaBar({ initialPersonaKey = "admin" }: DemoPersonaBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeKey, setActiveKey] = useState<DemoPersonaKey>(initialPersonaKey);
  const [isPending, startTransition] = useTransition();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Sync state if pathname maps cleanly to a role
  const getCurrentRoleFromPath = (): DemoPersonaKey => {
    if (pathname.includes("/admin")) return "admin";
    if (pathname.includes("/student")) return "student";
    if (pathname.includes("/field")) return "field";
    if (pathname.includes("/faculty")) return "faculty";
    return activeKey;
  };

  const currentActiveKey = getCurrentRoleFromPath();
  const activePersona: DemoPersona = DEMO_PERSONAS[currentActiveKey] || DEMO_PERSONAS.admin;

  const handleSwitch = (key: DemoPersonaKey) => {
    setActiveKey(key);
    startTransition(async () => {
      await setActivePersonaAction(key);
      const targetPath = DEMO_PERSONAS[key].defaultPath;
      router.push(targetPath);
      router.refresh();
    });
  };

  if (isCollapsed) {
    return (
      <aside aria-label="Demo Role Simulator collapsed bar" className="fixed top-2 right-4 z-50">
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg hover:bg-slate-800 border border-slate-700 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Demo Role: {activePersona.roleLabel.split(" ")[0]}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </aside>
    );
  }

  return (
    <aside aria-label="Demo Persona and Authentication Bar" className="bg-slate-950 text-slate-100 border-b border-slate-800 text-xs px-4 py-2 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left Badge: Dual Mode Indicator */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-[11px]">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Dual Auth Active
          </span>
          <span className="text-slate-400 hidden lg:inline text-[11px]">
            Switch personas instantly or sign in:
          </span>
        </div>

        {/* Center: 4 Instant Persona Switcher Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Admin */}
          <button
            onClick={() => handleSwitch("admin")}
            disabled={isPending}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-[11px] transition-all ${
              currentActiveKey === "admin"
                ? "bg-emerald-600 text-white shadow-sm font-bold ring-1 ring-emerald-400"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            <UserCheck className="w-3 h-3 text-emerald-400" />
            <span>Coordinator</span>
            <span className="text-[10px] opacity-75 hidden sm:inline">(Dr. Ogunlesi)</span>
          </button>

          {/* Student */}
          <button
            onClick={() => handleSwitch("student")}
            disabled={isPending}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-[11px] transition-all ${
              currentActiveKey === "student"
                ? "bg-blue-600 text-white shadow-sm font-bold ring-1 ring-blue-400"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            <GraduationCap className="w-3 h-3 text-blue-400" />
            <span>Student</span>
            <span className="text-[10px] opacity-75 hidden sm:inline">(C. Eze)</span>
          </button>

          {/* Field Supervisor */}
          <button
            onClick={() => handleSwitch("field")}
            disabled={isPending}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-[11px] transition-all ${
              currentActiveKey === "field"
                ? "bg-purple-600 text-white shadow-sm font-bold ring-1 ring-purple-400"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            <Stethoscope className="w-3 h-3 text-purple-400" />
            <span>Field Supervisor</span>
            <span className="text-[10px] opacity-75 hidden sm:inline">(Mrs. Okonkwo)</span>
          </button>

          {/* Faculty */}
          <button
            onClick={() => handleSwitch("faculty")}
            disabled={isPending}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-[11px] transition-all ${
              currentActiveKey === "faculty"
                ? "bg-amber-600 text-white shadow-sm font-bold ring-1 ring-amber-400"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            <BookOpen className="w-3 h-3 text-amber-400" />
            <span>Academic Faculty</span>
            <span className="text-[10px] opacity-75 hidden sm:inline">(Dr. Adeleke)</span>
          </button>
        </div>

        {/* Right Controls: Real Login Link & Collapse */}
        <div className="flex items-center gap-3">
          <a
            href="/auth/login"
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-400 font-medium transition-colors"
          >
            <LogIn className="w-3 h-3" />
            <span className="hidden sm:inline">Sign In</span>
          </a>
          <button
            onClick={() => setIsCollapsed(true)}
            title="Minimize Bar"
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
