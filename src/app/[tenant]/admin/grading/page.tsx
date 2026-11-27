import { requirePortalAccess } from "@/lib/portal-access";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAssessmentScores } from "@/modules/grading/assessment-scores";
import { calculateWeightedGrade, readGradingFormula } from "@/modules/grading/formula";
import { ScorebookClient } from "./scorebook-client";
import { Award, ShieldCheck } from "lucide-react";

export default async function CohortGradingPage(
  props: {
    params: Promise<{ tenant: string }>;
  }
) {
  const params = await props.params;
  const { tenant } = await requirePortalAccess(params.tenant, "admin");

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
              assessments: { orderBy: [{ submittedAt: "desc" }, { id: "desc" }] },
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

  const formula = readGradingFormula(cycle.gradingFormula);
  const gradeRows = cycle.students.map((student) => {
    const alloc = student.allocation;
    const grade = student.grade;

    const scores = getAssessmentScores(alloc, cycle.requiredHours);
    const result = calculateWeightedGrade(scores, formula);
    const currentGrade = grade?.isApproved || result.complete && grade?.compositeScore === result.compositeScore && grade.letterGrade === result.letterGrade
      && grade.fieldEvalScore === scores.fieldEval && grade.academicEvalScore === scores.academicEval
      && grade.logbookHoursScore === scores.logbookHours && grade.reportsScore === scores.reports ? grade : null;

    return {
      studentId: student.id,
      gradeId: currentGrade?.id,
      matricNumber: student.matricNumber,
      studentName: `${student.person.firstName} ${student.person.lastName}`,
      agencyName: alloc?.hostOrg.name || "Unassigned",
      logbookHoursScore: currentGrade?.logbookHoursScore ?? scores.logbookHours,
      fieldEvalScore: currentGrade?.fieldEvalScore ?? scores.fieldEval,
      academicEvalScore: currentGrade?.academicEvalScore ?? scores.academicEval,
      reportsScore: currentGrade?.reportsScore ?? scores.reports,
      compositeScore: currentGrade?.compositeScore ?? null,
      letterGrade: currentGrade?.letterGrade ?? null,
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
        formula={formula.components}
        gradeBands={Object.entries(formula.gradeScale).sort((a, b) => b[1][0] - a[1][0]).map(([letter]) => letter)}
        tenantSlug={params.tenant}
      />
    </div>
  );
}
