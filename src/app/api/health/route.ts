import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  let dbStatus = "healthy";
  let dbLatencyMs = 0;
  let dbError: string | null = null;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch (error: any) {
    dbStatus = "unreachable";
    dbError = error.message;
  }

  const memory = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());

  const isHealthy = dbStatus === "healthy";

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      service: "PracticumOS Core Platform",
      environment: process.env.NODE_ENV || "production",
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - start,
      database: {
        provider: "PostgreSQL 17 (Supabase)",
        status: dbStatus,
        latencyMs: dbLatencyMs,
        error: dbError,
      },
      system: {
        uptimeSeconds,
        nodeVersion: process.version,
        memoryUsageMB: {
          rss: Math.round(memory.rss / (1024 * 1024)),
          heapTotal: Math.round(memory.heapTotal / (1024 * 1024)),
          heapUsed: Math.round(memory.heapUsed / (1024 * 1024)),
        },
      },
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    }
  );
}
