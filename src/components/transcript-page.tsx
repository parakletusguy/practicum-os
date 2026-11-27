import { notFound } from "next/navigation";
import { PrintButton } from "@/components/ui/print-button";
import { db } from "@/lib/db";
import { requirePortalAccess } from "@/lib/portal-access";
import { transcriptRecord, transcriptSeal } from "@/modules/grading/transcript";
import { TranscriptCorrectionForm } from "./transcript-correction-form";

export async function TranscriptPage({ tenantSlug, reference, role }: {
  tenantSlug: string; reference: string; role: "student" | "admin";
}) {
  const { actor, tenant } = await requirePortalAccess(tenantSlug, role);
  const issued = await db.auditLog.findUnique({
    where: { id: reference, tenantId: tenant.id, actionType: "TRANSCRIPT_ISSUED", resourceType: "CohortGrade" },
    select: { resourceId: true, afterState: true },
  });
  if (!issued) notFound();
  const grade = await db.cohortGrade.findUnique({
    where: {
      id: issued.resourceId,
      cycle: { tenantId: tenant.id },
      ...(role === "student" ? { cohortStudent: { personId: actor.id } } : {}),
    },
    select: { id: true, isApproved: true, compositeScore: true, letterGrade: true, cycle: { select: { status: true } } },
  });
  if (!grade) notFound();
  const record = transcriptRecord.safeParse(issued.afterState);
  const latest = await db.auditLog.findFirst({
    where: { actionType: "TRANSCRIPT_ISSUED", resourceType: "CohortGrade", resourceId: grade.id, tenantId: tenant.id },
    select: { id: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  if (!record.success || transcriptSeal(reference, record.data.snapshot) !== record.data.seal) {
    return <p role="alert">This transcript could not be verified. Contact the practicum office.</p>;
  }
  const { snapshot, seal } = record.data;
  const current = grade.isApproved && grade.compositeScore === snapshot.compositeScore &&
    grade.letterGrade === snapshot.letterGrade && latest?.id === reference;
  const canReviewCorrection = role === "admin" && current && grade.cycle.status === "GRADING";
  const correction = canReviewCorrection ? await db.auditLog.findFirst({
    where: {
      tenantId: tenant.id, resourceType: "CohortGrade", resourceId: grade.id,
      actionType: "TRANSCRIPT_CORRECTION_REQUESTED", afterState: { path: ["reference"], equals: reference },
    },
    select: { afterState: true },
  }) : null;
  const correctionData = correction?.afterState;
  const reason = correctionData && typeof correctionData === "object" && !Array.isArray(correctionData)
    && typeof correctionData.reason === "string" ? correctionData.reason : null;
  return (
    <div className="mx-auto max-w-3xl space-y-5 rounded-xl border bg-white p-6">
      <div className="flex justify-between"><h1 className="text-2xl font-bold">Practicum transcript</h1><PrintButton /></div>
      <p className="font-semibold">{current ? "Verified and current" : latest?.id !== reference ? "Superseded" : "Under review"}</p>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div><dt className="text-sm">Institution</dt><dd>{snapshot.institution}</dd></div>
        <div><dt className="text-sm">Cycle</dt><dd>{snapshot.cycle} · {snapshot.academicYear}</dd></div>
        <div><dt className="text-sm">Student</dt><dd>{snapshot.studentName}</dd></div>
        <div><dt className="text-sm">Matriculation number</dt><dd>{snapshot.matricNumber}</dd></div>
        <div><dt className="text-sm">Official result</dt><dd>{snapshot.letterGrade} · {snapshot.compositeScore}%</dd></div>
        <div><dt className="text-sm">Issued</dt><dd>{snapshot.issuedAt.slice(0, 10)}</dd></div>
      </dl>
      <p className="break-all font-mono text-xs">Reference {reference}</p>
      <p className="break-all font-mono text-xs">Seal {seal}</p>
      {canReviewCorrection && (
        <div className="print:hidden">
          {reason && <p className="whitespace-pre-wrap text-sm">Pending correction request · {reason}</p>}
          <TranscriptCorrectionForm tenantSlug={tenantSlug} reference={reference} />
        </div>
      )}
    </div>
  );
}
