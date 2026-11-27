import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold text-slate-900">
          <ShieldCheck aria-hidden="true" className="h-6 w-6 text-emerald-700" /> PracticumOS
        </Link>
        <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-3 text-sm font-semibold">
          <Link href="/gateways/help" className="text-slate-600 hover:text-slate-900">Community services</Link>
          <Link href="/rsu" className="text-slate-600 hover:text-slate-900">RSU pilot</Link>
          <Link href="/auth/login" className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-white hover:bg-emerald-800">
            Sign in <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
