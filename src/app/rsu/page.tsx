import Link from "next/link";
import { Building2 } from "lucide-react";
import { PublicNavbar } from "@/components/layout/Navbar";

export const metadata = { title: "Rivers State University Social Work · PracticumOS" };

export default function RsuPilotPage() {
  return (
    <>
      <PublicNavbar />
      <main className="mx-auto w-full max-w-4xl px-5 py-14 sm:py-24">
        <section className="space-y-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-6 sm:p-12">
          <Building2 aria-hidden="true" className="h-9 w-9 text-emerald-800" />
          <p className="text-sm font-semibold text-emerald-800">Department of Social Work · Field education pilot</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-5xl">Rivers State University</h1>
          <p className="max-w-xl text-slate-700">Sign in with the email your practicum office registered to access your student, supervisor, or coordinator workspace.</p>
          <Link href="/auth/login?institution=rsu" className="inline-flex rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800">Sign in to the RSU pilot</Link>
        </section>
      </main>
    </>
  );
}
