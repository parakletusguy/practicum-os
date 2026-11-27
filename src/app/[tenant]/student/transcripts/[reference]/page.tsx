import { TranscriptPage } from "@/components/transcript-page";

export default async function IssuedTranscriptPage({ params }: { params: Promise<{ tenant: string; reference: string }> }) {
  const { tenant, reference } = await params;
  return <TranscriptPage tenantSlug={tenant} reference={reference} role="student" />;
}
