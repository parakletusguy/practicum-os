import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, ClipboardList, Inbox } from "lucide-react";
import { notFound } from "next/navigation";
import { actionStyle } from "@/components/ui/action-styles";
import { db } from "@/lib/db";
import { requirePortalAccess } from "@/lib/portal-access";
import { isDemoMode } from "@/lib/runtime-mode";
import { cohortEnrollmentStatuses, rsuStudentIntakePath } from "@/modules/practicum-core/student-intake";
import { IntakeReviewForm } from "./review-form";

export const metadata: Metadata = { title: "Review student registrations · PracticumOS" };
export const dynamic = "force-dynamic";

const pageSize = 25;
const dateFormat = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos",
});

export default async function StudentIntakePage({ params, searchParams }: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ tenant: slug }, query] = await Promise.all([params, searchParams]);
  if (slug !== "rsu" || isDemoMode()) notFound();
  const { tenant } = await requirePortalAccess(slug, "admin");
  const pending = { tenantId: tenant.id, status: "PENDING" } as const;
  const [cycles, total] = await Promise.all([
    db.practicumCycle.findMany({
      where: { tenantId: tenant.id, status: { in: [...cohortEnrollmentStatuses] } },
      select: { id: true, name: true },
      orderBy: [{ startDate: "desc" }, { id: "asc" }],
    }),
    db.studentIntakeResponse.count({ where: pending }),
  ]);
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const requestedPage = Number(query.page);
  const page = Number.isSafeInteger(requestedPage) ? Math.min(lastPage, Math.max(1, requestedPage)) : 1;
  const responses = total ? await db.studentIntakeResponse.findMany({
    where: pending,
    orderBy: [{ submittedAt: "asc" }, { id: "asc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: { id: true, firstName: true, lastName: true, email: true, matricNumber: true, submittedAt: true, level: true },
  }) : [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Review student registrations</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Check each Google Form submission against university records before adding a student to a cycle.
          </p>
        </div>
        <Link className={actionStyle("secondary")} href="/rsu/admin/cohort">
          <ArrowLeft aria-hidden="true" className="size-4" /> Student roster
        </Link>
      </header>

      {!cycles.length && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 text-sm sm:p-5">
          <div className="flex items-start gap-3">
            <CalendarDays aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-emerald-700" />
            <div>
              <p className="font-semibold text-slate-900">A practicum cycle is needed for enrollment</p>
              <p className="mt-1 text-slate-600">You can review registrations now and enroll students once a cycle is set up.</p>
            </div>
          </div>
          <Link className={actionStyle("secondary")} href="/rsu/admin/cycles">Open placement cycles <ArrowRight aria-hidden="true" className="size-4" /></Link>
        </div>
      )}

      <section aria-labelledby="pending-heading" className="space-y-3">
        <h2 id="pending-heading" className="flex items-center gap-2 text-lg font-semibold">
          <ClipboardList aria-hidden="true" className="size-5 text-emerald-700" /> Awaiting review ({total})
        </h2>
        {responses.length ? (
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {responses.map((response) => (
              <li key={response.id} className="flex flex-col items-start justify-between gap-4 p-4 sm:flex-row sm:p-5">
                <div className="min-w-0 space-y-1">
                  <h3 className="font-semibold">{response.firstName} {response.lastName}</h3>
                  <p className="wrap-anywhere text-sm text-slate-700">{response.email}</p>
                  <p className="text-sm text-slate-700">Matriculation number {response.matricNumber}</p>
                  <p className="text-sm text-slate-700">{response.level ? `Level ${response.level.slice(0, -1)}` : "Level not supplied"}</p>
                  <time className="block text-sm text-slate-600" dateTime={response.submittedAt.toISOString()}>
                    {dateFormat.format(response.submittedAt)}
                  </time>
                </div>
                <IntakeReviewForm responseId={response.id} cycles={cycles} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            <Inbox aria-hidden="true" className="size-5 shrink-0 text-emerald-700" />
            <p>No registrations are waiting for review.</p>
          </div>
        )}

        {lastPage > 1 && (
          <nav aria-label="Registration pages" className="flex flex-wrap items-center gap-4 text-sm">
            {page > 1 && <Link className={actionStyle("secondary")} href={`${rsuStudentIntakePath}?page=${page - 1}`}><ArrowLeft aria-hidden="true" className="size-4" /> Previous</Link>}
            <span className="text-slate-600">Page {page} of {lastPage}</span>
            {page < lastPage && <Link className={actionStyle("secondary")} href={`${rsuStudentIntakePath}?page=${page + 1}`}>Next <ArrowRight aria-hidden="true" className="size-4" /></Link>}
          </nav>
        )}
      </section>
    </div>
  );
}
