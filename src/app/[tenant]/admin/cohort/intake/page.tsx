import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
const textLink = "font-semibold text-emerald-800 underline underline-offset-4 hover:text-emerald-950";

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
      <header className="space-y-2 border-b border-slate-200 pb-5">
        <Link className={`text-sm ${textLink}`} href="/rsu/admin/cohort">Student roster</Link>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Review student registrations</h1>
        <p className="text-sm text-slate-600">
          Check each Google Form submission against university records before adding a student to a cycle.
        </p>
      </header>

      {!cycles.length && (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <p>Registrations can be reviewed now. Set up an RSU practicum cycle before enrolling students.</p>
          <Link className={textLink} href="/rsu/admin/cycles">Open placement cycles</Link>
        </div>
      )}

      <section aria-labelledby="pending-heading" className="space-y-3">
        <h2 id="pending-heading" className="text-lg font-semibold">Awaiting review ({total})</h2>
        {responses.length ? (
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {responses.map((response) => (
              <li key={response.id} className="flex flex-wrap items-start justify-between gap-4 p-4 sm:p-5">
                <div className="min-w-0 space-y-1">
                  <h3 className="font-semibold">{response.firstName} {response.lastName}</h3>
                  <p className="break-all text-sm text-slate-700">{response.email}</p>
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
        ) : <p className="text-sm text-slate-600">No registrations are waiting for review.</p>}

        {lastPage > 1 && (
          <nav aria-label="Registration pages" className="flex flex-wrap items-center gap-4 text-sm">
            {page > 1 && <Link className={textLink} href={`${rsuStudentIntakePath}?page=${page - 1}`}>Previous</Link>}
            <span className="text-slate-600">Page {page} of {lastPage}</span>
            {page < lastPage && <Link className={textLink} href={`${rsuStudentIntakePath}?page=${page + 1}`}>Next</Link>}
          </nav>
        )}
      </section>
    </div>
  );
}
