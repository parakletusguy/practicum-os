import Link from "next/link";
import { notFound } from "next/navigation";
import { CommunityCaseButton } from "@/components/community-case-button";
import { AuthenticationError, AuthorizationError } from "@/lib/authz";
import { db } from "@/lib/db";
import { requireCommunityMatcher } from "@/modules/needs-matching/community-access";
import { referralStages } from "@/modules/needs-matching/referral-status";

export const dynamic = "force-dynamic";

export default async function CommunityCasesPage() {
  const actor = await requireCommunityMatcher().catch((error: unknown) => {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) notFound();
    throw error;
  });
  if (!actor) notFound();
  const [providers, cases] = await Promise.all([
    db.serviceProvider.findMany({
      select: { id: true, headline: true, bio: true, skills: true, verifiedStatus: true, person: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.needRequest.findMany({
      where: { status: { not: "CLOSED" } },
      select: { id: true, title: true, status: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-5 py-12">
      <h1 className="text-2xl font-bold">Community case operations</h1>
      <Link href="/gateways/matching" className="text-sm text-emerald-800 underline">Open matching desk</Link>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Provider vetting</h2>
        {providers.map((provider) => (
          <article key={provider.id} className="space-y-2 rounded-lg border bg-white p-4">
            <h3 className="font-semibold">{provider.person.firstName} {provider.person.lastName} · {provider.headline}</h3>
            <p className="text-sm">{provider.bio}</p>
            <p className="text-sm">{provider.skills.join(", ")} · {provider.verifiedStatus.toLowerCase()}</p>
            <CommunityCaseButton id={provider.id} operation={provider.verifiedStatus === "VERIFIED" ? "SUSPENDED" : "VERIFIED"}
              label={provider.verifiedStatus === "VERIFIED" ? "Suspend provider" : "Verify provider"} />
          </article>
        ))}
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Cases in progress</h2>
        {cases.map((request) => (
          <article key={request.id} className="space-y-2 rounded-lg border bg-white p-4">
            <h3 className="font-semibold">{request.title}</h3>
            <p className="text-sm">{referralStages[request.status as keyof typeof referralStages] || request.status}</p>
            {request.status === "MATCHED" && <CommunityCaseButton id={request.id} operation="REOPEN" label="Return to matching" />}
            {request.status === "SERVICED" && <CommunityCaseButton id={request.id} operation="CLOSE" label="Close case" />}
          </article>
        ))}
      </section>
    </main>
  );
}
