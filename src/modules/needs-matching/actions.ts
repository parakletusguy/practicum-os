"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { SystemRole } from "@prisma/client";
import { AuthenticationError, AuthorizationError, requireAuthenticatedActor } from "@/lib/authz";
import { isDemoMode } from "@/lib/runtime-mode";
import { 
  NeedCategoryType, 
  generateDeidentifiedCaseToken, 
  sanitizeTextForPII 
} from "./types";
import { computeServiceMatches } from "./matcher";

async function requireCommunityMatcher() {
  if (isDemoMode()) return null;

  const actor = await requireAuthenticatedActor();
  const membership = await prisma.orgMembership.findFirst({
    where: {
      personId: actor.id,
      status: "ACTIVE",
      role: { in: [SystemRole.COORDINATOR, SystemRole.INSTITUTION_ADMIN] },
    },
    select: { id: true },
  });
  if (!membership) {
    throw new AuthorizationError("Only an active institution coordinator may access the care-matching desk.");
  }
  return actor;
}

const NeedRequestSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Valid contact email is required"),
  phone: z.string().optional(),
  category: z.enum([
    "ELDERLY_CARE",
    "DISABILITY_SUPPORT",
    "CHILD_FAMILY_WELFARE",
    "PSYCHOSOCIAL_SUPPORT",
    "HOME_CARE_CLEANING",
    "COMMUNITY_PROGRAMMES",
    "OTHER",
  ]),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(15, "Please provide enough details about your care need"),
  urgencyLevel: z.enum(["LOW", "STANDARD", "URGENT", "CRITICAL"]).default("STANDARD"),
  locationCity: z.string().min(2, "City/Location is required"),
});

export async function submitNeedRequestAction(rawData: z.infer<typeof NeedRequestSchema>) {
  try {
    const validated = NeedRequestSchema.parse(rawData);

    // 1. Sanitize description to eliminate accidental PII leaks
    const { sanitized: sanitizedDescription } = sanitizeTextForPII(validated.description);
    const caseToken = generateDeidentifiedCaseToken();

    // A production caller may create a request only for their verified
    // identity. Demo mode retains the seeded public-form behaviour.
    const person = !isDemoMode()
      ? await requireAuthenticatedActor()
      : await prisma.person.upsert({
          where: { email: validated.email.toLowerCase().trim() },
          update: {
            firstName: validated.firstName.trim(),
            lastName: validated.lastName.trim(),
            phone: validated.phone || null,
          },
          create: {
            firstName: validated.firstName.trim(),
            lastName: validated.lastName.trim(),
            email: validated.email.toLowerCase().trim(),
            phone: validated.phone || null,
            avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${validated.firstName}`,
          },
        });
    if (person.email !== validated.email.toLowerCase().trim()) {
      return { success: false, error: "Use the email address for your signed-in account." };
    }

    // 3. Create NeedRequest in database
    const needRequest = await prisma.needRequest.create({
      data: {
        seekerPersonId: person.id,
        category: validated.category as NeedCategoryType,
        title: `[${caseToken}] ${validated.title.trim()}`,
        description: sanitizedDescription,
        urgencyLevel: validated.urgencyLevel,
        locationCity: validated.locationCity.trim(),
        status: "OPEN",
      },
    });

    // 4. Record Audit Log
    await prisma.auditLog.create({
      data: {
        actorPersonId: person.id,
        actionType: "NEED_REQUEST_SUBMITTED",
        resourceType: "NeedRequest",
        resourceId: needRequest.id,
        afterState: {
          caseToken,
          category: validated.category,
          urgencyLevel: validated.urgencyLevel,
          locationCity: validated.locationCity,
        },
      },
    });

    revalidatePath("/gateways/help");
    revalidatePath("/gateways/matching");
    revalidatePath("/unilag/admin/needs");

    return {
      success: true,
      caseToken,
      needRequestId: needRequest.id,
      message: "Your care request has been registered under zero-PII safeguarding.",
    };
  } catch (error: any) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return { success: false, error: error.message };
    }
    console.error("submitNeedRequestAction error:", error);
    return {
      success: false,
      error: error.message || "Failed to submit care request. Please review your input.",
    };
  }
}

const ServiceProviderSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  headline: z.string().min(5, "Professional headline is required"),
  bio: z.string().min(20, "Please provide a professional biography"),
  skills: z.array(z.string()).min(1, "Select at least one specialty skill"),
  yearsExperience: z.number().min(0).default(1),
  primaryCity: z.string().min(2, "Location city is required"),
});

export async function registerServiceProviderAction(rawData: z.infer<typeof ServiceProviderSchema>) {
  try {
    const validated = ServiceProviderSchema.parse(rawData);

    // A provider cannot claim another person's email or self-verify in
    // production. Verification is an institutional approval step.
    const person = !isDemoMode()
      ? await requireAuthenticatedActor()
      : await prisma.person.upsert({
          where: { email: validated.email.toLowerCase().trim() },
          update: {
            firstName: validated.firstName.trim(),
            lastName: validated.lastName.trim(),
            phone: validated.phone || null,
          },
          create: {
            firstName: validated.firstName.trim(),
            lastName: validated.lastName.trim(),
            email: validated.email.toLowerCase().trim(),
            phone: validated.phone || null,
            avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${validated.firstName}`,
          },
        });
    if (person.email !== validated.email.toLowerCase().trim()) {
      return { success: false, error: "Use the email address for your signed-in account." };
    }

    // 2. Upsert ServiceProvider profile
    const provider = await prisma.serviceProvider.upsert({
      where: { personId: person.id },
      update: {
        headline: validated.headline.trim(),
        bio: validated.bio.trim(),
        skills: validated.skills,
        practicePassport: {
          yearsExperience: validated.yearsExperience,
          primaryCity: validated.primaryCity,
          registeredAt: new Date().toISOString(),
        },
      },
      create: {
        personId: person.id,
        headline: validated.headline.trim(),
        bio: validated.bio.trim(),
        skills: validated.skills,
        verifiedStatus: isDemoMode() ? "VERIFIED" : "PENDING",
        practicePassport: {
          yearsExperience: validated.yearsExperience,
          primaryCity: validated.primaryCity,
          registeredAt: new Date().toISOString(),
        },
      },
    });

    // 3. Record Audit Log
    await prisma.auditLog.create({
      data: {
        actorPersonId: person.id,
        actionType: "SERVICE_PROVIDER_REGISTERED",
        resourceType: "ServiceProvider",
        resourceId: provider.id,
        afterState: {
          headline: validated.headline,
          skills: validated.skills,
          verifiedStatus: provider.verifiedStatus,
        },
      },
    });

    revalidatePath("/gateways/provider");
    revalidatePath("/gateways/matching");

    return {
      success: true,
      providerId: provider.id,
      message: isDemoMode()
        ? "Provider profile activated in the preview registry."
        : "Provider profile submitted for institutional verification.",
    };
  } catch (error: any) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return { success: false, error: error.message };
    }
    console.error("registerServiceProviderAction error:", error);
    return {
      success: false,
      error: error.message || "Failed to register provider profile.",
    };
  }
}

export async function getOpenNeedRequestsAction() {
  try {
    await requireCommunityMatcher();
    const requests = await prisma.needRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        seeker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return { success: true, requests };
  } catch (error: any) {
    console.error("getOpenNeedRequestsAction error:", error);
    return { success: false, requests: [], error: error.message };
  }
}

export async function getNeedRequestWithMatchesAction(needRequestId: string) {
  try {
    await requireCommunityMatcher();
    const request = await prisma.needRequest.findUnique({
      where: { id: needRequestId },
      include: {
        seeker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!request) {
      return { success: false, error: "Need request not found" };
    }

    const matches = await computeServiceMatches({
      category: request.category as NeedCategoryType,
      title: request.title,
      description: request.description,
      locationCity: request.locationCity,
    });

    return { success: true, request, matches };
  } catch (error: any) {
    console.error("getNeedRequestWithMatchesAction error:", error);
    return { success: false, error: error.message };
  }
}

export async function dispatchNeedMatchAction(
  needRequestId: string,
  targetId: string,
  targetType: "ORGANISATION" | "SERVICE_PROVIDER" | "STUDENT_ALLOCATION",
  targetName: string,
  coordinatorNotes?: string
) {
  try {
    const actor = await requireCommunityMatcher();
    if (!["ORGANISATION", "SERVICE_PROVIDER", "STUDENT_ALLOCATION"].includes(targetType)) {
      return { success: false, error: "Invalid match target type." };
    }
    const request = await prisma.needRequest.findUnique({
      where: { id: needRequestId },
      select: { id: true, status: true },
    });
    if (!request) return { success: false, error: "Care request not found." };
    if (request.status !== "OPEN") return { success: false, error: "Only open care requests can be matched." };

    let verifiedTargetName: string | null = null;
    if (targetType === "ORGANISATION") {
      const target = await prisma.organisation.findFirst({
        where: { id: targetId, verificationStatus: "VERIFIED" },
        select: { name: true },
      });
      verifiedTargetName = target?.name ?? null;
    } else if (targetType === "SERVICE_PROVIDER") {
      const target = await prisma.serviceProvider.findFirst({
        where: { id: targetId, verifiedStatus: "VERIFIED" },
        include: { person: { select: { firstName: true, lastName: true } } },
      });
      verifiedTargetName = target ? `${target.person.firstName} ${target.person.lastName}` : null;
    } else {
      const target = await prisma.placementAllocation.findFirst({
        where: { id: targetId, status: "ACTIVE" },
        include: { studentPerson: { select: { firstName: true, lastName: true } } },
      });
      verifiedTargetName = target ? `${target.studentPerson.firstName} ${target.studentPerson.lastName} (Supervised Trainee)` : null;
    }
    if (!verifiedTargetName) {
      return { success: false, error: "The selected target is not an active, verified match." };
    }
    const statusUpdate = await prisma.needRequest.updateMany({
      where: { id: request.id, status: "OPEN" },
      data: { status: "MATCHED" },
    });
    if (statusUpdate.count !== 1) {
      return { success: false, error: "The care request was changed by another coordinator. Refresh and try again." };
    }

    // Record formal audit dispatch
    await prisma.auditLog.create({
      data: {
        actorPersonId: actor?.id,
        actionType: "NEED_DISPATCHED_TO_SERVICE",
        resourceType: "NeedRequest",
        resourceId: needRequestId,
        afterState: {
          targetId,
          targetType,
          targetName: verifiedTargetName,
          status: "MATCHED",
          coordinatorNotes: coordinatorNotes || "Dispatched via Semantic Matchmaker",
          dispatchedAt: new Date().toISOString(),
        },
      },
    });

    revalidatePath("/gateways/matching");
    revalidatePath("/unilag/admin/needs");

    return {
      success: true,
      message: `Need successfully dispatched to ${verifiedTargetName} (${targetType.replace(/_/g, " ")}).`,
    };
  } catch (error: any) {
    console.error("dispatchNeedMatchAction error:", error);
    return { success: false, error: error.message };
  }
}
