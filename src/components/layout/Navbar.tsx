import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PracticumLogo } from "@/components/layout/PracticumLogo";
import { actionStyle } from "@/components/ui/action-styles";

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <Link href="/" className="rounded-lg text-slate-900">
          <PracticumLogo />
        </Link>
        <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-3 text-sm font-semibold">
          <Link href="/gateways/help" className="text-slate-600 hover:text-slate-900">Community services</Link>
          <Link href="/rsu" className="text-slate-600 hover:text-slate-900">RSU pilot</Link>
          <Link href="/auth/login" className={actionStyle()}>
            Sign in <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
