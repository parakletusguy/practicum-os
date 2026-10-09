import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AuthenticationError, AuthorizationError, requireAuthenticatedActor } from "@/lib/authz";
import { isDemoMode } from "@/lib/runtime-mode";

export async function GET(request: NextRequest) {
  try {
    const tenantSlug = request.nextUrl.searchParams.get("tenant");
    if (!tenantSlug) {
      return NextResponse.json({ error: "Tenant is required." }, { status: 400 });
    }

    const tenant = await prisma.organisation.findUnique({
      where: { slug: tenantSlug },
      select: { id: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
    }

    let actorId: string | null = null;
    let canViewAllTenantAlerts = false;

    if (!isDemoMode()) {
      const actor = await requireAuthenticatedActor();
      actorId = actor.id;
      const membership = await prisma.orgMembership.findFirst({
        where: {
          personId: actor.id,
          organisationId: tenant.id,
          status: "ACTIVE",
          role: { in: ["COORDINATOR", "INSTITUTION_ADMIN"] },
        },
        select: { id: true },
      });
      canViewAllTenantAlerts = Boolean(membership);
    }

    const accessFilter = canViewAllTenantAlerts || !actorId
      ? {}
      : {
          OR: [
            { studentPersonId: actorId },
            { fieldSupervisorId: actorId },
            { academicSupervisorId: actorId },
          ],
        };

    const where = {
      allocation: {
        cycle: { tenantId: tenant.id },
        ...accessFilter,
      },
    };

    const [alerts, activeCount] = await prisma.$transaction([
      prisma.earlyWarningAlert.findMany({
        where,
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          allocation: {
            include: {
              cohortStudent: { include: { person: true } },
              hostOrg: true,
            },
          },
        },
      }),
      prisma.earlyWarningAlert.count({ where: { ...where, isResolved: false } }),
    ]);

    return NextResponse.json({
      success: true,
      activeCount,
      alerts: alerts.map((alert) => ({
        id: alert.id,
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        alertType: alert.alertType,
        isResolved: alert.isResolved,
        createdAt: alert.createdAt,
        studentName: alert.allocation?.cohortStudent?.person
          ? `${alert.allocation.cohortStudent.person.firstName} ${alert.allocation.cohortStudent.person.lastName}`
          : "Trainee",
        agencyName: alert.allocation?.hostOrg?.name || "Placement agency",
      })),
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Notifications API error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications." }, { status: 500 });
  }
}
