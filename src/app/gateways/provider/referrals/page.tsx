import Link from "next/link";
import { CommunityCaseButton } from "@/components/community-case-button";
import { AuthenticationError, AuthorizationError, requireAuthenticatedActor } from "@/lib/authz";
import { db } from "@/lib/db";
import { communityRecipientTargets } from "@/modules/needs-matching/community-access";
import { dispatchAction, dispatchTarget } from "@/modules/needs-matching/referrals";
import { referralStages } from "@/modules/needs-matching/referral-status";

export const dynamic = "force-dynamic";

export default async function ProviderReferralsPage() {
  const actor = await requireAuthenticatedActor().catch((error: unknown) => {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) return null;
    throw error;
  });
  const targets = actor ? await communityRecipientTargets(actor.id) : [];
  const matchingDispatches = targets.length ? await db.auditLog.findMany({
    where: {
      resourceType: "NeedRequest", actionType: dispatchAction,
      OR: targets.map(({ id, type }) => ({
        AND: [{ afterState: { path: ["targetId"], equals: id } }, { afterState: { path: ["targetType"], equals: type } }],
      })),
    },
    select: { resourceId: true },
    distinct: ["resourceId"],
  }) : [];
  const requestIds = matchingDispatches.map(({ resourceId }) => resourceId);
  const [cases, dispatches] = requestIds.length ? await Promise.all([
    db.needRequest.findMany({
      where: { id: { in: requestIds }, status: { in: ["MATCHED", "ACCEPTED", "SERVICED"] } },
      select: { id: true, title: true, description: true, category: true, locationCity: true, status: true },
      orderBy: { createdAt: "desc" },
    }),
    db.auditLog.findMany({
      where: { resourceType: "NeedRequest", actionType: dispatchAction, resourceId: { in: requestIds } },
      select: { resourceId: true, afterState: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }),
  ]) : [[], []];
  const currentTargets = new Map();
  for (const dispatch of dispatches) {
    if (!currentTargets.has(dispatch.resourceId)) currentTargets.set(dispatch.resourceId, dispatchTarget(dispatch.afterState));
  }
  const assigned = cases.filter((request) => {
    const target = currentTargets.get(request.id);
    return target && targets.some(({ id, type }) => id === target.id && type === target.type);
  });
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-5 py-12">
      <h1 className="text-2xl font-bold">Assigned referrals</h1>
      <Link href="/gateways/provider" className="text-sm text-emerald-800 underline">Provider registration</Link>
      {!assigned.length && <p className="text-slate-700">No referrals are assigned to this account.</p>}
      {assigned.map((request) => (
        <article key={request.id} className="space-y-3 rounded-lg border bg-white p-4">
          <h2 className="font-semibold">{request.title}</h2>
          <p className="whitespace-pre-wrap text-sm">{request.description}</p>
          <p className="text-sm">{request.locationCity} · {referralStages[request.status as keyof typeof referralStages]}</p>
          <div className="flex flex-wrap gap-2">
            {request.status === "MATCHED" && <>
              <CommunityCaseButton id={request.id} operation="ACCEPT" label="Accept referral" />
              <CommunityCaseButton id={request.id} operation="DECLINE" label="Decline referral" />
            </>}
            {request.status === "ACCEPTED" && <CommunityCaseButton id={request.id} operation="COMPLETE" label="Mark service completed" />}
          </div>
        </article>
      ))}
    </main>
  );
}
