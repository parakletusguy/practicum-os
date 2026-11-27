import { createHash } from "node:crypto";

export function learningContractVersion(document: {
  terms: string[]; signers: { student: string; field: string | null; faculty: string | null };
  host: string; postedAt: Date | null;
}, revisionId?: string) {
  const payload = revisionId ? { ...document, revisionId } : document;
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}
