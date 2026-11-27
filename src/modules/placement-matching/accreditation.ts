import { z } from "zod";

export const accreditationReviewAction = "PARTNER_AGENCY_ACCREDITATION_REVIEWED";
export const renewalDate = z.string().date().refine((date) => !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date);

export function accreditationDueDate(settings: unknown) {
  const parsed = z.object({ accreditation: z.object({ renewalDueOn: renewalDate }) }).safeParse(settings);
  return parsed.success ? parsed.data.accreditation.renewalDueOn : null;
}

export function renewalLabel(dueOn: string | null, today = new Date().toISOString().slice(0, 10)) {
  if (!dueOn) return "Renewal date unavailable";
  const days = (Date.parse(dueOn) - Date.parse(today)) / 86400000;
  return days < 0 ? `Renewal overdue · ${dueOn}` : days <= 30 ? `Renewal due soon · ${dueOn}` : `Renewal due ${dueOn}`;
}
