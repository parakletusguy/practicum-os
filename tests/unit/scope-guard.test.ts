import { describe, expect, it } from "vitest";
import { evaluateScopeGuard } from "../../src/modules/scope-guard/policy";

describe("ScopeGuard", () => {
  it("blocks a high-risk home visit logged below direct supervision", () => {
    const result = evaluateScopeGuard(
      "Unaccompanied High-Risk Home Visit",
      "HOME_VISIT",
      "INDEPENDENT",
    );

    expect(result).toMatchObject({
      allowed: false,
      violationSeverity: "HIGH",
      rule: { allowedScope: "DIRECT_SUPERVISION" },
    });
  });

  it("permits that activity when it is directly supervised", () => {
    expect(
      evaluateScopeGuard(
        "Unaccompanied High-Risk Home Visit",
        "HOME_VISIT",
        "DIRECT_SUPERVISION",
      ).allowed,
    ).toBe(true);
  });

  it("does not block an activity that has no configured rule", () => {
    expect(evaluateScopeGuard("Routine filing", "ADMIN", "INDEPENDENT")).toEqual({ allowed: true });
  });
});
