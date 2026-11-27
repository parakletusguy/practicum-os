import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { accreditationDueDate, renewalLabel } from "../../src/modules/placement-matching/accreditation";
import { learningContractVersion } from "../../src/modules/placement-matching/contract-version";
import { assemblePortfolioEvidence, readPortfolioEvidence } from "../../src/modules/grading/portfolio-evidence";

describe("contract revisions", () => {
  it("preserves earlier version hashes and requires fresh signatures for every amendment", () => {
    const document = {
      terms: ["Term"], signers: { student: "1", field: "2", faculty: "3" }, host: "agency",
      postedAt: new Date("2026-10-01"),
    };
    expect(learningContractVersion(document)).toBe(createHash("sha256").update(JSON.stringify(document)).digest("hex"));
    expect(learningContractVersion(document, "second")).not.toBe(learningContractVersion(document, "first"));
  });
});

describe("accreditation renewal", () => {
  it("accepts legacy settings and distinguishes overdue, upcoming, and later dates", () => {
    expect(accreditationDueDate({ color: "blue" })).toBeNull();
    expect(accreditationDueDate({ accreditation: { renewalDueOn: "2026-02-30" } })).toBeNull();
    expect(accreditationDueDate({ accreditation: { renewalDueOn: "2026-12-01" } })).toBe("2026-12-01");
    expect(renewalLabel("2026-11-26", "2026-11-27")).toContain("overdue");
    expect(renewalLabel("2026-12-01", "2026-11-27")).toContain("due soon");
    expect(renewalLabel("2027-02-01", "2026-11-27")).not.toContain("soon");
  });
});

describe("portfolio evidence", () => {
  const entry = {
    id: "entry", allocationId: "allocation", activityTitle: "Community session", eventDate: new Date("2026-10-01"),
    verifiedMinutes: 90, evidenceSanitized: true, evidenceUrl: "allocation/note.pdf",
  };

  it("stores a stable snapshot without exposing a private storage path", () => {
    const snapshot = assemblePortfolioEvidence(["entry", "entry"], ["entry"], [entry]);
    expect(snapshot).toEqual([{ id: "entry", title: entry.activityTitle, date: "2026-10-01", minutes: 90, includeAttachment: true }]);
    expect(readPortfolioEvidence(snapshot)).toEqual(snapshot);
    expect(readPortfolioEvidence(undefined)).toEqual([]);
  });

  it("rejects unknown entries and attachment selections that are unsafe or detached from the entry", () => {
    expect(() => assemblePortfolioEvidence(["other-allocation"], [], [entry])).toThrow("verified entries");
    expect(() => assemblePortfolioEvidence([], ["entry"], [entry])).toThrow("each attachment");
    expect(() => assemblePortfolioEvidence(["entry"], ["entry"], [{ ...entry, evidenceUrl: "https://example.test/note.pdf" }])).toThrow("approved attachments");
    expect(() => assemblePortfolioEvidence(["entry"], ["entry"], [{ ...entry, evidenceUrl: "allocation/nested/note.pdf" }])).toThrow("approved attachments");
    expect(() => assemblePortfolioEvidence(["entry"], ["entry"], [{ ...entry, evidenceSanitized: false }])).toThrow("approved attachments");
  });
});
