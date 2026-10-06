import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const alerts = await prisma.earlyWarningAlert.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        allocation: {
          include: {
            cohortStudent: {
              include: {
                person: true,
              },
            },
            hostOrg: true,
          },
        },
      },
    });

    const activeCount = alerts.filter((a) => !a.isResolved).length;

    return NextResponse.json({
      success: true,
      activeCount,
      alerts: alerts.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        severity: a.severity,
        alertType: a.alertType,
        isResolved: a.isResolved,
        createdAt: a.createdAt,
        studentName: a.allocation?.cohortStudent?.person
          ? `${a.allocation.cohortStudent.person.firstName} ${a.allocation.cohortStudent.person.lastName}`
          : "Trainee",
        agencyName: a.allocation?.hostOrg?.name || "Placement Agency",
      })),
    });
  } catch (error: any) {
    console.error("Notifications API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications." },
      { status: 500 }
    );
  }
}
