import "server-only";

import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";

export const transcriptSnapshot = z.object({
  studentName: z.string(),
  matricNumber: z.string(),
  institution: z.string(),
  cycle: z.string(),
  academicYear: z.string(),
  compositeScore: z.number(),
  letterGrade: z.string(),
  issuedAt: z.string().datetime(),
});

export type TranscriptSnapshot = z.infer<typeof transcriptSnapshot>;

export function transcriptSeal(reference: string, snapshot: TranscriptSnapshot) {
  return createHash("sha256").update(JSON.stringify([reference, transcriptSnapshot.parse(snapshot)])).digest("hex");
}

export const transcriptRecord = z.object({
  snapshot: transcriptSnapshot,
  seal: z.string().regex(/^[a-f0-9]{64}$/),
});

export async function hasAuthorizedGradeCorrection(
  grade: { id: string; isApproved: boolean } | null | undefined,
  client: Pick<Prisma.TransactionClient, "auditLog"> = db,
) {
  if (!grade || grade.isApproved) return false;
  const latest = await client.auditLog.findFirst({
    where: { resourceType: "CohortGrade", resourceId: grade.id, actionType: "TRANSCRIPT_ISSUED" },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { id: true },
  });
  if (!latest) return false;
  return Boolean(await client.auditLog.findFirst({
    where: {
      resourceType: "CohortGrade", resourceId: grade.id, actionType: "TRANSCRIPT_CORRECTION_AUTHORIZED",
      afterState: { path: ["reference"], equals: latest.id },
    },
    select: { id: true },
  }));
}
