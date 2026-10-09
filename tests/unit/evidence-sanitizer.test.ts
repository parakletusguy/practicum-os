import { describe, expect, it } from "vitest";
import { generateEventChecksum, validateClientDeidentification } from "../../src/modules/evidence-vault/sanitizer";

const event = {
  allocationId: "allocation-1",
  eventDate: "2026-10-09",
  startTime: "09:00",
  endTime: "10:00",
  verifiedMinutes: 60,
  activityTitle: "Case notes",
  activityDescription: "De-identified practice record",
  criticalReflection: "Reviewed with supervisor",
};

describe("evidence safeguards", () => {
  it("rejects phone numbers as client references", () => {
    expect(validateClientDeidentification("+234 801 234 5678")).toMatchObject({
      valid: false,
      sanitizedRef: "REDACTED",
    });
  });

  it("normalizes a valid de-identified reference", () => {
    expect(validateClientDeidentification("case-42")).toEqual({
      valid: true,
      sanitizedRef: "CASE-42",
    });
  });

  it("makes event checksums deterministic and content-sensitive", () => {
    const original = generateEventChecksum(event);
    expect(generateEventChecksum(event)).toBe(original);
    expect(generateEventChecksum({ ...event, activityTitle: "Different activity" })).not.toBe(original);
  });
});
