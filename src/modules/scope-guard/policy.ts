// ScopeGuard Clinical Practice Safety Policy Governor
import { PracticeScopeLevel } from "@prisma/client";

export interface ScopeGuardRule {
  activity: string;
  allowedScope: PracticeScopeLevel;
  highRisk: boolean;
  rationale: string;
}

export const DEFAULT_SCOPEGUARD_RULES: ScopeGuardRule[] = [
  {
    activity: "Unaccompanied High-Risk Home Visit",
    allowedScope: "DIRECT_SUPERVISION",
    highRisk: true,
    rationale: "Safety protocol: Trainees must never conduct initial or crisis home visits alone.",
  },
  {
    activity: "Court Representation / Statutory Deposition",
    allowedScope: "DIRECT_SUPERVISION",
    highRisk: true,
    rationale: "Legal safeguarding: Court evidence mandates certified practitioner accompaniment.",
  },
  {
    activity: "Child Removal / Emergency Protective Custody",
    allowedScope: "DIRECT_SUPERVISION",
    highRisk: true,
    rationale: "Statutory restriction: Trainees cannot act as primary agent in protective removals.",
  },
  {
    activity: "Acute Psychiatric Crisis Intervention",
    allowedScope: "DIRECT_SUPERVISION",
    highRisk: true,
    rationale: "Clinical safety: High volatility requires licensed clinical supervision.",
  },
  {
    activity: "Case Conference / Inter-Agency Meeting",
    allowedScope: "CO_PRACTICE",
    highRisk: false,
    rationale: "Collaborative practice: Trainee can actively participate under agency supervision.",
  },
  {
    activity: "Community Sensitization & Outreach",
    allowedScope: "CO_PRACTICE",
    highRisk: false,
    rationale: "Community work: Group facilitator guidance recommended.",
  },
  {
    activity: "Routine Intake & Client Developmental History",
    allowedScope: "INDEPENDENT",
    highRisk: false,
    rationale: "Permitted independent activity after initial orientation.",
  },
  {
    activity: "Case Documentation & Service Referral Logging",
    allowedScope: "INDEPENDENT",
    highRisk: false,
    rationale: "Standard administrative and practice documentation.",
  },
];

export function evaluateScopeGuard(
  activityTitle: string,
  category: string,
  requestedScope: PracticeScopeLevel
): { allowed: boolean; violationSeverity?: "LOW" | "MEDIUM" | "HIGH"; rule?: ScopeGuardRule } {
  const normalizedTitle = activityTitle.toLowerCase();

  const matchedRule = DEFAULT_SCOPEGUARD_RULES.find((r) =>
    normalizedTitle.includes(r.activity.toLowerCase()) ||
    r.activity.toLowerCase().includes(normalizedTitle)
  );

  if (!matchedRule) {
    return { allowed: true };
  }

  // Check if requested scope is more lenient than allowed scope
  const scopeRanks: Record<PracticeScopeLevel, number> = {
    DIRECT_SUPERVISION: 3,
    CO_PRACTICE: 2,
    INDEPENDENT: 1,
  };

  const requestedRank = scopeRanks[requestedScope];
  const requiredRank = scopeRanks[matchedRule.allowedScope];

  if (requestedRank < requiredRank) {
    return {
      allowed: false,
      violationSeverity: matchedRule.highRisk ? "HIGH" : "MEDIUM",
      rule: matchedRule,
    };
  }

  return { allowed: true, rule: matchedRule };
}
