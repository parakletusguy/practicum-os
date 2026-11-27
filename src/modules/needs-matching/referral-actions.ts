"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedActor } from "@/lib/authz";
import { db } from "@/lib/db";
import { communityRecipientTargets, requireCommunityMatcher } from "./community-access";
import { dispatchTarget, findCurrentDispatch } from "./referrals";
import { recipientChanges } from "./referral-status";

export async function updateCommunityCaseAction(requestId: string, operation: "ACCEPT" | "DECLINE" | "COMPLETE" | "REOPEN" | "CLOSE") {
  const staffChange = operation === "CLOSE" || operation === "REOPEN";
  if (!staffChange && !Object.hasOwn(recipientChanges, operation)) return { success: false, message: "Invalid referral action." };
  try {
    const actor = staffChange ? await requireCommunityMatcher() : await requireAuthenticatedActor();
    if (!actor) return { success: false, message: "Sign in with a referral account." };

    await db.$transaction(async (tx) => {
      const targets = staffChange ? [] : await communityRecipientTargets(actor.id, tx);
      const referral = await findCurrentDispatch(requestId, tx);
      const target = referral && dispatchTarget(referral.afterState);
      if (!referral || !target || (!staffChange && !targets.some(({ type, id }) => id === target.id && type === target.type))) {
        throw new Error("This referral is unavailable.");
      }
      const change = operation === "CLOSE" ? { from: "SERVICED", to: "CLOSED" }
        : operation === "REOPEN" ? { from: "MATCHED", to: "OPEN" } : recipientChanges[operation];
      const result = await tx.needRequest.updateMany({ where: { id: requestId, status: change.from }, data: { status: change.to } });
      if (result.count !== 1) throw new Error("This referral changed. Refresh to see its current status.");
      await tx.auditLog.create({ data: {
        actionType: "NEED_REFERRAL_" + operation,
        resourceType: "NeedRequest", resourceId: requestId, actorPersonId: actor.id,
        beforeState: { status: change.from },
        afterState: { status: change.to, dispatchId: referral.id },
      } });
    }, { isolationLevel: "Serializable" });
    for (const path of ["/gateways/cases", "/gateways/my-requests", "/gateways/provider/referrals", "/gateways/matching"]) revalidatePath(path);
    return { success: true, message: "Referral updated." };
  } catch (error) {
    return { success: false, message: error instanceof Error && !("code" in error) ? error.message : "The referral could not be updated. Try again." };
  }
}

export async function reviewCommunityProviderAction(providerId: string, status: "VERIFIED" | "SUSPENDED") {
  if (status !== "VERIFIED" && status !== "SUSPENDED") return { success: false, message: "Invalid provider status." };
  try {
    const actor = await requireCommunityMatcher();
    if (!actor) return { success: false, message: "Sign in as a platform administrator." };
    await db.$transaction(async (tx) => {
      const provider = await tx.serviceProvider.findUnique({ where: { id: providerId }, select: { verifiedStatus: true } });
      if (!provider) throw new Error("Provider profile not found.");
      const changed = await tx.serviceProvider.updateMany({
        where: { id: providerId, verifiedStatus: provider.verifiedStatus },
        data: { verifiedStatus: status },
      });
      if (changed.count !== 1) throw new Error("The profile changed. Refresh and try again.");
      await tx.auditLog.create({ data: {
        actionType: "SERVICE_PROVIDER_REVIEWED", resourceType: "ServiceProvider",
        resourceId: providerId, actorPersonId: actor.id,
        beforeState: { status: provider.verifiedStatus }, afterState: { status },
      } });
    });
    revalidatePath("/gateways/cases");
    revalidatePath("/gateways/matching");
    revalidatePath("/gateways/provider/referrals");
    return { success: true, message: "Provider status updated." };
  } catch (error) {
    return { success: false, message: error instanceof Error && !("code" in error) ? error.message : "The provider review could not be saved." };
  }
}
