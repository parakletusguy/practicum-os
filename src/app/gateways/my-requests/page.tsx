import Link from "next/link";
import { AuthenticationError, AuthorizationError, requireAuthenticatedActor } from "@/lib/authz";
import { db } from "@/lib/db";
import { referralStages } from "@/modules/needs-matching/referral-status";

export const dynamic = "force-dynamic";

export default async function MyRequestsPage() {
  const actor = await requireAuthenticatedActor().catch((error: unknown) => {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) return null;
    throw error;
  });
  const requests = actor ? await db.needRequest.findMany({
    where: { seekerPersonId: actor.id },
    select: { id: true, title: true, status: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  }) : [];
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-5 py-12">
      <h1 className="text-2xl font-bold">My care requests</h1>
      <Link href="/gateways/help" className="text-sm text-emerald-800 underline">Submit a care request</Link>
      {!requests.length && <p className="text-slate-700">No care requests are recorded for this account.</p>}
      {requests.map((request) => (
        <article key={request.id} className="rounded-lg border bg-white p-4">
          <h2 className="font-semibold">{request.title}</h2>
          <p className="text-sm">{referralStages[request.status as keyof typeof referralStages] || request.status}</p>
        </article>
      ))}
    </main>
  );
}
