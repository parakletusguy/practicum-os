import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePortalAccess } from "@/lib/portal-access";
import { currentPracticeReports, reportLabels, reportPayload } from "@/modules/grading/practice-report";
import { hasAuthorizedGradeCorrection } from "@/modules/grading/transcript";
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
    ["ACTIVE", "COMPLETED"].includes(allocation.status);
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold">Reflection and final portfolio</h1>
      <p>{allocation.studentPerson.firstName} {allocation.studentPerson.lastName}</p>
      {currentPracticeReports(allocation.assessments).map(({ stage, submission, review }) => (
        <section key={stage} className="space-y-3 rounded-xl border bg-white p-5">
          <h2 className="text-lg font-semibold">{reportLabels[stage]}</h2>
          {submission ? <p className="whitespace-pre-wrap text-sm">{String(reportPayload(submission.rubricPayload).body || "")}</p> : <p className="text-sm">Awaiting submission.</p>}
          {review && <p className="whitespace-pre-wrap text-sm"><strong>Score {review.totalScore.toFixed(1)}%</strong><br />{review.qualitativeRemarks}</p>}
          {role === "student" && editable && (stage === "PERIODIC" || correcting || allocation.cycle.status === "ASSESSMENT") &&
            <ReportForm tenantSlug={tenantSlug} allocationId={allocationId} stage={stage} />}
          {role === "faculty" && editable && submission &&
            <ReportForm key={submission.id} tenantSlug={tenantSlug} allocationId={allocationId} stage={stage} submissionId={submission.id} />}
        </section>
      ))}
    </div>
  );
}
