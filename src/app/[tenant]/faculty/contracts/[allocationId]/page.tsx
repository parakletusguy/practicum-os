import { ContractPage } from "@/components/learning-contract/contract-page";

export default async function LearningContractPage({ params }: { params: Promise<{ tenant: string; allocationId: string }> }) {
  const { tenant, allocationId } = await params;
  return <ContractPage tenantSlug={tenant} allocationId={allocationId} role="faculty" />;
}
