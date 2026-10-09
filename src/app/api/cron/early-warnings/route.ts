import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { scanEarlyWarningsForCycle } from "@/modules/supervision/early-warning";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorizedCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization");
  if (!secret || !provided) return false;

  const expected = `Bearer ${secret}`;
  if (provided.length !== expected.length) return false;

  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

/**
 * Runs once daily in production via Vercel Cron. The endpoint is intentionally
 * unavailable until CRON_SECRET is configured, and never trusts a tenant id
 * supplied by the caller.
 */
export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    console.error("Early-warning cron is disabled because CRON_SECRET is not configured.");
    return NextResponse.json({ error: "Scheduler is not configured." }, { status: 503 });
  }

  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const cycles = await prisma.practicumCycle.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, tenant: { select: { slug: true } } },
  });

  const results = await Promise.all(
    cycles.map(async (cycle) => {
      try {
        const scan = await scanEarlyWarningsForCycle(cycle.id, cycle.tenant.slug);
        if (!scan.success) {
          return { cycleId: cycle.id, success: false, error: scan.error };
        }

        revalidatePath(`/${cycle.tenant.slug}/faculty`);
        revalidatePath(`/${cycle.tenant.slug}/faculty/alerts`);
        revalidatePath(`/${cycle.tenant.slug}/admin`);
        return { cycleId: cycle.id, success: true, alertsGenerated: scan.alertsGenerated };
      } catch (error) {
        console.error("Early-warning scan failed", { cycleId: cycle.id, error });
        return { cycleId: cycle.id, success: false, error: "Scan failed." };
      }
    }),
  );

  const failures = results.filter((result) => !result.success);
  const alertsGenerated = results.reduce(
    (total, result) => total + (result.alertsGenerated ?? 0),
    0,
  );

  return NextResponse.json(
    {
      scannedCycles: cycles.length,
      alertsGenerated,
      failedCycles: failures.length,
      results,
    },
    { status: failures.length > 0 ? 207 : 200 },
  );
}
