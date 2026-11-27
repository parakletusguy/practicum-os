import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePortalAccess } from "@/lib/portal-access";
import { contractRoleLabels, contractRoles, getLearningContract } from "@/modules/placement-matching/learning-contract";
import { AmendmentForm } from "./amendment-form";

export default async function ManageContractPage({ params }: { params: Promise<{ tenant: string; allocationId: string }> }) {
  const { tenant: slug, allocationId } = await params;
  const { actor, tenant } = await requirePortalAccess(slug, "admin");
  const contract = await getLearningContract(tenant.id, allocationId, "admin", actor.id);
  if (!contract) notFound();
  const { studentPerson, hostOrg } = contract.allocation;
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href={`/${slug}/admin/postings/${allocationId}`} className="text-sm text-emerald-800 underline">Back to posting letter</Link>
      <h1 className="text-2xl font-bold">Learning contract</h1>
      <p>{studentPerson.firstName} {studentPerson.lastName} · {hostOrg.name}</p>
      <section className="space-y-3 rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Current terms</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {contract.terms.map((term, index) => <li key={index} className="whitespace-pre-wrap">{term}</li>)}
        </ol>
        <ul className="space-y-1 text-sm">
          {contractRoles.map((party) => <li key={party}>{contractRoleLabels[party]} · {contract.signedRoles.includes(party) ? "Signed" : "Pending"}</li>)}
        </ul>
      </section>
      {contract.canAmend && <AmendmentForm tenantSlug={slug} allocationId={allocationId} version={contract.version} addendum={contract.amendments[0]?.addendum} />}
      {contract.amendments.length > 0 && <section className="space-y-3 rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Amendment history</h2>
        {contract.amendments.map((amendment) => <article key={amendment.id} className="border-t pt-2 text-sm">
          <p className="font-semibold">{amendment.createdAt.toISOString().slice(0, 10)} · {amendment.reason}</p>
          <p className="whitespace-pre-wrap">{amendment.addendum}</p>
        </article>)}
      </section>}
    </div>
  );
}
