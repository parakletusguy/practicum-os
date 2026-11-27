import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePortalAccess } from "@/lib/portal-access";
import { currentPracticeReports, reportLabels, reportPayload } from "@/modules/grading/practice-report";
import { hasAuthorizedGradeCorrection } from "@/modules/grading/transcript";
import { isApprovedAttachment, readPortfolioEvidence } from "@/modules/grading/portfolio-evidence";
import { ReportForm } from "./report-form";

export async function ReportPage({ tenantSlug, allocationId, role }: {
  tenantSlug: string; allocationId: string; role: "student" | "faculty";
}) {
  const { actor, tenant } = await requirePortalAccess(tenantSlug, role);
  const allocation = await db.placementAllocation.findFirst({
    where: {
      id: allocationId, cycle: { tenantId: tenant.id },
      ...(role === "student" ? { studentPersonId: actor.id } : { academicSupervisorId: actor.id }),
    },
    select: {
      status: true,
      cycle: { select: { status: true } },
      cohortStudent: { select: { grade: { select: { id: true, isApproved: true } } } },
      studentPerson: { select: { firstName: true, lastName: true } },
      assessments: {
        where: { evaluatorType: { in: ["STUDENT_SELF", "ACADEMIC_SUPERVISOR"] } },
        orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
      },
    },
  });
  if (!allocation) notFound();
  const correcting = allocation.cycle.status === "GRADING" && await hasAuthorizedGradeCorrection(allocation.cohortStudent.grade);
  const editable = (correcting || ["ACTIVE", "ASSESSMENT"].includes(allocation.cycle.status)) &&
    ["ACTIVE", "COMPLETED"].includes(allocation.status) && !allocation.cohortStudent.grade?.isApproved;
  const evidenceOptions = role === "student" && editable && (correcting || allocation.cycle.status === "ASSESSMENT")
    ? (await db.practiceEvent.findMany({
      where: { allocationId, verificationStatus: "VERIFIED" },
      orderBy: [{ eventDate: "desc" }, { id: "desc" }],
      select: { id: true, allocationId: true, activityTitle: true, eventDate: true, verifiedMinutes: true, evidenceSanitized: true, evidenceUrl: true },
    })).map((entry) => ({
      id: entry.id, title: entry.activityTitle, date: entry.eventDate.toISOString().slice(0, 10),
      minutes: entry.verifiedMinutes, attachment: isApprovedAttachment(entry),
    })) : [];
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold">Reflection and final portfolio</h1>
      <p>{allocation.studentPerson.firstName} {allocation.studentPerson.lastName}</p>
      {currentPracticeReports(allocation.assessments).map(({ stage, submission, review }) => {
        const payload = submission ? reportPayload(submission.rubricPayload) : null;
        const evidence = readPortfolioEvidence(payload?.evidence);
        const body = typeof payload?.body === "string" ? payload.body : undefined;
        return (
        <section key={stage} className="space-y-3 rounded-xl border bg-white p-5">
          <h2 className="text-lg font-semibold">{reportLabels[stage]}</h2>
          {submission ? <p className="whitespace-pre-wrap text-sm">{body}</p> : <p className="text-sm">Awaiting submission.</p>}
          {evidence.length > 0 && <ul className="list-disc space-y-1 pl-5 text-sm">
            {evidence.map(({ id, title, date, minutes, includeAttachment }) => <li key={id}>
              {title} · {date} · {minutes} min {includeAttachment && <a href={`/api/evidence/${id}`} className="ml-1 text-emerald-800 underline">Download attachment</a>}
            </li>)}
          </ul>}
          {review && <p className="whitespace-pre-wrap text-sm"><strong>Score {review.totalScore.toFixed(1)}%</strong><br />{review.qualitativeRemarks}</p>}
          {role === "student" && editable && (stage === "PERIODIC" || correcting || allocation.cycle.status === "ASSESSMENT") &&
            <ReportForm key={submission?.id ?? stage} tenantSlug={tenantSlug} allocationId={allocationId} stage={stage}
              initialBody={body} selectedEvidence={evidence} evidenceOptions={stage === "FINAL" ? evidenceOptions : []} />}
          {role === "faculty" && editable && submission &&
            <ReportForm key={submission.id} tenantSlug={tenantSlug} allocationId={allocationId} stage={stage} submissionId={submission.id} />}
        </section>
        );
      })}
    </div>
  );
}
