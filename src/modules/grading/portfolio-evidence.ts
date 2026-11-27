import { z } from "zod";
import { isEvidencePathForAllocation } from "../evidence-vault/evidence-path";

const item = z.object({
  id: z.string().min(1),
  title: z.string(),
  date: z.string().date(),
  minutes: z.number().int().nonnegative(),
  includeAttachment: z.boolean(),
});

export type PortfolioEvidence = z.infer<typeof item>;

export function readPortfolioEvidence(value: unknown): PortfolioEvidence[] {
  const result = z.array(item).safeParse(value);
  return result.success ? result.data : [];
}

export function isApprovedAttachment(event: { allocationId: string; evidenceUrl: string | null; evidenceSanitized: boolean }) {
  const path = event.evidenceUrl;
  return Boolean(event.evidenceSanitized && path && isEvidencePathForAllocation(path, event.allocationId));
}

export function assemblePortfolioEvidence(
  entryIds: string[],
  attachmentIds: string[],
  events: {
    id: string; allocationId: string; activityTitle: string; eventDate: Date;
    verifiedMinutes: number; evidenceSanitized: boolean; evidenceUrl: string | null;
  }[],
): PortfolioEvidence[] {
  const byId = new Map(events.map((event) => [event.id, event]));
  const attachments = new Set(attachmentIds);
  if (attachments.size && attachmentIds.some((id) => !entryIds.includes(id))) {
    throw new Error("Select the logbook entry for each attachment you include.");
  }
  return Array.from(new Set(entryIds), (id) => {
    const event = byId.get(id);
    if (!event || (attachments.has(id) && !isApprovedAttachment(event))) {
      throw new Error("Select only verified entries and approved attachments from this placement.");
    }
    return {
      id, title: event.activityTitle, date: event.eventDate.toISOString().slice(0, 10),
      minutes: event.verifiedMinutes, includeAttachment: attachments.has(id),
    };
  });
}
