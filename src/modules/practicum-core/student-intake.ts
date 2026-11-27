import { z } from "zod";

export const rsuStudentIntakeFormId = "1g4LkZ6ZRBvH6MmhV9KzZJ-EsUuIggHvpOJVdZ_JBmfY";
export const rsuStudentIntakePath = "/rsu/admin/cohort/intake";

export const studentIntakeBatch = z.object({
  formId: z.literal(rsuStudentIntakeFormId),
  responses: z.array(z.object({
    id: z.string().trim().min(1).max(256),
    submittedAt: z.string().datetime(),
    firstName: z.string().trim().min(1).max(120),
    lastName: z.string().trim().min(1).max(120),
    email: z.string().trim().toLowerCase().max(254).email(),
    matricNumber: z.string().trim().min(1).max(100),
    level: z.enum(["100", "200", "300", "400"]).transform((value) => `${value}L`).optional(),
  })).max(40),
});

export const cohortEnrollmentStatuses = ["PLANNING", "CAPACITY_OPEN", "MATCHING"] as const;
