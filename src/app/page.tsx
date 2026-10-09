import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileCheck2,
  GraduationCap,
  HeartHandshake,
  ShieldCheck,
  Users,
} from "lucide-react";
import { PublicNavbar } from "@/components/layout/Navbar";

const lifecycle = [
  "Set up a practicum cycle and student cohort",
  "Match students with suitable placement agencies",
  "Record practice events for supervisor review",
  "Coordinate supervision, assessments, and outcomes",
];

const portals = [
  {
    title: "Students",
    description: "Record fieldwork, review feedback, and follow placement progress.",
    href: "/unilag/student",
    icon: GraduationCap,
    accent: "text-blue-700 bg-blue-50 border-blue-100",
  },
  {
    title: "Institutions",
    description: "Manage cycles, agencies, matching, and cohort-level results.",
    href: "/unilag/admin",
    icon: Building2,
    accent: "text-emerald-700 bg-emerald-50 border-emerald-100",
  },
  {
    title: "Field supervisors",
    description: "Review practice entries and complete structured evaluations.",
    href: "/unilag/field",
    icon: Users,
    accent: "text-violet-700 bg-violet-50 border-violet-100",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <PublicNavbar />

      <section className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-xs font-medium text-amber-900">
        Preview environment — sample data and demo roles are available while production sign-in is being completed.
      </section>

      <section className="relative overflow-hidden bg-slate-950 px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(#34d399_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Practicum coordination workspace
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Keep field education organised, visible, and accountable.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            PracticumOS brings placement coordination, fieldwork review, supervision, and assessment into one shared workspace.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-300"
            >
              Explore the demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-xl border border-slate-600 px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-slate-800"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">The workflow</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">One clear path from placement to outcome.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The workspace is designed around the essential stages of a supervised practicum, without making promises that depend on future integrations.
          </p>
        </div>

        <ol className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {lifecycle.map((step, index) => (
            <li key={step} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">
                {index + 1}
              </span>
              <p className="mt-4 text-sm font-semibold leading-6 text-slate-800">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-slate-200 bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Role-based workspaces</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">Give each participant a focused next step.</h2>
            </div>
            <Link href="/auth/login" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800">
              Open the demo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {portals.map((portal) => {
              const Icon = portal.icon;
              return (
                <Link
                  key={portal.title}
                  href={portal.href}
                  className="group rounded-2xl border border-slate-200 p-6 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
                >
                  <div className={`inline-flex rounded-xl border p-3 ${portal.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold">{portal.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{portal.description}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                    View workspace <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:px-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">What is available now</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">A practical foundation for supervised placements.</h2>
          <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-700">
            <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />Placement, cohort, and agency management screens</li>
            <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />Structured fieldwork logs and supervisor review</li>
            <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />Assessment, grading, and audit-oriented workflows</li>
          </ul>
        </div>
        <aside className="rounded-2xl bg-slate-900 p-7 text-slate-100">
          <FileCheck2 className="h-7 w-7 text-emerald-300" />
          <h2 className="mt-4 text-xl font-bold">Community care gateway</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Signed-in community members can submit a request for support, and service providers can register their availability for review.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/gateways/help" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100">
              <HeartHandshake className="h-4 w-4" /> Get support
            </Link>
            <Link href="/gateways/provider" className="rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-semibold hover:bg-slate-800">
              Become a provider
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}
