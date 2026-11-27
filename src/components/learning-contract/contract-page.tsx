import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePortalAccess } from "@/lib/portal-access";
import { contractRoleLabels, contractRoles, getLearningContract, type ContractRole } from "@/modules/placement-matching/learning-contract";
import { ContractForm } from "./contract-form";

export async function ContractPage({ tenantSlug, allocationId, role }: {
  tenantSlug: string; allocationId: string; role: ContractRole;
}) {
  const { tenant, actor } = await requirePortalAccess(tenantSlug, role);
  const contract = await getLearningContract(tenant.id, allocationId, role, actor.id);
  if (!contract) notFound();
  const student = contract.allocation.studentPerson;
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href={`/${tenantSlug}/${role}`} className="text-sm text-emerald-800 underline">Return to workspace</Link>
      <section className="space-y-5 rounded-xl border bg-white p-6">
        <h1 className="text-2xl font-bold">Learning contract</h1>
        <p>{student.firstName} {student.lastName} · {contract.allocation.hostOrg.name} · {contract.allocation.cycle.name}</p>
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          {contract.terms.map((term) => <li key={term}>{term}</li>)}
        </ol>
        <p className="text-sm text-slate-600">Version {contract.version.slice(0, 12)}</p>
        <ul className="space-y-1 text-sm">
          {contractRoles.map((party) => <li key={party}>{contractRoleLabels[party]} · {contract.signedRoles.includes(party) ? "Signed" : "Pending"}</li>)}
        </ul>
        {contract.signedRoles.includes(role) ? <p role="status">Your signature is recorded.</p> : contract.canSign ? (
          <ContractForm tenantSlug={tenantSlug} allocationId={allocationId} role={role} version={contract.version} />
        ) : <p className="text-sm text-slate-600">Signing is available for posted placements with all three signatories assigned.</p>}
      </section>
    </div>
  );
}
