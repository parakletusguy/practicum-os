import Link from "next/link";
import { ArrowRight, Building2, ClipboardCheck, Users } from "lucide-react";
import { PublicNavbar } from "@/components/layout/Navbar";
import { actionStyle } from "@/components/ui/action-styles";

export const metadata = { title: "Rivers State University Social Work · PracticumOS" };

export default function RsuPilotPage() {
  return (
    <>
      <PublicNavbar />
      <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:py-20">
        <section className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid-cols-[1.6fr_1fr]">
          <div className="space-y-5 p-6 sm:p-10">
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <Building2 aria-hidden="true" className="size-5" />
              Rivers State University
            </p>
            <h1 className="max-w-md text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">Social Work staff pilot</h1>
            <p className="max-w-md text-sm leading-6 text-slate-700 sm:text-base">Sign in with the address registered by the practicum office. PracticumOS will send you a one-time code by email.</p>
            <Link href="/auth/login?institution=rsu" className={actionStyle()}>
              Sign in to the RSU pilot <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <aside className="space-y-4 border-t border-emerald-100 bg-emerald-50/75 p-6 md:border-l md:border-t-0 md:p-8">
            <h2 className="text-base font-semibold text-slate-900">What staff can do</h2>
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-3"><Users aria-hidden="true" className="size-5 shrink-0 text-emerald-800" /> Check workspace access and staff roles</li>
              <li className="flex items-start gap-3"><ClipboardCheck aria-hidden="true" className="size-5 shrink-0 text-emerald-800" /> Review submitted student registrations</li>
            </ul>
          </aside>
        </section>
      </main>
    </>
  );
}
