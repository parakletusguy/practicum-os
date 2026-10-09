import { prisma } from "@/lib/db";

export type EarlyWarningScanResult = {
  success: true;
  alertsGenerated: number;
  activePlacements: number;
};

/**
 * Runs the deterministic early-warning rules for one tenant-scoped cycle.
 * Authorization belongs to the caller: this helper is used by both a guarded
 * server action and the CRON_SECRET-protected scheduler route.
 */
export async function scanEarlyWarningsForCycle(
  cycleId: string,
  tenantSlug: string,
): Promise<EarlyWarningScanResult | { success: false; error: string }> {
  const cycle = await prisma.practicumCycle.findFirst({
    where: { id: cycleId, tenant: { slug: tenantSlug } },
    include: {
      allocations: {
        where: { status: "ACTIVE" },
        include: {
          cohortStudent: { include: { person: true } },
          practiceEvents: true,
          supervisionVisits: true,
          earlyWarningAlerts: { where: { isResolved: false } },
        },
      },
    },
  });

  if (!cycle) {
    return { success: false, error: "Cycle not found." };
  }

  let alertsGenerated = 0;
  const now = new Date();
  const cycleStart = new Date(cycle.startDate);
  const cycleEnd = new Date(cycle.endDate);
  const totalCycleDays = Math.max(1, (cycleEnd.getTime() - cycleStart.getTime()) / 86_400_000);
  const elapsedDays = Math.max(0, Math.min(totalCycleDays, (now.getTime() - cycleStart.getTime()) / 86_400_000));
  const expectedHoursProportion = (elapsedDays / totalCycleDays) * cycle.requiredHours;

  for (const allocation of cycle.allocations) {
    const studentName = `${allocation.cohortStudent.person.firstName} ${allocation.cohortStudent.person.lastName}`;
    const verifiedHours = allocation.practiceEvents
      .filter((event) => event.verificationStatus === "VERIFIED")
      .reduce((sum, event) => sum + event.verifiedMinutes, 0) / 60;

    const hasOpenAlert = (type: "HOURS_BEHIND_SCHEDULE" | "OVERDUE_LOGBOOK_ENTRY" | "MISSED_SUPERVISION_VISIT") =>
      allocation.earlyWarningAlerts.some((alert) => alert.alertType === type);

    if (elapsedDays > 14 && expectedHoursProportion > 20) {
      const hoursDeficit = expectedHoursProportion - verifiedHours;
      if (hoursDeficit > 30 && !hasOpenAlert("HOURS_BEHIND_SCHEDULE")) {
        const created = await prisma.earlyWarningAlert.createMany({
          data: [{
            allocationId: allocation.id,
            alertType: "HOURS_BEHIND_SCHEDULE",
            severity: hoursDeficit > 60 ? "CRITICAL" : "HIGH",
            title: `Hours Deficit: ${studentName} is ${Math.round(hoursDeficit)} hrs behind pace`,
            description: `Student has completed ${verifiedHours.toFixed(1)} verified hours out of an expected ${Math.round(expectedHoursProportion)} hours at this milestone in the practicum cycle.`,
          }],
          skipDuplicates: true,
        });
        alertsGenerated += created.count;
      }
    }

    const sortedEvents = [...allocation.practiceEvents].sort(
      (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime(),
    );
    const lastEventDate = sortedEvents.length > 0 ? new Date(sortedEvents[0].eventDate) : null;
    const daysSinceLastLog = lastEventDate
      ? (now.getTime() - lastEventDate.getTime()) / 86_400_000
      : elapsedDays;

    if (daysSinceLastLog >= 14 && !hasOpenAlert("OVERDUE_LOGBOOK_ENTRY")) {
      const created = await prisma.earlyWarningAlert.createMany({
        data: [{
          allocationId: allocation.id,
          alertType: "OVERDUE_LOGBOOK_ENTRY",
          severity: "MEDIUM",
          title: `Logbook Inactivity: No entries from ${studentName} in ${Math.round(daysSinceLastLog)} days`,
          description: `Trainee has not submitted any practice event since ${lastEventDate ? lastEventDate.toISOString().split("T")[0] : "cycle start"}. Immediate check-in advised.`,
        }],
        skipDuplicates: true,
      });
      alertsGenerated += created.count;
    }

    const progressPercent = (elapsedDays / totalCycleDays) * 100;
    if (progressPercent >= 50 && allocation.supervisionVisits.length === 0 && !hasOpenAlert("MISSED_SUPERVISION_VISIT")) {
      const created = await prisma.earlyWarningAlert.createMany({
        data: [{
          allocationId: allocation.id,
          alertType: "MISSED_SUPERVISION_VISIT",
          severity: "HIGH",
          title: `Supervision Milestone Breach: Zero faculty visits for ${studentName}`,
          description: `Practicum cycle is ${Math.round(progressPercent)}% elapsed, but no academic supervision visits have been documented for this placement.`,
        }],
        skipDuplicates: true,
      });
      alertsGenerated += created.count;
    }
  }

  return { success: true, alertsGenerated, activePlacements: cycle.allocations.length };
}
