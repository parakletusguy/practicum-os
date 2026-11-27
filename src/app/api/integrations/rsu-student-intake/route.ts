import { createHash, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { isDemoMode } from "@/lib/runtime-mode";
import { studentIntakeBatch } from "@/modules/practicum-core/student-intake";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.RSU_INTAKE_SECRET;
  if (isDemoMode() || !secret) return Response.json({ error: "Intake is unavailable." }, { status: 503 });

  const supplied = request.headers.get("authorization");
  const hash = (value: string) => createHash("sha256").update(value).digest();
  if (!supplied || !timingSafeEqual(hash(supplied), hash(`Bearer ${secret}`))) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.text();
  if (Buffer.byteLength(body) > 65536) return Response.json({ error: "Batch too large." }, { status: 413 });
  const batch = studentIntakeBatch.safeParse(parseBatch(body));
  if (!batch.success) return Response.json({ error: "Invalid form or response data." }, { status: 400 });

  try {
    const tenant = await db.organisation.findFirst({
      where: { slug: "rsu", verificationStatus: "VERIFIED" },
      select: { id: true },
    });
    if (!tenant) return Response.json({ error: "RSU intake is unavailable." }, { status: 503 });
    const { responses } = batch.data;
    if (!responses.length) return Response.json({ queued: 0 });
    const result = await db.studentIntakeResponse.createMany({
      data: responses.map(({ id, submittedAt, ...student }) => ({
        ...student, tenantId: tenant.id, sourceId: id, submittedAt: new Date(submittedAt),
      })),
      skipDuplicates: true,
    });
    return Response.json({ queued: result.count });
  } catch {
    return Response.json({ error: "Intake could not save the batch. Retry shortly." }, { status: 503 });
  }
}

function parseBatch(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}
