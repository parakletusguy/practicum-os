"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { OrgType, SystemRole } from "@prisma/client";
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
        verificationStatus: "VERIFIED",
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
      where: { id: data.cycleId, tenantId: tenant.id },
      select: { id: true },
    });
    if (!cycle) return { success: false, error: "Practicum cycle not found for this institution." };
    const hostOrganisation = await db.organisation.findFirst({
      where: { id: data.hostOrgId, tenantId: tenant.id },
      select: { id: true },
    });
    if (!hostOrganisation) return { success: false, error: "Partner agency not found for this institution." };
    const totalSlots = Number(data.totalSlots);
    if (!Number.isInteger(totalSlots) || totalSlots < 1 || totalSlots > 1_000) {
      return { success: false, error: "Total slots must be a whole number between 1 and 1,000." };
    }
    if (!Array.isArray(data.practiceAreas) || data.practiceAreas.length === 0) {
      return { success: false, error: "At least one practice area is required." };
    }
    const offer = await db.placementOffer.create({
      data: {
        cycleId: cycle.id,
        hostOrgId: hostOrganisation.id,
        totalSlots,
        availableSlots: totalSlots,
        practiceAreas: data.practiceAreas.map((area) => area.trim()).filter(Boolean),
        contactPerson: data.contactPerson || null,
        contactPhone: data.contactPhone || null,
        requirements: data.requirements || null,
        status: "CONFIRMED",
      },
    });

    await db.auditLog.create({
      data: {
        tenantId: tenant.id,
        actorPersonId: authorization?.actor.id,
        actionType: "PLACEMENT_OFFER_CREATED",
        resourceType: "PlacementOffer",
        resourceId: offer.id,
        afterState: { cycleId: cycle.id, hostOrgId: hostOrganisation.id, totalSlots },
      },
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
