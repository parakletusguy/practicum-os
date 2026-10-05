import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ScorebookClient } from "./scorebook-client";
import { Award, ShieldCheck } from "lucide-react";

export default async function CohortGradingPage({
  params,
}: {
  params: { tenant: string };
}) {
  const tenant = await prisma.organisation.findUnique({
    where: { slug: params.tenant },
  });

  if (!tenant) {
    notFound();
  }

  // Get active practicum cycle
  const cycle = await prisma.practicumCycle.findFirst({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    include: {
      students: {
        include: {
          person: true,
          allocation: {
            include: {
              hostOrg: true,
              practiceEvents: true,
              assessments: true,
              supervisionVisits: true,
            },
          },
          grade: true,
        },
      },
    },
  });

  if (!cycle) {
    notFound();
  }

  // Find coordinator / admin person
  const coordinator = await prisma.person.findFirst({
    where: {
      roleMemberships: {
        some: {
          role: "COORDINATOR",
        },
      },
    },
  });

  const gradeRows = cycle.students.map((student) => {
    const alloc = student.allocation;
    const grade = student.grade;

    const logHoursScore = grade?.logbookHoursScore ?? 0;
    const fieldScore = grade?.fieldEvalScore ?? 75;
    const academicScore = grade?.academicEvalScore ?? 75;
    const reportsScore = grade?.reportsScore ?? 80;
    const composite = grade?.compositeScore ?? 75;
    const letter = grade?.letterGrade ?? "A";

    return {
      studentId: student.id,
      gradeId: grade?.id,
      matricNumber: student.matricNumber,
      studentName: `${student.person.firstName} ${student.person.lastName}`,
      agencyName: alloc?.hostOrg.name || "Unassigned",
      logbookHoursScore: logHoursScore,
      fieldEvalScore: fieldScore,
      academicEvalScore: academicScore,
      reportsScore: reportsScore,
      compositeScore: composite,
      letterGrade: letter,
      isApproved: grade?.isApproved ?? false,
      approvedAt: grade?.approvedAt,
      moderationRemarks: grade?.moderationRemarks,
    };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
          <Award className="w-4 h-4 text-emerald-600" />
          Examination & Academic Records Desk
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Cohort Scorebook, Assessment Rubrics & Dynamic Grading
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Evaluate field and academic supervisor assessments, compute institutional weighted scores, moderate grades, and lock official results.
        </p>
      </div>

      <ScorebookClient
        initialGrades={gradeRows}
        cycleId={cycle.id}
        cycleName={cycle.name}
        approverPersonId={coordinator?.id || ""}
        tenantSlug={params.tenant}
      />
    </div>
  );
}
