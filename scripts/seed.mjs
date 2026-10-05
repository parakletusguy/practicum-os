// PracticumOS Master Database Seeder
// Seeds PostgreSQL 17 on Supabase with initial Multi-Tenant Institutional Data

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting PracticumOS database seeding...");

  // 1. Clear existing seed data if any (idempotent clean)
  try {
    await prisma.auditLog.deleteMany({});
    await prisma.earlyWarningAlert.deleteMany({});
    await prisma.supervisionVisit.deleteMany({});
    await prisma.practiceEvent.deleteMany({});
    await prisma.cohortGrade.deleteMany({});
    await prisma.assessmentSubmission.deleteMany({});
    await prisma.placementAllocation.deleteMany({});
    await prisma.placementOffer.deleteMany({});
    await prisma.cohortStudent.deleteMany({});
    await prisma.practicumCycle.deleteMany({});
    await prisma.programme.deleteMany({});
    await prisma.department.deleteMany({});
    await prisma.orgMembership.deleteMany({});
    await prisma.organisation.deleteMany({});
    await prisma.person.deleteMany({});
  } catch (e) {
    console.log("Clean-up note:", e.message);
  }

  // 2. Create Universal Persons
  console.log("👤 Creating Universal Persons...");
  const coordinator = await prisma.person.create({
    data: {
      firstName: "Adebayo",
      lastName: "Ogunlesi",
      email: "a.ogunlesi@unilag.edu.ng",
      phone: "+2348023456789",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    },
  });

  const facultySupervisor = await prisma.person.create({
    data: {
      firstName: "Folashade",
      lastName: "Adeleke",
      email: "f.adeleke@unilag.edu.ng",
      phone: "+2348034567890",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    },
  });

  const fieldSupervisor = await prisma.person.create({
    data: {
      firstName: "Ngozi",
      lastName: "Okonkwo",
      email: "ngozi.okonkwo@lagossocial.gov.ng",
      phone: "+2348045678901",
      avatarUrl: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=150",
    },
  });

  const studentEze = await prisma.person.create({
    data: {
      firstName: "Chukwuemeka",
      lastName: "Eze",
      email: "c.eze@student.unilag.edu.ng",
      phone: "+2348056789012",
      avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150",
    },
  });

  const studentAmina = await prisma.person.create({
    data: {
      firstName: "Amina",
      lastName: "Bello",
      email: "a.bello@student.unilag.edu.ng",
      phone: "+2348067890123",
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
    },
  });

  const studentDavid = await prisma.person.create({
    data: {
      firstName: "David",
      lastName: "Alabi",
      email: "d.alabi@student.unilag.edu.ng",
      phone: "+2348078901234",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    },
  });

  // 3. Create Root Tenant: University of Lagos (UNILAG)
  console.log("🏛️ Creating University Institution Tenant...");
  const university = await prisma.organisation.create({
    data: {
      name: "University of Lagos (UNILAG)",
      slug: "unilag",
      orgType: "UNIVERSITY",
      verificationStatus: "VERIFIED",
      email: "info@unilag.edu.ng",
      phone: "+23412802438",
      address: "University Road, Akoka, Yaba",
      city: "Lagos",
      country: "Nigeria",
      branding: {
        primaryColor: "#15803d",
        secondaryColor: "#0f172a",
        motto: "In Deed and in Truth",
        logoUrl: "/unilag-logo.png",
      },
    },
  });

  // 4. Create Placement Partner Agencies
  console.log("🏢 Creating Placement Partner Agencies...");
  const lagosGovAgency = await prisma.organisation.create({
    data: {
      name: "Lagos State Ministry of Youth & Social Development",
      slug: "lagos-social-dev",
      orgType: "MINISTRY",
      verificationStatus: "VERIFIED",
      email: "contact@lagossocial.gov.ng",
      phone: "+23412345678",
      address: "Block 18, The Secretariat, Alausa, Ikeja",
      city: "Lagos",
      country: "Nigeria",
    },
  });

  const hopeChildCare = await prisma.organisation.create({
    data: {
      name: "Hope Child & Family Care Foundation",
      slug: "hope-childcare",
      orgType: "NGO",
      verificationStatus: "VERIFIED",
      email: "support@hopechildcare.org",
      phone: "+2348099887766",
      address: "14 Adeola Odeku St, Victoria Island",
      city: "Lagos",
      country: "Nigeria",
    },
  });

  // 5. Establish Department & Programme
  console.log("📚 Creating Department & Programme...");
  const dept = await prisma.department.create({
    data: {
      organisationId: university.id,
      name: "Department of Social Work",
      code: "SWK",
    },
  });

  const programme = await prisma.programme.create({
    data: {
      departmentId: dept.id,
      name: "Bachelor of Science in Social Work",
      code: "B.Sc SWK",
      degreeLevel: "Undergraduate",
    },
  });

  // 6. Role Memberships
  console.log("🛡️ Assigning Contextual Role Memberships...");
  await prisma.orgMembership.createMany({
    data: [
      { personId: coordinator.id, organisationId: university.id, role: "COORDINATOR" },
      { personId: coordinator.id, organisationId: university.id, role: "INSTITUTION_ADMIN" },
      { personId: facultySupervisor.id, organisationId: university.id, role: "ACADEMIC_SUPERVISOR" },
      { personId: fieldSupervisor.id, organisationId: lagosGovAgency.id, role: "FIELD_SUPERVISOR" },
      { personId: studentEze.id, organisationId: university.id, role: "STUDENT" },
      { personId: studentAmina.id, organisationId: university.id, role: "STUDENT" },
      { personId: studentDavid.id, organisationId: university.id, role: "STUDENT" },
    ],
  });

  // 7. Practicum Cycle Configuration
  console.log("🔄 Configuring Practicum Cycle...");
  const cycle = await prisma.practicumCycle.create({
    data: {
      tenantId: university.id,
      programmeId: programme.id,
      name: "2026/2027 Social Work Field Practicum II",
      academicYear: "2026/2027",
      durationType: "SEMESTER",
      requiredHours: 400,
      startDate: new Date("2026-09-01"),
      endDate: new Date("2027-01-30"),
      status: "ACTIVE",
      eGuideConfig: {
        welcomeMessage: "Welcome to the 2026/2027 Senior Field Practicum. Practice with integrity, compassion, and professional adherence to NASW/IFSW Codes of Ethics.",
        clinicalHurdles: ["Mandatory child protection safety briefing", "Midpoint supervision sign-off"],
        weeklyTargetHours: 25,
      },
      scopeGuardRules: [
        { activity: "Unaccompanied High-Risk Home Visit", allowedScope: "DIRECT_SUPERVISION" },
        { activity: "Court Representation / Evidence Deposition", allowedScope: "DIRECT_SUPERVISION" },
        { activity: "Routine Case File Review & Client Intake", allowedScope: "INDEPENDENT" },
        { activity: "Community Sensitization & Outreach", allowedScope: "CO_PRACTICE" },
      ],
      gradingFormula: {
        components: [
          { name: "Field Supervisor Evaluation", weight: 0.40 },
          { name: "Academic Supervisor Visit & Review", weight: 0.30 },
          { name: "Verified E-Logbook & Hours Completion", weight: 0.20 },
          { name: "Comprehensive Reflective Report", weight: 0.10 },
        ],
        gradeScale: {
          A: [70, 100],
          B: [60, 69.9],
          C: [50, 59.9],
          D: [45, 49.9],
          F: [0, 44.9],
        },
      },
    },
  });

  // 8. Cohort Students
  console.log("🎓 Enrolling Cohort Students...");
  const cohortEze = await prisma.cohortStudent.create({
    data: {
      cycleId: cycle.id,
      personId: studentEze.id,
      matricNumber: "190408012",
      level: "400L",
      specialty: "Child & Family Welfare",
      locationPref: "Ikeja / Mainland",
      status: "PLACED",
    },
  });

  const cohortAmina = await prisma.cohortStudent.create({
    data: {
      cycleId: cycle.id,
      personId: studentAmina.id,
      matricNumber: "190408025",
      level: "400L",
      specialty: "Medical & Psychiatric Social Work",
      locationPref: "Yaba / Surulere",
      status: "ENROLLED",
    },
  });

  const cohortDavid = await prisma.cohortStudent.create({
    data: {
      cycleId: cycle.id,
      personId: studentDavid.id,
      matricNumber: "190408041",
      level: "400L",
      specialty: "Community Development",
      locationPref: "Victoria Island / Lekki",
      status: "PLACED",
    },
  });

  // 9. Placement Offers
  console.log("📋 Registering Placement Offers...");
  const offerLagosGov = await prisma.placementOffer.create({
    data: {
      cycleId: cycle.id,
      hostOrgId: lagosGovAgency.id,
      totalSlots: 6,
      availableSlots: 4,
      practiceAreas: ["Child Welfare", "Juvenile Rehabilitation", "Family Reconciliation"],
      contactPerson: "Mrs. Ngozi Okonkwo",
      contactPhone: "+2348045678901",
      status: "CONFIRMED",
    },
  });

  const offerHopeChild = await prisma.placementOffer.create({
    data: {
      cycleId: cycle.id,
      hostOrgId: hopeChildCare.id,
      totalSlots: 4,
      availableSlots: 3,
      practiceAreas: ["Foster Care", "Psychosocial Support"],
      contactPerson: "Mr. Tunde Lawal",
      contactPhone: "+2348099887766",
      status: "CONFIRMED",
    },
  });

  // 10. Placement Allocations
  console.log("📌 Allocating Students to Placements...");
  const allocEze = await prisma.placementAllocation.create({
    data: {
      cycleId: cycle.id,
      cohortStudentId: cohortEze.id,
      studentPersonId: studentEze.id,
      hostOrgId: lagosGovAgency.id,
      placementOfferId: offerLagosGov.id,
      fieldSupervisorId: fieldSupervisor.id,
      academicSupervisorId: facultySupervisor.id,
      status: "ACTIVE",
      postingLetterRef: "UNILAG/SWK/2026/PL-048",
      postedAt: new Date("2026-08-25"),
      startedAt: new Date("2026-09-01"),
    },
  });

  const allocDavid = await prisma.placementAllocation.create({
    data: {
      cycleId: cycle.id,
      cohortStudentId: cohortDavid.id,
      studentPersonId: studentDavid.id,
      hostOrgId: hopeChildCare.id,
      placementOfferId: offerHopeChild.id,
      academicSupervisorId: facultySupervisor.id,
      status: "ACTIVE",
      postingLetterRef: "UNILAG/SWK/2026/PL-049",
      postedAt: new Date("2026-08-25"),
      startedAt: new Date("2026-09-01"),
    },
  });

  // 11. Practice Events (E-Logbook Entries with ScopeGuard & Checksums)
  console.log("📖 Logging Practice Events...");
  await prisma.practiceEvent.create({
    data: {
      allocationId: allocEze.id,
      eventDate: new Date("2026-09-08"),
      startTime: "08:30",
      endTime: "16:00",
      verifiedMinutes: 450, // 7.5 hrs
      category: "DIRECT_CLIENT",
      clientRef: "CASE-2026-CFW-092",
      activityTitle: "Intake Assessment of Abandoned Minor",
      activityDescription: "Assisted senior case officer in conducting an initial trauma-informed intake interview with a 9-year-old child referred by community leaders. Documented developmental background and observed non-verbal cues.",
      criticalReflection: "Observed the importance of non-coercive questioning. I initially felt an impulse to prompt answers, but my supervisor modeled patient silence, allowing the child to feel safe enough to open up.",
      competenciesTagged: ["EPAS-1: Ethical & Professional Behavior", "EPAS-6: Engage with Individuals"],
      scopeLevel: "CO_PRACTICE",
      verificationStatus: "VERIFIED",
      supervisorNotes: "Demonstrated exceptional active listening and respectful posture with the young client.",
      verifiedAt: new Date("2026-09-09"),
      tamperChecksum: "sha256-a78b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f",
    },
  });

  await prisma.practiceEvent.create({
    data: {
      allocationId: allocEze.id,
      eventDate: new Date("2026-09-12"),
      startTime: "09:00",
      endTime: "15:30",
      verifiedMinutes: 390, // 6.5 hrs
      category: "COMMUNITY_OUTREACH",
      clientRef: "COMM-WARD-04",
      activityTitle: "Community Dialogue on Child Truancy and Labor",
      activityDescription: "Co-facilitated a focus group with 18 market mothers and local youth leaders discussing socioeconomic drivers of child school dropouts.",
      criticalReflection: "Discovered that economic hardship rather than parental neglect was the primary catalyst. Interventions must prioritize micro-enterprise grants alongside counseling.",
      competenciesTagged: ["EPAS-3: Advance Human Rights & Justice", "EPAS-8: Intervene with Communities"],
      scopeLevel: "INDEPENDENT",
      verificationStatus: "VERIFIED",
      supervisorNotes: "Well-articulated reflection. Excellent engagement with the community representatives.",
      verifiedAt: new Date("2026-09-13"),
      tamperChecksum: "sha256-f1e2d3c4b5a6978876543210fedcba9876543210abcdef12",
    },
  });

  await prisma.practiceEvent.create({
    data: {
      allocationId: allocEze.id,
      eventDate: new Date("2026-09-19"),
      startTime: "08:30",
      endTime: "14:30",
      verifiedMinutes: 360, // 6.0 hrs
      category: "CASE_CONFERENCE",
      clientRef: "CASE-2026-CFW-092",
      activityTitle: "Multi-Disciplinary Case Conference on Foster Placement",
      activityDescription: "Attended inter-agency review meeting comprising child welfare officers, pediatric doctor, and school principal to plan foster family transition.",
      criticalReflection: "Learned how different professional vocabularies can cause friction. Social work plays a crucial role in synthesizing medical and psychosocial data into a holistic care plan.",
      competenciesTagged: ["EPAS-4: Practice-Informed Research", "EPAS-7: Assess Individuals & Families"],
      scopeLevel: "CO_PRACTICE",
      verificationStatus: "PENDING",
      tamperChecksum: "sha256-99887766554433221100aabbccddeeff0011223344556677",
    },
  });

  // 12. Supervision Visit
  console.log("🚗 Logging Academic Supervision Visit...");
  await prisma.supervisionVisit.create({
    data: {
      allocationId: allocEze.id,
      supervisorPersonId: facultySupervisor.id,
      visitDate: new Date("2026-09-15"),
      visitType: "PHYSICAL_ON_SITE",
      generalObservations: "Visited student at the Ikeja Social Welfare office. Observed student in case review meeting with Mrs. Okonkwo. Student displayed high professional maturity and adherence to department code of conduct.",
      agencyFeedback: "Field supervisor commended student punctuality and genuine empathy in handling challenging family mediation cases.",
      actionItems: [
        "Complete 50% hours milestone by end of October",
        "Submit draft of Midpoint Reflective Report by Week 6",
      ],
      studentProgressRating: "SATISFACTORY",
      followUpRequired: false,
    },
  });

  // 13. Early Warning Alert
  console.log("⚠️ Registering Early Warning Alert...");
  await prisma.earlyWarningAlert.create({
    data: {
      allocationId: allocDavid.id,
      alertType: "HOURS_BEHIND_SCHEDULE",
      severity: "MEDIUM",
      title: "Practicum Hours Behind Projected Pace",
      description: "Student has logged 18 hours over 3 weeks against an expected trajectory of 60 hours. Recommending contact with host agency coordinator.",
      isResolved: false,
    },
  });

  // 15. System B: Verified Service Providers & Community Need Requests
  console.log("🤝 Seeding System B: Community Service Providers & Need Requests...");
  const providerPerson = await prisma.person.create({
    data: {
      firstName: "Grace",
      lastName: "Nwosu",
      email: "grace.nwosu@careproviders.ng",
      phone: "+2348099887766",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    },
  });

  await prisma.serviceProvider.create({
    data: {
      personId: providerPerson.id,
      headline: "Licensed Geriatric Social Worker & Elder Companion",
      bio: "Over 8 years experience supporting elderly community members with cognitive impairment, dementia, and physical mobility limitations in Lagos State.",
      skills: ["Elderly Care & Dementia", "Home Convalescent Care", "Psychosocial Counseling"],
      verifiedStatus: "VERIFIED",
      practicePassport: {
        yearsExperience: 8,
        primaryCity: "Lagos",
        verifiedCredentials: ["B.Sc Social Work", "Lagos State Social Welfare Board License"],
      },
    },
  });

  const seekerPerson = await prisma.person.create({
    data: {
      firstName: "Bolaji",
      lastName: "Kuti",
      email: "bolaji.kuti@community.ng",
      phone: "+2348011223344",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    },
  });

  await prisma.needRequest.create({
    data: {
      seekerPersonId: seekerPerson.id,
      category: "ELDERLY_CARE",
      title: "[CASE-2026-ELD-4819] Elderly Mother with Limited Mobility Requiring Bi-Weekly Care",
      description: "Looking for compassionate companion and medication oversight for our 78-year-old mother residing in Surulere, Lagos. Needs assistance with light physical therapy walks and meal companionship.",
      urgencyLevel: "STANDARD",
      locationCity: "Surulere, Lagos",
      status: "OPEN",
    },
  });

  await prisma.needRequest.create({
    data: {
      seekerPersonId: seekerPerson.id,
      category: "CHILD_FAMILY_WELFARE",
      title: "[CASE-2026-CHW-9201] Foster Family Mentorship & After-School Welfare Support",
      description: "Community family providing foster care to two adolescent siblings seeking weekly psychosocial counseling, educational guidance, and behavioral mentorship.",
      urgencyLevel: "URGENT",
      locationCity: "Yaba, Lagos",
      status: "MATCHED",
    },
  });

  console.log("✅ PracticumOS Master Seeding complete with System A & System B!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
