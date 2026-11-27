"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthorizationError, AuthenticationError, requireTenantRole } from "@/lib/authz";
import { db } from "@/lib/db";

const roleSchema = z.enum(["COORDINATOR", "STUDENT", "ACADEMIC_SUPERVISOR", "FIELD_SUPERVISOR"]);
const nameSchema = z.string().trim().min(1).max(100);
const requestSchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("grant"),
    email: z.string().trim().toLowerCase().email().max(254),
    firstName: nameSchema,
    lastName: nameSchema,
    role: roleSchema,
  }),
  z.object({
    operation: z.literal("suspend"),
    membershipId: z.string().min(1),
  }),
]);

export async function updateMembershipAction(
  tenantSlug: string,
  _previousState: { success: boolean; message: string },
  form: FormData,
): Promise<{ success: boolean; message: string }> {
  const parsed = requestSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { success: false, message: "Check the name, email, and role." };

  try {
    const { actor, tenant } = await requireTenantRole(tenantSlug, ["INSTITUTION_ADMIN"]);
    const data = parsed.data;
    await db.$transaction(async (tx) => {
      if (data.operation === "suspend") {
        const membership = await tx.orgMembership.findUnique({
          where: { id: data.membershipId, organisationId: tenant.id },
          select: { id: true, personId: true, role: true, status: true },
        });
        if (!membership || !roleSchema.safeParse(membership.role).success || membership.personId === actor.id) {
          throw new AuthorizationError("This membership cannot be suspended here.");
        }
        const suspended = await tx.orgMembership.updateMany({
          where: { id: membership.id, status: { not: "SUSPENDED" } },
          data: { status: "SUSPENDED" },
        });
        if (suspended.count !== 1) return;
        await tx.auditLog.create({ data: {
          tenantId: tenant.id, actorPersonId: actor.id, actionType: "MEMBERSHIP_SUSPENDED",
          resourceType: "OrgMembership", resourceId: membership.id,
          beforeState: { status: membership.status },
          afterState: { status: "SUSPENDED", role: membership.role },
        } });
        return;
      }

      const person = await tx.person.upsert({
        where: { email: data.email },
        create: { email: data.email, firstName: data.firstName, lastName: data.lastName },
        update: {},
        select: { id: true },
      });
      const membership = await tx.orgMembership.upsert({
        where: { personId_organisationId_role: { personId: person.id, organisationId: tenant.id, role: data.role } },
        create: { personId: person.id, organisationId: tenant.id, role: data.role, status: "ACTIVE" },
        update: { status: "ACTIVE" },
        select: { id: true },
      });
      await tx.auditLog.create({ data: {
        tenantId: tenant.id, actorPersonId: actor.id, actionType: "MEMBERSHIP_GRANTED",
        resourceType: "OrgMembership", resourceId: membership.id,
        afterState: { personId: person.id, status: "ACTIVE", role: data.role },
      } });
    });
    revalidatePath(`/${tenant.slug}/admin/access`);
    return { success: true, message: data.operation === "grant" ? "Access granted. The user can request a sign-in code." : "Membership suspended." };
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return { success: false, message: error.message };
    }
    console.error("Unable to update institutional membership", error);
    return { success: false, message: "Access could not be updated. Try again." };
  }
}
