"use client";

import Link from "next/link";
import { 
  GraduationCap, 
  HeartHandshake, 
  UserCheck, 
  Building2, 
  ShieldCheck, 
  ArrowRight,
  Sparkles
} from "lucide-react";

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Practicum<span className="text-emerald-600">OS</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-500 border-l border-slate-200 pl-2">
              Practice, Care & Social Welfare
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/gateways/help"
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            I Need Help
          </Link>

          <Link
            href="/gateways/provider"
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5" />
            I Can Help
          </Link>

          <Link
            href="/gateways/matching"
            className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Care Matcher
          </Link>

          <Link
            href="/unilag/admin"
            className="inline-flex items-center justify-center rounded-lg text-xs sm:text-sm font-semibold transition-colors bg-emerald-600 text-white hover:bg-emerald-700 h-9 px-3 sm:px-4 py-2 shadow-sm"
          >
            Institutional Portal
            <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
