import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

  const isHealthy = dbStatus === "healthy";
  const production = process.env.NODE_ENV === "production";
  const response = {
    status: isHealthy ? "healthy" : "degraded",
    service: "PracticumOS Core Platform",
    timestamp: new Date().toISOString(),
    responseTimeMs: Date.now() - start,
    database: production
      ? { status: dbStatus, latencyMs: dbLatencyMs }
      : {
          provider: "PostgreSQL 17 (Supabase)",
          status: dbStatus,
          latencyMs: dbLatencyMs,
          error: dbError,
        },
    ...(!production
      ? {
          system: {
            uptimeSeconds: Math.floor(process.uptime()),
            nodeVersion: process.version,
            memoryUsageMB: {
              rss: Math.round(process.memoryUsage().rss / (1024 * 1024)),
              heapTotal: Math.round(process.memoryUsage().heapTotal / (1024 * 1024)),
              heapUsed: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
            },
          },
        }
      : {}),
  };

  return NextResponse.json(
    response,
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    }
  );
}
