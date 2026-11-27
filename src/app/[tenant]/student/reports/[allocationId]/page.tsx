import { ReportPage } from "@/components/practice-report/report-page";

export default async function PracticeReportsPage({ params }: { params: Promise<{ tenant: string; allocationId: string }> }) {
  const { tenant, allocationId } = await params;
  return <ReportPage tenantSlug={tenant} allocationId={allocationId} role="student" />;
}
