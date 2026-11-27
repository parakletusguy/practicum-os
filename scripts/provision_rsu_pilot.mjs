import { PrismaClient } from "@prisma/client";

const args = process.argv.slice(2);
if (args.length !== 1 || args[0] !== "--apply") {
  throw new Error("Pass --apply with the intended DATABASE_URL to provision the RSU Social Work workspace.");
}

const email = process.env.PRACTICUM_RSU_ADMIN_EMAIL?.trim().toLowerCase();
const firstName = process.env.PRACTICUM_RSU_ADMIN_FIRST_NAME?.trim();
const lastName = process.env.PRACTICUM_RSU_ADMIN_LAST_NAME?.trim();
if ((email || firstName || lastName) && (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !firstName || !lastName)) {
  throw new Error("Supply the approved coordinator email, first name, and last name together.");
}

const db = new PrismaClient();
try {
  const result = await db.$transaction(async (tx) => {
    const tenant = await tx.organisation.upsert({
      where: { slug: "rsu" },
      create: { slug: "rsu", name: "Rivers State University", orgType: "UNIVERSITY", city: "Port Harcourt", country: "Nigeria" },
      update: {},
      select: { id: true, name: true, slug: true, tenantId: true, orgType: true },
    });
    if (tenant.name !== "Rivers State University" || tenant.tenantId || tenant.orgType !== "UNIVERSITY") {
      throw new Error("The rsu slug already belongs to a different workspace.");
    }
    const departments = await tx.department.findMany({
      where: { organisationId: tenant.id, OR: [{ code: "SWK" }, { name: "Department of Social Work" }] },
      select: { id: true },
      take: 2,
    });
    if (departments.length > 1) throw new Error("The RSU Social Work department needs duplicate records reconciled first.");
    const department = departments[0] ?? await tx.department.create({
      data: { organisationId: tenant.id, name: "Department of Social Work", code: "SWK" },
      select: { id: true },
    });
    const programme = await tx.programme.findFirst({
      where: { departmentId: department.id, OR: [{ code: "BSC-SWK" }, { name: "Bachelor of Science in Social Work" }] },
      select: { id: true },
    });
    if (!programme) {
      await tx.programme.create({
        data: { departmentId: department.id, name: "Bachelor of Science in Social Work", code: "BSC-SWK", degreeLevel: "Undergraduate" },
      });
    }
    if (email) {
      const person = await tx.person.upsert({
        where: { email }, create: { email, firstName, lastName }, update: {}, select: { id: true, isActive: true },
      });
      if (!person.isActive) throw new Error("This existing account is disabled and must be reviewed before assigning an administrator role.");
      const membership = await tx.orgMembership.findUnique({
        where: { personId_organisationId_role: { personId: person.id, organisationId: tenant.id, role: "INSTITUTION_ADMIN" } },
        select: { id: true, status: true },
      });
      if (membership && membership.status !== "ACTIVE") {
        throw new Error("The existing administrator membership is inactive and must be reviewed first.");
      }
      if (!membership) {
        const created = await tx.orgMembership.create({
          data: { personId: person.id, organisationId: tenant.id, role: "INSTITUTION_ADMIN", status: "ACTIVE" },
        });
        await tx.auditLog.create({ data: {
          tenantId: tenant.id, actionType: "RSU_PILOT_ADMIN_PROVISIONED", resourceType: "OrgMembership", resourceId: created.id,
          afterState: { role: created.role, status: created.status },
        } });
      }
    }
    return { workspace: tenant.slug, department: "Social Work", coordinatorProvisioned: Boolean(email) };
  }, { isolationLevel: "Serializable", maxWait: 10_000, timeout: 30_000 });
  console.log(result);
} catch (error) {
  const detail = String(error?.message ?? "");
  const category = /can.t reach database|connection refused|timed out/i.test(detail) ? "database connection unavailable"
    : /authentication failed|tenant or user not found/i.test(detail) ? "database authentication failed"
    : /permission denied|forbidden/i.test(detail) ? "database permission denied" : "operation rejected";
  console.error("RSU provisioning was not applied", error?.code || error?.errorCode || error?.name || "UnknownError", category);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
