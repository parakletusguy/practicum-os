"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { OrgType } from "@prisma/client";

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
    const offer = await db.placementOffer.create({
      data: {
        cycleId: data.cycleId,
        hostOrgId: data.hostOrgId,
        totalSlots: Number(data.totalSlots) || 1,
        availableSlots: Number(data.totalSlots) || 1,
        practiceAreas: data.practiceAreas,
        contactPerson: data.contactPerson || null,
        contactPhone: data.contactPhone || null,
        requirements: data.requirements || null,
        status: "CONFIRMED",
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
