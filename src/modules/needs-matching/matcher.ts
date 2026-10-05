// Semantic Need-to-Solution Matchmaking Engine

import { prisma } from "@/lib/db";
import { 
  NeedCategoryType, 
  NEED_CATEGORIES_CATALOG, 
  MatchScoreResult 
} from "./types";

export interface NeedMatcherInput {
  category: NeedCategoryType;
  title: string;
  description: string;
  locationCity?: string | null;
}

export async function computeServiceMatches(input: NeedMatcherInput): Promise<MatchScoreResult[]> {
  const meta = NEED_CATEGORIES_CATALOG[input.category] || NEED_CATEGORIES_CATALOG.OTHER;
  const searchTerms = [
    ...meta.keywords,
    input.category.toLowerCase().replace(/_/g, " "),
    ...(input.title.toLowerCase().split(/\s+/).filter(w => w.length > 3)),
  ];

  const results: MatchScoreResult[] = [];

  // 1. Match against Accredited Organisations & Agencies
  const organisations = await prisma.organisation.findMany({
    where: {
      orgType: {
        in: ["NGO", "HOSPITAL", "CLINIC", "WELFARE_AGENCY", "COMMUNITY_CENTRE"],
      },
      verificationStatus: "VERIFIED",
    },
    include: {
      placementOffers: true,
    },
    take: 15,
  });

  for (const org of organisations) {
    let score = 30; // base score for verified accreditation
    const matchedKeywords: string[] = [];
    const orgText = `${org.name} ${org.address || ""} ${org.city || ""}`.toLowerCase();

    // Check practice areas in offers
    const allPracticeAreas = org.placementOffers.flatMap(p => p.practiceAreas.map(a => a.toLowerCase()));
    
    for (const term of searchTerms) {
      if (orgText.includes(term) || allPracticeAreas.some(area => area.includes(term))) {
        score += 15;
        if (!matchedKeywords.includes(term)) matchedKeywords.push(term);
      }
    }

    const locationMatch = Boolean(
      input.locationCity && 
      org.city && 
      org.city.toLowerCase().includes(input.locationCity.toLowerCase())
    );

    if (locationMatch) {
      score += 20;
    }

    if (score > 35) {
      results.push({
        targetId: org.id,
        targetType: "ORGANISATION",
        name: org.name,
        headlineOrOrgType: `${org.orgType.replace(/_/g, " ")} • Verified Institution`,
        score: Math.min(score, 98),
        matchedKeywords: matchedKeywords.slice(0, 4),
        locationMatch,
        verificationBadge: "Accredited Agency",
      });
    }
  }

  // 2. Match against Verified Service Providers
  const providers = await prisma.serviceProvider.findMany({
    where: {
      verifiedStatus: "VERIFIED",
    },
    include: {
      person: true,
    },
    take: 15,
  });

  for (const prov of providers) {
    let score = 35; // base score for verified practitioner
    const matchedKeywords: string[] = [];
    const providerText = `${prov.headline} ${prov.bio} ${prov.skills.join(" ")}`.toLowerCase();

    for (const term of searchTerms) {
      if (providerText.includes(term) || prov.skills.some(s => s.toLowerCase().includes(term))) {
        score += 18;
        if (!matchedKeywords.includes(term)) matchedKeywords.push(term);
      }
    }

    if (score > 40) {
      results.push({
        targetId: prov.id,
        targetType: "SERVICE_PROVIDER",
        name: `${prov.person.firstName} ${prov.person.lastName}`,
        headlineOrOrgType: prov.headline,
        score: Math.min(score, 99),
        matchedKeywords: matchedKeywords.slice(0, 4),
        locationMatch: false,
        verificationBadge: "Verified Practitioner",
      });
    }
  }

  // 3. Match against Active Supervised Student Allocations
  const activeAllocations = await prisma.placementAllocation.findMany({
    where: {
      status: "ACTIVE",
    },
    include: {
      studentPerson: true,
      hostOrg: true,
      cohortStudent: true,
    },
    take: 10,
  });

  for (const alloc of activeAllocations) {
    let score = 25;
    const matchedKeywords: string[] = [];
    const studentSpecialty = (alloc.cohortStudent.specialty || "").toLowerCase();
    const studentLocation = (alloc.cohortStudent.locationPref || "").toLowerCase();

    for (const term of searchTerms) {
      if (studentSpecialty.includes(term)) {
        score += 20;
        if (!matchedKeywords.includes(term)) matchedKeywords.push(term);
      }
    }

    const locationMatch = Boolean(
      input.locationCity && (
        (alloc.hostOrg.city && alloc.hostOrg.city.toLowerCase().includes(input.locationCity.toLowerCase())) ||
        (studentLocation && studentLocation.includes(input.locationCity.toLowerCase()))
      )
    );

    if (locationMatch) {
      score += 15;
    }

    // Only junior trainees if not requiring direct supervision or if under verified host
    if (score > 35) {
      results.push({
        targetId: alloc.id,
        targetType: "STUDENT_ALLOCATION",
        name: `${alloc.studentPerson.firstName} ${alloc.studentPerson.lastName} (Supervised Trainee)`,
        headlineOrOrgType: `Trainee at ${alloc.hostOrg.name} (${alloc.cohortStudent.specialty || "General"})`,
        score: Math.min(score, 92),
        matchedKeywords: matchedKeywords.slice(0, 4),
        locationMatch,
        verificationBadge: "Supervised Trainee",
      });
    }
  }

  // Sort descending by score
  return results.sort((a, b) => b.score - a.score);
}
