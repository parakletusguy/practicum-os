import { describe, expect, it } from "vitest";
import { screenEvidenceFile } from "../../src/modules/evidence-vault/file-screening";

describe("evidence file screening", () => {
  it("rejects a renamed executable presented as a PDF", () => {
    expect(screenEvidenceFile(Buffer.from("MZ executable"), "application/pdf")).toContain("PDF header");
  });

  it("rejects personal data in plain-text evidence", () => {
    expect(screenEvidenceFile(Buffer.from("Call +234 801 234 5678"), "text/plain")).toContain("personal data");
  });

  it("accepts a correctly signed PNG", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    expect(screenEvidenceFile(png, "image/png")).toBeNull();
  });
});
