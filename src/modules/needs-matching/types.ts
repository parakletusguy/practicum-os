// System B: Human Needs to Services Taxonomy & Types

export type NeedCategoryType =
  | "ELDERLY_CARE"
  | "DISABILITY_SUPPORT"
  | "CHILD_FAMILY_WELFARE"
  | "PSYCHOSOCIAL_SUPPORT"
  | "HOME_CARE_CLEANING"
  | "COMMUNITY_PROGRAMMES"
  | "OTHER";

export type UrgencyLevelType = "LOW" | "STANDARD" | "URGENT" | "CRITICAL";

export interface NeedCategoryMeta {
  id: NeedCategoryType;
  label: string;
  description: string;
  keywords: string[];
  requiresSupervisionTier: "DIRECT" | "GENERAL" | "ANY";
  colorBadge: string;
}

export const NEED_CATEGORIES_CATALOG: Record<NeedCategoryType, NeedCategoryMeta> = {
  ELDERLY_CARE: {
    id: "ELDERLY_CARE",
    label: "Elderly Care & Geriatric Support",
    description: "Companionship, daily living assistance, dementia support, and elder welfare visits.",
    keywords: ["elder", "geriatric", "senior", "dementia", "mobility", "pensioner"],
    requiresSupervisionTier: "GENERAL",
    colorBadge: "bg-blue-100 text-blue-800 border-blue-200",
  },
  DISABILITY_SUPPORT: {
    id: "DISABILITY_SUPPORT",
    label: "Disability & Inclusion Support",
    description: "Assistive technology navigation, independent living coaching, and accessibility advocacy.",
    keywords: ["disability", "special needs", "accessibility", "autism", "cerebral palsy", "mobility"],
    requiresSupervisionTier: "GENERAL",
    colorBadge: "bg-purple-100 text-purple-800 border-purple-200",
  },
  CHILD_FAMILY_WELFARE: {
    id: "CHILD_FAMILY_WELFARE",
    label: "Child & Family Welfare",
    description: "Family mediation, child protection support, foster care assistance, and nutritional guidance.",
    keywords: ["child", "family", "parenting", "youth", "protection", "orphanage", "foster"],
    requiresSupervisionTier: "DIRECT",
    colorBadge: "bg-rose-100 text-rose-800 border-rose-200",
  },
  PSYCHOSOCIAL_SUPPORT: {
    id: "PSYCHOSOCIAL_SUPPORT",
    label: "Psychosocial Counseling & Mental Health",
    description: "Grief counseling, trauma recovery, substance dependency support, and emotional well-being.",
    keywords: ["trauma", "depression", "anxiety", "grief", "mental health", "counseling", "therapy"],
    requiresSupervisionTier: "DIRECT",
    colorBadge: "bg-amber-100 text-amber-800 border-amber-200",
  },
  HOME_CARE_CLEANING: {
    id: "HOME_CARE_CLEANING",
    label: "Home Care & Daily Living Assistance",
    description: "Convalescent recovery care, respite relief, light housekeeping, and medication reminders.",
    keywords: ["home care", "respite", "convalescent", "hygiene", "meal prep"],
    requiresSupervisionTier: "GENERAL",
    colorBadge: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  COMMUNITY_PROGRAMMES: {
    id: "COMMUNITY_PROGRAMMES",
    label: "Community & NGO Welfare Initiatives",
    description: "Food bank access, vocational empowerment, legal aid referral, and refugee/displaced support.",
    keywords: ["ngo", "outreach", "community", "food bank", "shelter", "vocational", "empowerment"],
    requiresSupervisionTier: "ANY",
    colorBadge: "bg-teal-100 text-teal-800 border-teal-200",
  },
  OTHER: {
    id: "OTHER",
    label: "General Social Services Inquiry",
    description: "Unspecified social support inquiries requiring assessment by a certified intake social worker.",
    keywords: ["general", "consultation", "assessment"],
    requiresSupervisionTier: "GENERAL",
    colorBadge: "bg-slate-100 text-slate-800 border-slate-200",
  },
};

export interface MatchScoreResult {
  targetId: string;
  targetType: "ORGANISATION" | "SERVICE_PROVIDER" | "STUDENT_ALLOCATION";
  name: string;
  headlineOrOrgType: string;
  score: number; // 0 to 100
  matchedKeywords: string[];
  locationMatch: boolean;
  verificationBadge: string;
}

export function generateDeidentifiedCaseToken(): string {
  const year = new Date().getFullYear();
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `CASE-${year}-${randomChars}-${randomNum}`;
}

export function sanitizeTextForPII(text: string): { sanitized: string; redactedCount: number } {
  let redactedCount = 0;
  // Redact emails
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  let sanitized = text.replace(emailRegex, () => {
    redactedCount++;
    return "[REDACTED_EMAIL]";
  });

  // Redact Nigerian/International phone numbers (10 to 14 digits)
  const phoneRegex = /(\+?\d{1,4}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
  sanitized = sanitized.replace(phoneRegex, (match) => {
    if (match.trim().length >= 8) {
      redactedCount++;
      return "[REDACTED_PHONE]";
    }
    return match;
  });

  return { sanitized, redactedCount };
}
