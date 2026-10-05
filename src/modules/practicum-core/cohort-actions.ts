"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export interface StudentImportRecord {
  firstName: string;
  lastName: string;
  email: string;
  matricNumber: string;
  phone?: string;
  level?: string;
  specialty?: string;
  locationPref?: string;
}

export async function importCohortStudentsAction(data: {
  tenantSlug: string;
  cycleId: string;
  students: StudentImportRecord[];
}) {
  try {
    const tenant = await db.organisation.findUnique({
      where: { slug: data.tenantSlug },
    });

    if (!tenant) {
      return { success: false, error: "Tenant not found" };
    }

    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const record of data.students) {
      if (!record.email || !record.matricNumber || !record.firstName || !record.lastName) {
        skippedCount++;
        errors.push(`Row missing required fields: ${record.email || record.matricNumber || "Unknown"}`);
        continue;
      }

      try {
        // 1. Find or create Universal Person
        let person = await db.person.findUnique({
          where: { email: record.email.toLowerCase().trim() },
        });

        if (!person) {
          person = await db.person.create({
            data: {
              firstName: record.firstName.trim(),
              lastName: record.lastName.trim(),
              email: record.email.toLowerCase().trim(),
              phone: record.phone?.trim() || null,
            },
          });
        }

        // 2. Ensure OrgMembership for this tenant with role STUDENT
        await db.orgMembership.upsert({
          where: {
            personId_organisationId_role: {
              personId: person.id,
              organisationId: tenant.id,
              role: "STUDENT",
            },
          },
          update: {},
          create: {
            personId: person.id,
            organisationId: tenant.id,
            role: "STUDENT",
          },
        });

        // 3. Upsert CohortStudent enrollment
        await db.cohortStudent.upsert({
          where: {
            cycleId_matricNumber: {
              cycleId: data.cycleId,
              matricNumber: record.matricNumber.trim(),
            },
          },
          update: {
            level: record.level?.trim() || "400L",
            specialty: record.specialty?.trim() || "General Practice",
            locationPref: record.locationPref?.trim() || "Mainland",
          },
          create: {
            cycleId: data.cycleId,
            personId: person.id,
            matricNumber: record.matricNumber.trim(),
            level: record.level?.trim() || "400L",
            specialty: record.specialty?.trim() || "General Practice",
            locationPref: record.locationPref?.trim() || "Mainland",
            status: "ENROLLED",
          },
        });

        importedCount++;
      } catch (err: any) {
        skippedCount++;
        errors.push(`Error on matric ${record.matricNumber}: ${err.message}`);
      }
    }

    revalidatePath(`/${data.tenantSlug}/admin/cohort`);
    revalidatePath(`/${data.tenantSlug}/admin/matching`);
    revalidatePath(`/${data.tenantSlug}/admin`);

    return {
      success: true,
      importedCount,
      skippedCount,
      errors: errors.slice(0, 5), // Return top 5 errors if any
    };
  } catch (error: any) {
    console.error("Failed to import cohort:", error);
    return { success: false, error: error.message };
  }
}
