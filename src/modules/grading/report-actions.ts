"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePortalAccess } from "@/lib/portal-access";
import { db } from "@/lib/db";
import { sanitizeTextForPII } from "@/modules/needs-matching/types";
import { reportStages, currentPracticeReports } from "./practice-report";
import { hasAuthorizedGradeCorrection } from "./transcript";
import { assemblePortfolioEvidence } from "./portfolio-evidence";

const content = z.string().trim().min(20).max(12000);
const selectedIds = z.array(z.string().min(1).max(100)).max(500);
const reportInput = z.discriminatedUnion("role", [
  z.object({ role: z.literal("student"), stage: z.enum(reportStages), body: content }),
  z.object({ role: z.literal("faculty"), submissionId: z.string().min(1), score: z.string().trim().min(1).pipe(z.coerce.number().min(0).max(100)), feedback: content }),
]);

export async function savePracticeReportAction(tenantSlug: string, allocationId: string, form: FormData) {
  const input = reportInput.safeParse(Object.fromEntries(form));
  if (!input.success) return { success: false, message: "Enter at least 20 characters and a score between 0 and 100 when reviewing." };
  const data = input.data;
  const selections = data.role === "student" && data.stage === "FINAL"
    ? z.object({ entryIds: selectedIds, attachmentIds: selectedIds }).safeParse({
      entryIds: form.getAll("entryId"), attachmentIds: form.getAll("attachmentId"),
    }) : null;
  if (selections && !selections.success) return { success: false, message: "Select up to 500 logbook entries and their attachments." };
  const { actor, tenant } = await requirePortalAccess(tenantSlug, data.role);
  const text = data.role === "student" ? data.body : data.feedback;
  if (sanitizeTextForPII(text).redactedCount) return { success: false, message: "Remove personal contact or identification details before saving." };

  try {
    await db.$transaction(async (tx) => {
      const allocation = await tx.placementAllocation.findFirst({
        where: {
          id: allocationId,
          status: { in: ["ACTIVE", "COMPLETED"] },
          cycle: { tenantId: tenant.id, status: { in: ["ACTIVE", "ASSESSMENT", "GRADING"] } },
          ...(data.role === "student" ? { studentPersonId: actor.id } : { academicSupervisorId: actor.id }),
        },
        select: { id: true, cycleId: true, cycle: { select: { status: true } }, cohortStudent: { select: { grade: { select: { id: true, isApproved: true } } } } },
      });
      if (!allocation || allocation.cohortStudent.grade?.isApproved) throw new Error("This assignment is unavailable for submission or review.");
      const correcting = allocation.cycle.status === "GRADING" && await hasAuthorizedGradeCorrection(allocation.cohortStudent.grade, tx);
      if (allocation.cycle.status === "GRADING" && !correcting) throw new Error("Submissions are closed during grading.");

      if (data.role === "student") {
        if (data.stage === "FINAL" && allocation.cycle.status !== "ASSESSMENT" && !correcting) throw new Error("Final portfolios open during assessment.");
        const selection = selections?.success ? selections.data : null;
        const evidence = selection ? assemblePortfolioEvidence(
          selection.entryIds, selection.attachmentIds,
          selection.entryIds.length ? await tx.practiceEvent.findMany({
            where: { id: { in: selection.entryIds }, allocationId: allocation.id, verificationStatus: "VERIFIED" },
            select: {
              id: true, allocationId: true, activityTitle: true, eventDate: true,
              verifiedMinutes: true, evidenceSanitized: true, evidenceUrl: true,
            },
          }) : [],
        ) : [];
        await tx.assessmentSubmission.create({ data: {
          cycleId: allocation.cycleId, allocationId: allocation.id, evaluatorPersonId: actor.id,
          evaluatorType: "STUDENT_SELF", stage: data.stage, totalScore: 0,
          rubricPayload: { kind: "PRACTICE_REPORT", body: data.body, ...(selection ? { evidence } : {}) },
        } });
        return;
      }

      const submissions = await tx.assessmentSubmission.findMany({
        where: { allocationId: allocation.id },
        orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
      });
      const report = currentPracticeReports(submissions).find(({ submission }) => submission?.id === data.submissionId);
      if (!report?.submission) throw new Error("The student has submitted a newer version. Refresh to review it.");
      await tx.assessmentSubmission.create({ data: {
        cycleId: allocation.cycleId, allocationId: allocation.id, evaluatorPersonId: actor.id,
        evaluatorType: "ACADEMIC_SUPERVISOR", stage: report.stage, totalScore: data.score, maxScore: 100,
        rubricPayload: { kind: "PRACTICE_REPORT_REVIEW", submissionId: report.submission.id },
        qualitativeRemarks: data.feedback,
      } });
    }, { isolationLevel: "Serializable" });
    revalidatePath(`/${tenant.slug}`, "layout");
    return { success: true, message: data.role === "student" ? "Submission saved for faculty review." : "Score and feedback saved." };
  } catch (error) {
    return { success: false, message: error instanceof Error && !("code" in error) ? error.message : "The submission could not be saved. Refresh and try again." };
  }
}
