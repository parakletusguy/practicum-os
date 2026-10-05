import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { RubricFormClient } from "./rubric-form-client";
import { Award, ShieldCheck } from "lucide-react";

export default async function FieldEvaluationsPage({
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

  const fieldSupervisor = await prisma.person.findFirst({
    where: {
      roleMemberships: {
        some: {
          role: "FIELD_SUPERVISOR",
        },
      },
    },
    include: {
      fieldSupervisedAllocations: {
        include: {
          cohortStudent: {
            include: { person: true },
          },
          hostOrg: true,
          assessments: {
            where: { evaluatorType: "FIELD_SUPERVISOR" },
            orderBy: { submittedAt: "desc" },
          },
        },
      },
    },
  });

  const allocations = fieldSupervisor?.fieldSupervisedAllocations || [];

  const traineeOptions = allocations.map((a) => ({
    allocationId: a.id,
    cycleId: a.cycleId,
    studentName: `${a.cohortStudent.person.firstName} ${a.cohortStudent.person.lastName}`,
    matricNumber: a.cohortStudent.matricNumber,
    agencyName: a.hostOrg.name,
    existingAssessments: a.assessments.map((sub) => ({
      stage: sub.stage,
      totalScore: sub.totalScore,
      submittedAt: sub.submittedAt,
    })),
  }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
          <Award className="w-4 h-4 text-emerald-600" />
          Field Practice Assessment Desk
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Clinical Competency Evaluation & Grading Rubric
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete standardized CSWE EPAS 9-dimensional evaluations for your assigned supervisees at midpoint and final practicum milestones.
        </p>
      </div>

      <RubricFormClient
        trainees={traineeOptions}
        evaluatorPersonId={fieldSupervisor?.id || ""}
        evaluatorType="FIELD_SUPERVISOR"
        tenantSlug={params.tenant}
      />
    </div>
  );
}
