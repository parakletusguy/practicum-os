import { describe, expect, it } from "vitest";
import { CycleStatus } from "@prisma/client";
import { canTransitionCycle } from "../../src/modules/practicum-core/workflow-policy";

describe("practicum cycle transitions", () => {
  it("permits the defined forward lifecycle", () => {
    expect(canTransitionCycle(CycleStatus.PLANNING, CycleStatus.CAPACITY_OPEN)).toBe(true);
    expect(canTransitionCycle(CycleStatus.CAPACITY_OPEN, CycleStatus.MATCHING)).toBe(true);
    expect(canTransitionCycle(CycleStatus.MATCHING, CycleStatus.ACTIVE)).toBe(true);
    expect(canTransitionCycle(CycleStatus.ACTIVE, CycleStatus.ASSESSMENT)).toBe(true);
    expect(canTransitionCycle(CycleStatus.ASSESSMENT, CycleStatus.GRADING)).toBe(true);
    expect(canTransitionCycle(CycleStatus.GRADING, CycleStatus.ARCHIVED)).toBe(true);
  });

  it("rejects skipped and reversed transitions", () => {
    expect(canTransitionCycle(CycleStatus.PLANNING, CycleStatus.ACTIVE)).toBe(false);
    expect(canTransitionCycle(CycleStatus.GRADING, CycleStatus.ASSESSMENT)).toBe(false);
    expect(canTransitionCycle(CycleStatus.ARCHIVED, CycleStatus.ACTIVE)).toBe(false);
  });
});
