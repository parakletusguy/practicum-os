"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { CycleStatus, OrgType, SystemRole } from "@prisma/client";
import { requireTenantRole } from "@/lib/authz";
import { isDemoMode } from "@/lib/runtime-mode";
import { requirePortalAccess } from "@/lib/portal-access";
import { z } from "zod";
import { accreditationReviewAction, accreditationDueDate, renewalDate } from "./accreditation";

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


const reviewInput = z.object({
  status: z.enum(["VERIFIED", "SUSPENDED"]),
  renewalDueOn: z.union([renewalDate, z.literal("")]),
  notes: z.string().trim().min(10).max(2000),
});

export async function reviewPartnerAgencyAction(
  tenantSlug: string, agencyId: string, version: string,
  _state: { success: boolean; message: string }, form: FormData,
) {
  const parsed = reviewInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { success: false, message: "Choose a decision, enter a valid renewal date if applicable, and record review notes." };
  const { status, renewalDueOn, notes } = parsed.data;
  const today = new Date().toISOString().slice(0, 10);
  if (status === "VERIFIED" && (!renewalDueOn || renewalDueOn < today)) {
    return { success: false, message: "Enter a renewal date on or after today to approve accreditation." };
  }
  const { actor, tenant } = await requirePortalAccess(tenantSlug, "admin");
  try {
    await db.$transaction(async (tx) => {
      const agency = await tx.organisation.findFirst({
        where: { id: agencyId, tenantId: tenant.id },
        select: { id: true, verificationStatus: true, settings: true, updatedAt: true },
      });
      if (!agency) throw new Error("Partner agency unavailable.");
      if (agency.updatedAt.toISOString() !== version) throw new Error("This review changed. Refresh before saving.");
      const settings = agency.settings && typeof agency.settings === "object" && !Array.isArray(agency.settings) ? agency.settings : {};
      const previousDueOn = accreditationDueDate(settings);
      const dueOn = status === "VERIFIED" ? renewalDueOn : previousDueOn;
      const changed = await tx.organisation.updateMany({
        where: { id: agencyId, tenantId: tenant.id, updatedAt: agency.updatedAt },
        data: { verificationStatus: status, settings: { ...settings, accreditation: { renewalDueOn: dueOn } } },
      });
      if (changed.count !== 1) throw new Error("This review changed. Refresh before saving.");
      await tx.auditLog.create({ data: {
        tenantId: tenant.id, actorPersonId: actor.id, actionType: accreditationReviewAction,
        resourceType: "Organisation", resourceId: agencyId,
        beforeState: { verificationStatus: agency.verificationStatus, renewalDueOn: previousDueOn },
        afterState: { verificationStatus: status, renewalDueOn: dueOn, notes },
      } });
    }, { isolationLevel: "Serializable" });
    revalidatePath("/" + tenantSlug + "/admin/agencies");
    revalidatePath("/" + tenantSlug + "/admin/agencies/" + agencyId + "/accreditation");
    revalidatePath("/" + tenantSlug + "/admin/matching");
    return { success: true, message: status === "VERIFIED" ? "Accreditation review and renewal date saved." : "Accreditation suspended." };
  } catch (error) {
    return { success: false, message: error instanceof Error && !("code" in error) ? error.message : "The review could not be saved. Refresh and try again." };
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
