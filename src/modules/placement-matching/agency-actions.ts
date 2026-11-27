"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { CycleStatus, OrgType, SystemRole } from "@prisma/client";
import { requireTenantRole } from "@/lib/authz";
import { isDemoMode } from "@/lib/runtime-mode";

const AGENCY_ADMIN_ROLES = [SystemRole.COORDINATOR, SystemRole.INSTITUTION_ADMIN];

export async function createPartnerAgencyAction(data: {
  tenantSlug: string;
  name: string;
  orgType: OrgType;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
}) {
  try {
    const tenant = await db.organisation.findUnique({
      where: { slug: data.tenantSlug },
    });

    if (!tenant) {
      return { success: false, error: "Tenant not found" };
    }
    const authorization = !isDemoMode()
      ? await requireTenantRole(data.tenantSlug, AGENCY_ADMIN_ROLES)
      : null;
    if (!data.name.trim()) {
      return { success: false, error: "Agency name is required." };
    }

    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const agency = await db.organisation.create({
      data: {
        tenantId: tenant.id,
        name: data.name,
        slug: `${slug}-${Date.now().toString().slice(-4)}`,
        orgType: data.orgType,
        verificationStatus: "PENDING",
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || "Lagos",
      },
    });

    await db.auditLog.create({
      data: {
        tenantId: tenant.id,
        actorPersonId: authorization?.actor.id,
        actionType: "PARTNER_AGENCY_CREATED",
        resourceType: "Organisation",
        resourceId: agency.id,
        afterState: { name: agency.name, orgType: agency.orgType },
      },
    });

    revalidatePath(`/${data.tenantSlug}/admin/agencies`);
    return { success: true, agency };
  } catch (error: any) {
    console.error("Failed to create agency:", error);
    return { success: false, error: error.message };
  }
}

export async function reviewPartnerAgencyAction(tenantSlug: string, agencyId: string, status: "VERIFIED" | "SUSPENDED") {
  if (status !== "VERIFIED" && status !== "SUSPENDED") return { success: false, error: "Invalid accreditation status." };
  try {
    const authorization = isDemoMode() ? null : await requireTenantRole(tenantSlug, AGENCY_ADMIN_ROLES);
    const tenant = authorization?.tenant ?? await db.organisation.findUnique({ where: { slug: tenantSlug }, select: { id: true } });
    if (!tenant) return { success: false, error: "Institution not found." };
    await db.$transaction(async (tx) => {
      const agency = await tx.organisation.findFirst({
        where: { id: agencyId, tenantId: tenant.id },
        select: { id: true, tenantId: true, verificationStatus: true },
      });
      if (!agency?.tenantId) throw new Error("Partner agency not found for this institution.");
      if (agency.verificationStatus === status) return;
      const changed = await tx.organisation.updateMany({
        where: { id: agency.id, verificationStatus: agency.verificationStatus },
        data: { verificationStatus: status },
      });
      if (changed.count !== 1) throw new Error("The accreditation status changed. Refresh and try again.");
      await tx.auditLog.create({ data: {
        tenantId: agency.tenantId,
        actorPersonId: authorization?.actor.id,
        actionType: "PARTNER_AGENCY_ACCREDITATION_REVIEWED",
        resourceType: "Organisation",
        resourceId: agency.id,
        beforeState: { verificationStatus: agency.verificationStatus },
        afterState: { verificationStatus: status },
      } });
    });
    revalidatePath(`/${tenantSlug}/admin/agencies`);
    revalidatePath(`/${tenantSlug}/admin/matching`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "The review could not be saved." };
  }
}

export async function createPlacementOfferAction(data: {
  tenantSlug: string;
  cycleId: string;
  hostOrgId: string;
  totalSlots: number;
  practiceAreas: string[];
  contactPerson?: string;
  contactPhone?: string;
  requirements?: string;
}) {
  try {
    const tenant = await db.organisation.findUnique({ where: { slug: data.tenantSlug } });
    if (!tenant) return { success: false, error: "Tenant not found." };
    const authorization = !isDemoMode()
      ? await requireTenantRole(data.tenantSlug, AGENCY_ADMIN_ROLES)
      : null;
    const cycle = await db.practicumCycle.findFirst({
      where: { id: data.cycleId, tenantId: tenant.id, status: CycleStatus.CAPACITY_OPEN },
      select: { id: true },
    });
    if (!cycle) return { success: false, error: "Choose a cycle that is open for capacity collection." };
    const hostOrganisation = await db.organisation.findFirst({
      where: { id: data.hostOrgId, tenantId: tenant.id, verificationStatus: "VERIFIED" },
      select: { id: true },
    });
    if (!hostOrganisation) return { success: false, error: "Choose an accredited partner agency from this institution." };
    const totalSlots = Number(data.totalSlots);
    if (!Number.isInteger(totalSlots) || totalSlots < 1 || totalSlots > 1_000) {
      return { success: false, error: "Total slots must be a whole number between 1 and 1,000." };
    }
    const practiceAreas = Array.isArray(data.practiceAreas) ? data.practiceAreas.filter((area) => typeof area === "string").map((area) => area.trim()).filter(Boolean) : [];
    if (!practiceAreas.length) {
      return { success: false, error: "At least one practice area is required." };
    }
    const offer = await db.$transaction(async (tx) => {
      const created = await tx.placementOffer.create({
        data: {
          cycleId: cycle.id,
          hostOrgId: hostOrganisation.id,
          totalSlots,
          availableSlots: totalSlots,
          practiceAreas,
          contactPerson: data.contactPerson || null,
          contactPhone: data.contactPhone || null,
          requirements: data.requirements || null,
          status: "CONFIRMED",
        },
      });
      await tx.auditLog.create({
        data: {
          tenantId: tenant.id,
          actorPersonId: authorization?.actor.id,
          actionType: "PLACEMENT_OFFER_CREATED",
          resourceType: "PlacementOffer",
          resourceId: created.id,
          afterState: { cycleId: cycle.id, hostOrgId: hostOrganisation.id, totalSlots },
        },
      });
      return created;
    });

    revalidatePath(`/${data.tenantSlug}/admin/agencies`);
    revalidatePath(`/${data.tenantSlug}/admin/matching`);
    revalidatePath(`/${data.tenantSlug}/admin`);
    return { success: true, offer };
  } catch (error: any) {
    console.error("Failed to create placement offer:", error);
    return { success: false, error: error.message };
  }
}
