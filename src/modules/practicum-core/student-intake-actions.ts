"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthenticationError, AuthorizationError, requireTenantRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { cohortEnrollmentStatuses, rsuStudentIntakePath } from "./student-intake";

const decisionSchema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("enrol"), responseId: z.string().uuid(), cycleId: z.string().uuid() }),
  z.object({ decision: z.literal("dismiss"), responseId: z.string().uuid() }),
]);

class IntakeReviewError extends Error {}

export async function reviewRsuStudentIntakeAction(_state: string | null, form: FormData): Promise<string | null> {
  const result = decisionSchema.safeParse(Object.fromEntries(form));
  if (!result.success) return "Choose a practicum cycle before adding this student.";

  try {
    const { actor, tenant } = await requireTenantRole("rsu", ["COORDINATOR", "INSTITUTION_ADMIN"]);
    const input = result.data;
    await db.$transaction(async (tx) => {
      const response = await tx.studentIntakeResponse.findFirst({
        where: { id: input.responseId, tenantId: tenant.id, status: "PENDING" },
      });
      if (!response) throw new IntakeReviewError("This response has already been reviewed or is unavailable.");

      const changed = await tx.studentIntakeResponse.updateMany({
        where: { id: response.id, tenantId: tenant.id, status: "PENDING" },
        data: { status: input.decision === "enrol" ? "ENROLLED" : "DISMISSED", reviewedAt: new Date() },
      });
      if (changed.count !== 1) throw new IntakeReviewError("This response has already been reviewed.");

      const enrollmentId = input.decision === "enrol"
        ? await enrolIntakeStudent(tx, response, input.cycleId)
        : undefined;

      await tx.auditLog.create({
        data: {
          tenantId: tenant.id,
          actorPersonId: actor.id,
          actionType: enrollmentId ? "STUDENT_INTAKE_APPROVED" : "STUDENT_INTAKE_DISMISSED",
          resourceType: "StudentIntakeResponse",
          resourceId: response.id,
          afterState: enrollmentId && input.decision === "enrol"
            ? { cycleId: input.cycleId, enrollmentId }
            : { status: "DISMISSED" },
        },
      });
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    if (error instanceof IntakeReviewError) return error.message;
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return "Sign in with an RSU coordinator or administrator account to review responses.";
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2034", "P2002"].includes(error.code)) {
      return "Another change was saved at the same time. Refresh and review this response again.";
    }
    return "Could not save the review. Please try again.";
  }

  revalidatePath(rsuStudentIntakePath);
  revalidatePath("/rsu/admin/cohort");
  revalidatePath("/rsu/admin/matching");
  revalidatePath("/rsu/admin");
  return null;
}

async function enrolIntakeStudent(
  tx: Prisma.TransactionClient,
  response: { tenantId: string; email: string; firstName: string; lastName: string; matricNumber: string; level: string | null },
  cycleId: string,
): Promise<string> {
  const cycle = await tx.practicumCycle.findFirst({
    where: { id: cycleId, tenantId: response.tenantId, status: { in: [...cohortEnrollmentStatuses] } },
    select: { id: true },
  });
  if (!cycle) throw new IntakeReviewError("Choose an RSU cycle that is open for enrollment.");

  const existing = await tx.cohortStudent.findMany({
    where: {
      cycleId,
      OR: [
        { matricNumber: { equals: response.matricNumber, mode: "insensitive" } },
        { person: { email: response.email } },
      ],
    },
    select: { id: true, matricNumber: true, person: { select: { email: true } } },
  });
  if (existing.length) {
    const [match] = existing;
    if (existing.length !== 1 || match.person.email !== response.email ||
      match.matricNumber.toUpperCase() !== response.matricNumber.toUpperCase()) {
      throw new IntakeReviewError("The email or matriculation number belongs to a different record in this cycle. Check the roster before approving.");
    }
    return match.id;
  }

  const person = await tx.person.upsert({
    where: { email: response.email },
    update: {},
    create: { firstName: response.firstName, lastName: response.lastName, email: response.email },
    select: { id: true, isActive: true },
  });
  if (!person.isActive) throw new IntakeReviewError("This email belongs to a disabled account. Review its access before enrolling.");

  const key = { personId: person.id, organisationId: response.tenantId, role: "STUDENT" } as const;
  const membership = await tx.orgMembership.upsert({
    where: { personId_organisationId_role: key },
    update: {},
    create: key,
    select: { status: true },
  });
  if (membership.status !== "ACTIVE") throw new IntakeReviewError("This student role is inactive. Review its access before enrolling.");

  const enrollment = await tx.cohortStudent.create({
    data: { cycleId, personId: person.id, matricNumber: response.matricNumber, level: response.level },
    select: { id: true },
  });
  return enrollment.id;
}
