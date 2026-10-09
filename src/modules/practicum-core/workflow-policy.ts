import { CycleStatus } from "@prisma/client";

const ALLOWED_CYCLE_TRANSITIONS: Record<CycleStatus, CycleStatus[]> = {
  PLANNING: [CycleStatus.CAPACITY_OPEN],
  CAPACITY_OPEN: [CycleStatus.MATCHING],
  MATCHING: [CycleStatus.ACTIVE],
  ACTIVE: [CycleStatus.ASSESSMENT],
  ASSESSMENT: [CycleStatus.GRADING],
  GRADING: [CycleStatus.ARCHIVED],
  ARCHIVED: [],
};

export function canTransitionCycle(from: CycleStatus, to: CycleStatus): boolean {
  return ALLOWED_CYCLE_TRANSITIONS[from].includes(to);
}
