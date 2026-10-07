"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  HeartHandshake, 
  UserCheck, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Menu,
  X,
  GraduationCap,
  Building2,
  BookOpen
} from "lucide-react";

export function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Practicum<span className="text-emerald-600">OS</span>
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 hidden sm:block -mt-0.5">
              Fieldwork, Care & Community Placements
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-3">
          <Link
            href="/gateways/help"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg text-rose-700 bg-rose-50/80 hover:bg-rose-100 border border-rose-200/80 transition-colors"
          >
            <HeartHandshake className="w-4 h-4 text-rose-500" />
            Get Support
          </Link>

          <Link
            href="/gateways/provider"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg text-amber-800 bg-amber-50/80 hover:bg-amber-100 border border-amber-200/80 transition-colors"
          >
            <UserCheck className="w-4 h-4 text-amber-600" />
            Volunteer & Help
          </Link>

          <Link
            href="/gateways/matching"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/80 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Care Matcher
          </Link>

          <div className="h-5 w-px bg-slate-200 mx-1" />

          <Link
            href="/unilag/student"
            className="text-xs font-semibold px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Student Portal
          </Link>

          <Link
            href="/unilag/admin"
            className="inline-flex items-center justify-center rounded-xl text-xs font-semibold transition-all bg-emerald-600 text-white hover:bg-emerald-700 h-9 px-4 py-2 shadow-sm shadow-emerald-600/20"
          >
            University Portal
            <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
          </Link>
        </nav>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/unilag/admin"
            className="inline-flex items-center text-xs font-semibold bg-emerald-600 text-white px-3 py-1.5 rounded-lg shadow-sm"
          >
            Portal
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-lg px-4 pt-3 pb-6 space-y-4 shadow-xl animate-in slide-in-from-top duration-200">
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
              Community Services
            </div>
            <Link
              href="/gateways/help"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm font-semibold"
            >
              <div className="flex items-center gap-3">
                <HeartHandshake className="w-5 h-5 text-rose-600" />
                <span>Get Support (Need Help)</span>
              </div>
              <ArrowRight className="w-4 h-4 text-rose-400" />
            </Link>

            <Link
              href="/gateways/provider"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-semibold"
            >
              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-amber-600" />
                <span>Volunteer & Help (Providers)</span>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </Link>

            <Link
              href="/gateways/matching"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-sm font-semibold"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span>Care Matcher Desk</span>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-400" />
            </Link>
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
              University & Field Portals (UNILAG)
            </div>
            <Link
              href="/unilag/student"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              Student / Trainee Portal
            </Link>
            <Link
              href="/unilag/field"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <Building2 className="w-4 h-4 text-teal-600" />
              Field Supervisor Desk
            </Link>
            <Link
              href="/unilag/faculty"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <BookOpen className="w-4 h-4 text-blue-600" />
              Academic Supervisor Desk
            </Link>
            <Link
              href="/unilag/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Practicum Coordinator Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
