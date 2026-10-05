# PracticumOS: The Operating System for Practice, Care & Social Welfare

[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](https://github.com/parakletusguy/practicum-os)
[![Lifecycle Verification](https://img.shields.io/badge/Lifecycle%20Verification-30%2F30%20Steps%20Passed-blue)](file:///c:/Users/PARAKLETUS%20HUB/.gemini/PracticumOS/scripts/verify_30_step_lifecycle.mjs)
[![Next.js](https://img.shields.io/badge/Next.js-14.2%20App%20Router-black)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2017%20on%20Supabase-3178C6)](https://supabase.com)
[![Prisma ORM](https://img.shields.io/badge/ORM-Prisma%205.20-2D3748)](https://prisma.io)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205.6-3178C6)](https://typescriptlang.org)

---

## 📌 Table of Contents

- [1. Executive Summary & Vision](#1-executive-summary--vision)
- [2. Product Requirements Document (PRD)](#2-product-requirements-document-prd)
  - [2.1 Problem Statement](#21-problem-statement)
  - [2.2 Target Personas & Stakeholders](#22-target-personas--stakeholders)
  - [2.3 Core Value Propositions](#23-core-value-propositions)
- [3. The 30-Step End-to-End Practicum Lifecycle](#3-the-30-step-end-to-end-practicum-lifecycle)
- [4. Core Architectural Engines](#4-core-architectural-engines)
  - [4.1 ScopeGuard™ Clinical Safety Governor](#41-scopeguard-clinical-safety-governor)
  - [4.2 Tamper-Evident Evidence Vault](#42-tamper-evident-evidence-vault)
  - [4.3 Dual-Supervision & CSWE EPAS Rubrics](#43-dual-supervision--cswe-epas-rubrics)
  - [4.4 Dynamic Weighted Grading Engine & Transcript Seals](#44-dynamic-weighted-grading-engine--transcript-seals)
  - [4.5 Early Warning Risk Engine](#45-early-warning-risk-engine)
  - [4.6 System B: Community Welfare Need-Matching Portal](#46-system-b-community-welfare-need-matching-portal)
  - [4.7 Offline-First PWA Synchronization](#47-offline-first-pwa-synchronization)
- [5. Role-Based Portals & Routing Architecture](#5-role-based-portals--routing-architecture)
- [6. Data Model & Entity Architecture](#6-data-model--entity-architecture)
- [7. Tech Stack & Infrastructure](#7-tech-stack--infrastructure)
- [8. Getting Started & Development](#8-getting-started--development)
  - [8.1 Prerequisites](#81-prerequisites)
  - [8.2 Environment Configuration](#82-environment-configuration)
  - [8.3 Database Setup & Seeding](#83-database-setup--seeding)
  - [8.4 Running the E2E Verification Suite](#84-running-the-e2e-verification-suite)
  - [8.5 Local Server Execution](#85-local-server-execution)
- [9. Production Deployment](#9-production-deployment)

---

## 1. Executive Summary & Vision

**PracticumOS** is an enterprise-grade multi-tenant operating system designed for higher education institutions, teaching hospitals, welfare departments, and accredited social service agencies. It manages the entire lifecycle of professional field practicum placements—from cohort onboarding and algorithmic matching to clinical safety enforcement, dual-supervision sign-offs, dynamic weighted grading, and tamper-evident digital credentialing.

Additionally, PracticumOS bridges the academic world with real-world impact through **System B: Human Needs & Care Services**, an integrated civic matching gateway connecting vulnerable citizens and community welfare requests with vetted service providers and supervised student interns.

---

## 2. Product Requirements Document (PRD)

### 2.1 Problem Statement

Professional field education in healthcare, social work, and community welfare historically suffers from severe operational inefficiencies and compliance risks:
1. **Disjointed Placement Matching:** Coordinators manually match hundreds of students to field agencies using spreadsheets, leading to mismatched clinical specialties, geographical frictions, and unfilled agency capacity.
2. **Paper-Based & Fragile Logbooks:** Trainees maintain physical logbooks prone to falsification, retroactive completion, and lack of tamper-evidence.
3. **Clinical Boundary & Safety Violations:** Trainees frequently encounter high-risk situations (unaccompanied home visits, involuntary removals, acute psychiatric crises) without automated institutional safeguards.
4. **Supervisory Communication Silos:** Field supervisors (on-site) and faculty advisors (academic) operate without real-time synchronization, resulting in missed student warning signs and delayed interventions.
5. **Subjective & Delayed Grading:** Final practicum grades rely on non-standardized feedback, delayed paperwork, and manual calculation errors rather than competency-based metrics (e.g., CSWE EPAS).

### 2.2 Target Personas & Stakeholders

| Role | Responsibility | Primary Interface |
|---|---|---|
| **Practicum Director / Coordinator** | Manages practicum cycles, accredits agencies, executes algorithmic matching, oversees broadsheets, and issues official postings. | Institutional Admin Console (`/[tenant]/admin`) |
| **Field Agency Supervisor** | Direct on-site mentor. Verifies student daily practice logs, manages day-to-day caseload, and completes accredited rubric evaluations. | Field Supervisor Desk (`/[tenant]/field`) |
| **Faculty Academic Supervisor** | University lecturer. Conducts supervisory visits (physical/remote), triages early warnings, and conducts theoretical evaluations. | Academic Supervisor Portal (`/[tenant]/faculty`) |
| **Student Intern / Trainee** | Logs clinical hours, records critical reflections, tags EPAS competencies, and tracks progress towards graduation. | Student Practicum Portal (`/[tenant]/student`) |
| **Community Care Seeker / Citizen** | Submits human needs requests (elder care, disability support, psychosocial aid). | Community Gateway (`/gateways/help`) |
| **Accredited Service Provider** | Registers vetted social work, home-care, or outreach services to fulfill community requests. | Provider Portal (`/gateways/provider`) |

### 2.3 Core Value Propositions

- **Multi-Tenant Hierarchy:** Native isolation for universities, colleges, departments, and specific degree programmes.
- **ScopeGuard™ Safety Engine:** Real-time clinical safety policy governor intercepting high-risk student activities.
- **Cryptographic Audit Ledger:** Immutable event logs with SHA-256 tamper seals for practice events and transcript records.
- **Accredited 9-Competency Rubric:** Full synthesis of Council on Social Work Education (CSWE) EPAS competencies.
- **Offline-First Field Capability:** PWA Service Worker caching and local queue synchronization for remote fieldwork with unstable network access.

---

## 3. The 30-Step End-to-End Practicum Lifecycle

PracticumOS organizes the complete academic placement journey into six structured phases, verified end-to-end:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                           PRACTICUMOS 30-STEP END-TO-END LIFECYCLE                             │
├────────────────────┬────────────────────┬────────────────────┬─────────────────────────────────┤
│ Phase 1: Setup &   │ Phase 2: Matching  │ Phase 3: Practice  │ Phase 4: Supervision &          │
│ Cohort Ingestion   │ & Posting          │ & Evidence Vault   │ Early Warning                   │
│ (Steps 1–4)        │ (Steps 5–8)        │ (Steps 9–12)       │ (Steps 13–16)                   │
├────────────────────┼────────────────────┼────────────────────┼─────────────────────────────────┤
│ • Cycle Config     │ • Auto-Matching    │ • ScopeGuard Active│ • Dual Caseload Distribution    │
│ • Cohort Ingest    │ • Coordinator Alloc│ • Logbook Entry    │ • Academic Visit Logger         │
│ • Agency Accredit  │ • Posting Letter   │ • Sanitizer & Hash │ • Early Warning Risk Engine     │
│ • Capacity Slots   │ • E-Contract Sign  │ • Field Sign-Off   │ • Reflective Report Audit       │
└────────────────────┴────────────────────┴────────────────────┴─────────────────────────────────┘
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Phase 5: Assessment & Dynamic Grading   │ Phase 6: Results, Transcripts, Audit & System B      │
│ (Steps 17–24)                           │ (Steps 25–30)                                        │
├─────────────────────────────────────────┼──────────────────────────────────────────────────────┤
│ • Midpoint Formative Assessment         │ • Cohort Score Broadsheet Matrix                     │
│ • Final Portfolio Submission            │ • Official Letterhead Merging                        │
│ • Field Supervisor CSWE Rubric (40%)    │ • Digital Transcript Seal (SHA-256)                  │
│ • Academic Supervisor Rubric (30%)      │ • Immutable Cycle Archival                           │
│ • CSWE EPAS 9-Competency Synthesis      │ • Cryptographic Audit Ledger Commit                  │
│ • Dynamic Weighted Formula Engine       │ • System B: Community Need Intake & Match            │
│ • Institutional Letter Grade Mapping    │                                                      │
│ • Dual-Person Staff Grade Moderation    │                                                      │
└─────────────────────────────────────────┴──────────────────────────────────────────────────────┘
```

### Detailed Lifecycle Specification

| # | Step Name | Description | Verification Criteria |
|---|---|---|---|
| **01** | Cycle Configurator | Create cycle with required hours (e.g. 400h) and grading formula. | Valid `PracticumCycle` with active status. |
| **02** | Cohort Ingestion | Ingest student roster with matriculation numbers, levels, and location preferences. | Unique `CohortStudent` records enrolled. |
| **03** | Agency Accreditation | Verify field organizations (Hospitals, NGOs, Ministries) and compliance. | `Organisation` with `VERIFIED` accreditation. |
| **04** | Capacity Collection | Agencies declare available placement slots and clinical areas. | `PlacementOffer` slots tracked and validated. |
| **05** | Algorithmic Matching | Multi-factor matchmaking based on specialty, distance, and capacity. | Specialty compatibility match score generated. |
| **06** | Coordinator Allocation | Coordinator reviews proposed pairs and approves allocations. | `PlacementAllocation` created in `PROPOSED` state. |
| **07** | Posting Desk Dispatch | Official posting letter generated with unique dispatch reference. | `postingLetterRef` issued (e.g., `POS-2026-...`). |
| **08** | Learning Contract | Student reviews orientation guide and signs tripartite contract. | `PlacementAllocation` transitioned to `ACTIVE`. |
| **09** | ScopeGuard Activation | Student authorized to log hours under active safety boundary rules. | Safety governor online for cycle. |
| **10** | Practice Event Logging | Student records hours, category, activity description, and reflection. | Verified minutes recorded with metadata. |
| **11** | Evidence Vault Sanitizer | Automated de-identification of client PII and SHA-256 hash generation. | 64-char tamper checksum stored; PII redacted. |
| **12** | Field Verification Desk | Field supervisor signs off or queries logged practice event. | Status updated to `VERIFIED` with feedback notes. |
| **13** | Dual Caseload Routing | Placement linked simultaneously to field agency and academic faculty. | Dual supervisor foreign keys established. |
| **14** | Supervision Visit Logger | Academic advisor logs physical on-site or remote video supervisory visit. | `SupervisionVisit` rating and actions recorded. |
| **15** | Early Warning Engine | Automated background scan detects hours deficits, attendance flags, or risk. | `EarlyWarningAlert` created and triaged. |
| **16** | Reflective Report Check | Verification of structured periodic critical reflections. | Reflection length and quality audited. |
| **17** | Midpoint Evaluation | Formative midpoint assessment submission. | Midpoint criteria cleared. |
| **18** | Final Portfolio Submission | Trainee submits cumulative portfolio of practice evidence. | Final portfolio logged. |
| **19** | Field Supervisor Rubric | Evaluation across CSWE EPAS competencies (Default weight: 40%). | Rubric payload scored out of 100. |
| **20** | Academic Supervisor Rubric | Academic assessment of theoretical integration and ethics (Weight: 30%). | Academic rubric payload scored out of 100. |
| **21** | EPAS 9-Competency Synthesis | Automated competency synthesis across all 9 CSWE standards. | 9/9 competencies evaluated and radar mapped. |
| **22** | Weighted Formula Compute | Dynamic calculation: `(Field*0.4) + (Acad*0.3) + (Hours*0.2) + (Reports*0.1)`. | Composite percentage computed accurately. |
| **23** | Letter Grade Scale Mapping | Composite mapped to institutional grading scale (A, B, C, D, F). | Grade mapped according to tenant policy. |
| **24** | Staff Moderation Lock | Two-person moderation approval; grade permanently locked. | `isApproved=true` with moderation remarks. |
| **25** | Broadsheet Matrix | Cohort-wide results aggregation for exam board review. | Broadsheet table populated with all student grades. |
| **26** | Letterhead Template Merge | Dynamic injection of institutional crest, faculty, and department metadata. | Printable official letterhead merged. |
| **27** | Digital Transcript Seal | Cryptographic SHA-256 seal computed over student matric, grade, and cycle. | Tamper-evident verification seal generated. |
| **28** | Cycle Archival | Cycle locked as read-only for historical auditing and compliance. | Cycle transitioned to `ARCHIVED` status. |
| **29** | Cryptographic Audit Log | Immutable audit ledger commit tracking lifecycle closure. | `AuditLog` entry created with before/after state. |
| **30** | System B Need Intake | Community care request intake and semantic matching to service providers. | `NeedRequest` matched to qualified provider. |

---

## 4. Core Architectural Engines

### 4.1 ScopeGuard™ Clinical Safety Governor

The `ScopeGuard` engine ([policy.ts](file:///c:/Users/PARAKLETUS%20HUB/.gemini/PracticumOS/src/modules/scope-guard/policy.ts)) enforces clinical boundaries and student safety in real-time. When a student logs an activity, the engine analyzes the nature of the task and restricts unsupervised practice:

- **Prohibited Solo Activities:** Unaccompanied high-risk home visits, court representations, emergency protective custody removals, acute psychiatric crises.
- **Enforcement Levels:**
  - `DIRECT_SUPERVISION` (Rank 3)
  - `CO_PRACTICE` (Rank 2)
  - `INDEPENDENT` (Rank 1)
- If a trainee attempts to record an unauthorized solo activity, the governor flags the entry, warns the student, and triggers an early warning alert to the supervisor.

### 4.2 Tamper-Evident Evidence Vault

Located at [sanitizer.ts](file:///c:/Users/PARAKLETUS%20HUB/.gemini/PracticumOS/src/modules/evidence-vault/sanitizer.ts):
- **PII Scrubbing:** Automatically rejects phone numbers, raw national IDs, or un-sanitized client names. Generates standardized anonymized tokens (e.g., `CASE-ANON-4821`).
- **Cryptographic Event Hash:** Generates a SHA-256 content checksum covering:
  $$\text{Checksum} = \text{SHA256}(\text{AllocationID} \parallel \text{Date} \parallel \text{Times} \parallel \text{Hours} \parallel \text{Title} \parallel \text{Description} \parallel \text{Reflection})$$
  Ensures that once signed off by a supervisor, log entries cannot be retroactively manipulated without invalidating the seal.

### 4.3 Dual-Supervision & CSWE EPAS Rubrics

PracticumOS maps all field activities and evaluations against the Council on Social Work Education (CSWE) Educational Policy and Accreditation Standards (EPAS):
- **Competency 1:** Demonstrate Ethical and Professional Behavior
- **Competency 2:** Advance Human Rights and Social, Economic, and Environmental Justice
- **Competency 3:** Engage Anti-Racism, Diversity, Equity, and Inclusion (ADEI) in Practice
- **Competency 4:** Engage In Practice-informed Research and Research-informed Practice
- **Competency 5:** Engage in Policy Practice
- **Competency 6:** Engage with Individuals, Families, Groups, Organizations, and Communities
- **Competency 7:** Assess Individuals, Families, Groups, Organizations, and Communities
- **Competency 8:** Intervene with Individuals, Families, Groups, Organizations, and Communities
- **Competency 9:** Evaluate Practice with Individuals, Families, Groups, Organizations, and Communities

### 4.4 Dynamic Weighted Grading Engine & Transcript Seals

Implemented in [evaluator.ts](file:///c:/Users/PARAKLETUS%20HUB/.gemini/PracticumOS/src/modules/grading/evaluator.ts):
- **Configurable Formula:** Institutions can define custom component weights per cycle:
  $$\text{Composite Score} = (S_{\text{field}} \times W_{\text{field}}) + (S_{\text{academic}} \times W_{\text{academic}}) + (S_{\text{logbook}} \times W_{\text{logbook}}) + (S_{\text{reports}} \times W_{\text{reports}})$$
- **Default Weights:** Field Eval (40%), Academic Review (30%), Logbook Hours (20%), Reflective Reports (10%).
- **Digital Seal:** A permanent SHA-256 verification hash certifying the student's official transcript and preventing academic fraud.

### 4.5 Early Warning Risk Engine

Automated monitors continually track student allocations and trigger severity-graded alerts (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`):
- `HOURS_BEHIND_SCHEDULE`: Student logging velocity is inadequate to fulfill required hours prior to cycle end.
- `OVERDUE_LOGBOOK_ENTRY`: Trainee has not logged hours for > 7 calendar days.
- `MISSED_SUPERVISION_VISIT`: Required midpoint academic supervisory visit has not been recorded.
- `SCOPE_GUARD_FLAG`: Student attempted an unauthorized clinical activity.
- `POOR_EVALUATION`: Midpoint or periodic assessment score drops below the 60% threshold.

### 4.6 System B: Community Welfare Need-Matching Portal

System B provides a public civic interface:
- **Need Intake:** Vulnerable citizens or families register structured aid requests (Elderly Care, Disability Support, Child & Family Welfare, Psychosocial Aid).
- **Semantic Matchmaker:** Located at [matcher.ts](file:///c:/Users/PARAKLETUS%20HUB/.gemini/PracticumOS/src/modules/needs-matching/matcher.ts). Matches community requests against accredited welfare agencies and certified providers based on keywords, taxonomy categories, and geographical proximity.

### 4.7 Offline-First PWA Synchronization

Trainees often work in rural or bandwidth-constrained clinical environments. PracticumOS includes:
- **Service Worker (`public/sw.js`)**: Caches static assets, layout shells, and offline fallbacks.
- **Offline Sync Queue (`src/lib/offline-sync.ts`)**: Queues pending logbook submissions in `localStorage` / `IndexedDB` when offline and replays them automatically when network connectivity is restored.
- **Network Status Indicator (`src/components/ui/network-status-badge.tsx`)**: Real-time visual indicator displaying connection health, pending sync counts, and trigger-sync controls.

---

## 5. Role-Based Portals & Routing Architecture

PracticumOS employs a slug-based multi-tenant routing hierarchy (`/[tenant]/...`):

```
src/app/
├── page.tsx                                  # Public Landing & Institutional Gateway Directory
├── gateways/
│   ├── help/page.tsx                         # System B: Community Need Submission Portal
│   ├── matching/page.tsx                     # System B: Care Request Matchmaker View
│   └── provider/page.tsx                     # System B: Service Provider Directory & Enrollment
└── [tenant]/                                 # Multi-Tenant Institutional Boundary (e.g. /unilag)
    ├── admin/                                # Practicum Director & Coordinator Console
    │   ├── page.tsx                          # Overview KPI Dashboard
    │   ├── cycles/page.tsx                   # Practicum Cycle Configurator
    │   ├── cohort/page.tsx                   # Student Cohort Roster & CSV Ingest
    │   ├── agencies/page.tsx                 # Agency Directory & Accreditation Register
    │   ├── matching/page.tsx                 # Placement Matching Workspace
    │   ├── postings/page.tsx                 # Posting Desk & Letter Generator
    │   ├── logbook/page.tsx                  # Institution-wide Logbook Audit
    │   ├── visits/page.tsx                   # Supervision Visit Tracking
    │   ├── alerts/page.tsx                   # Early Warning Triage Center
    │   ├── grading/page.tsx                  # Broadsheet & Grade Locking Desk
    │   ├── reports/page.tsx                  # Letterhead Broadsheet & Transcripts
    │   ├── scope-guard/page.tsx              # ScopeGuard Policy Inspector
    │   ├── audit/page.tsx                    # Cryptographic Audit Ledger
    │   └── needs/page.tsx                    # Community Needs Triage Desk
    ├── student/                              # Student Trainee Portal
    │   ├── page.tsx                          # Student Progress Dashboard
    │   ├── placement/page.tsx                # Posting Details & Tripartite Contract
    │   ├── guide/page.tsx                    # E-Practicum Guide & Handbook
    │   ├── logbook/page.tsx                  # E-Logbook with ScopeGuard Validator
    │   ├── dna/page.tsx                      # Professional Competency Radar Breakdown
    │   └── passport/page.tsx                 # Practice Passport & Credentials
    ├── field/                                # Field Supervisor Desk
    │   ├── page.tsx                          # Field Supervisor Dashboard
    │   ├── trainees/page.tsx                 # Assigned Student Trainee Caseload
    │   ├── verifications/page.tsx            # Practice Event Sign-off & Audit
    │   └── evaluations/page.tsx              # CSWE EPAS 9-Competency Rubric Forms
    └── faculty/                              # Faculty / Academic Advisor Portal
        ├── page.tsx                          # Academic Supervisor Dashboard
        ├── visits/page.tsx                   # Supervisory Visit Logger (On-Site/Remote)
        ├── alerts/page.tsx                   # Early Warning Intervention Desk
        └── evaluations/page.tsx              # Academic Rubric Evaluation
```

---

## 6. Data Model & Entity Architecture

PracticumOS runs on **PostgreSQL 17 on Supabase**, mapped via **Prisma ORM** ([schema.prisma](file:///c:/Users/PARAKLETUS%20HUB/.gemini/PracticumOS/prisma/schema.prisma)):

```
┌──────────────────┐       ┌──────────────────────┐       ┌────────────────────────┐
│      Person      │       │     Organisation     │       │     PracticumCycle     │
├──────────────────┤       ├──────────────────────┤       ├────────────────────────┤
│ id (UUID)        │       │ id (UUID)            │       │ id (UUID)              │
│ email (Unique)   │       │ slug (Unique)        │       │ tenantId (FK)          │
│ firstName        │       │ orgType (Enum)       │       │ name, academicYear     │
│ lastName         │       │ verificationStatus   │       │ requiredHours (e.g 400)│
│ nationalIdHash   │       │ branding, settings   │       │ gradingFormula (JSON)  │
└────────┬─────────┘       └──────────┬───────────┘       └───────────┬────────────┘
         │                            │                               │
         ├────────────────────────────┼───────────────────────────────┤
         ▼                            ▼                               ▼
┌──────────────────┐       ┌──────────────────────┐       ┌────────────────────────┐
│  CohortStudent   │       │    PlacementOffer    │       │  PlacementAllocation   │
├──────────────────┤       ├──────────────────────┤       ├────────────────────────┤
│ id (UUID)        │       │ id (UUID)            │       │ id (UUID)              │
│ cycleId (FK)     │       │ cycleId (FK)         │       │ cycleId (FK)           │
│ personId (FK)    │       │ hostOrgId (FK)       │       │ cohortStudentId (FK)   │
│ matricNumber     │       │ totalSlots           │       │ hostOrgId (FK)         │
│ specialty, level │       │ availableSlots       │       │ fieldSupervisorId (FK) │
└────────┬─────────┘       │ practiceAreas []     │       │ status (Enum)          │
         │                 └──────────────────────┘       │ postingLetterRef       │
         │                                                └───────────┬────────────┘
         │                                                            │
         ├────────────────────────────────────────────────────────────┼───────────────────────────┐
         ▼                                                            ▼                           ▼
┌──────────────────┐                                       ┌─────────────────────┐     ┌──────────────────────┐
│   CohortGrade    │                                       │    PracticeEvent    │     │   SupervisionVisit   │
├──────────────────┤                                       ├─────────────────────┤     ├──────────────────────┤
│ id (UUID)        │                                       │ id (UUID)           │     │ id (UUID)            │
│ cycleId (FK)     │                                       │ allocationId (FK)   │     │ allocationId (FK)    │
│ cohortStudentId  │                                       │ eventDate, times    │     │ supervisorPersonId   │
│ compositeScore   │                                       │ verifiedMinutes     │     │ visitType (Enum)     │
│ letterGrade      │                                       │ category, scopeLevel│     │ actionItems []       │
│ isApproved       │                                       │ tamperChecksum      │     │ studentProgressRating│
│ approvedBy (FK)  │                                       │ verificationStatus  │     └──────────────────────┘
└──────────────────┘                                       └─────────────────────┘
```

---

## 7. Tech Stack & Infrastructure

- **Application Framework:** [Next.js 14.2](https://nextjs.org) (App Router, Server Actions, Dynamic Segment Routing).
- **Language:** [TypeScript 5.6](https://typescriptlang.org) with strict type-safety.
- **Database:** [PostgreSQL 17 on Supabase](https://supabase.com) (Transaction Pooler on Port 6543, Direct Session on Port 5432).
- **ORM:** [Prisma 5.20](https://prisma.io) with connection pooling and type generation.
- **Styling & UI:** [Tailwind CSS 3.4](https://tailwindcss.com), [Lucide React](https://lucide.dev) iconography.
- **Validation:** [Zod 3.23](https://zod.dev) schema validation.
- **Cryptography:** Node.js native `crypto` (SHA-256 tamper-proof seals).
- **PWA & Offline:** HTML5 Service Workers, Cache API, and IndexedDB sync queues.
- **Deployment:** [Vercel](https://vercel.com) (configuration at [vercel.json](file:///c:/Users/PARAKLETUS%20HUB/.gemini/PracticumOS/vercel.json)).

---

## 8. Getting Started & Development

### 8.1 Prerequisites

Ensure the following tools are installed:
- **Node.js**: v18.18+ or v20+
- **npm** or **pnpm**
- **Git**
- **GitHub CLI (`gh`)** (Optional, for repository and remote management)

### 8.2 Environment Configuration

Create a `.env` file in the root directory modeled after [.env.production.example](file:///c:/Users/PARAKLETUS%20HUB/.gemini/PracticumOS/.env.production.example):

```bash
# PostgreSQL Connection (Supabase Transaction Pooler)
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=15"

# PostgreSQL Direct Connection (Migrations & Prisma db push)
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-eu-west-2.pooler.supabase.com:5432/postgres"

# Supabase Public Keys
NEXT_PUBLIC_SUPABASE_URL="https://[REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON_KEY]"

# Application URL & Security
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-development-secret-key"
```

> [!WARNING]
> Never commit real database passwords or service role keys to Git. The `.env` file is excluded via `.gitignore`.

### 8.3 Database Setup & Seeding

1. **Push Prisma Schema to Database:**
   ```bash
   npm run db:push
   ```

2. **Generate Prisma Client:**
   ```bash
   npm run db:generate
   ```

3. **Seed Database with Sample Institutional Data:**
   ```bash
   npm run db:seed
   ```
   *Seeds the University of Lagos (`unilag`) tenant with accredited partner agencies, supervisors, practicum cycles, and sample cohort records.*

### 8.4 Running the E2E Verification Suite

PracticumOS includes an automated 30-step end-to-end verification suite validating all business processes against live PostgreSQL:

```bash
npm run test:e2e
```

**Expected Result:**
```text
================================================================================
  PRACTICUMOS 30-STEP END-TO-END VERIFICATION SUITE
  The Operating System for Practice, Care & Social Welfare
================================================================================

🔷 PHASE 1: SETUP & COHORT INGESTION (Steps 1–4)
  ✓ Step 01: Create Practicum Cycle Configurator
  ✓ Step 02: Student Cohort Ingestion & Validation
  ✓ Step 03: Host Agency Registration & Accreditation Check
  ✓ Step 04: Placement Capacity Collection & Slot Register

🔷 PHASE 2: MATCHING & POSTING (Steps 5–8)
  ✓ Step 05: Algorithmic Placement Matching Execution
  ✓ Step 06: Coordinator Review & Allocation Creation
  ✓ Step 07: Posting Desk & Digitally Signed Reference Dispatch
  ✓ Step 08: E-Practicum Guide Orientation & Learning Contract Acceptance

🔷 PHASE 3: PRACTICE EXECUTION & EVIDENCE (Steps 9–12)
  ✓ Step 09: E-Logbook Activation & ScopeGuard Readiness
  ✓ Step 10: Practice Event Logging (Hours, Typology & Reflection)
  ✓ Step 11: Evidence Vault Sanitization & Checksum Verification
  ✓ Step 12: Field Supervisor Verification Desk Sign-Off

🔷 PHASE 4: SUPERVISION & EARLY WARNING (Steps 13–16)
  ✓ Step 13: Dual-Supervision Caseload Distribution
  ✓ Step 14: Academic Supervision Visit Logger (On-Site/Remote)
  ✓ Step 15: Early Warning Engine Risk Scan
  ✓ Step 16: Periodic Reflective Report Verification

🔷 PHASE 5: ASSESSMENT & DYNAMIC GRADING (Steps 17–24)
  ✓ Step 17: Midpoint Formative Assessment Submission
  ✓ Step 18: Final Practicum Portfolio & Report Submission
  ✓ Step 19: Field Supervisor CSWE EPAS Evaluation Rubric (40%)
  ✓ Step 20: Academic Supervisor Evaluation Rubric (30%)
  ✓ Step 21: CSWE EPAS 9-Competency Synthesis & Mapping
  ✓ Step 22: Dynamic Weighted Grading Formula Computation
  ✓ Step 23: Institutional Grade Scale Mapping (A-F Scale)
  ✓ Step 24: Two-Person Staff Moderation & Grade Locking

🔷 PHASE 6: RESULTS, TRANSCRIPTS, AUDIT & SYSTEM B (Steps 25–30)
  ✓ Step 25: Cohort Score Broadsheet Matrix Aggregation
  ✓ Step 26: Official University Letterhead Template Merging
  ✓ Step 27: Digital Transcript Seal Verification & Checksum
  ✓ Step 28: Practicum Cycle Archival & Immutable Locking
  ✓ Step 29: Cryptographic Audit Ledger Commit
  ✓ Step 30: System B Need Intake & Semantic Match Verification

================================================================================
  🏆 ALL 30 END-TO-END LIFECYCLE STEPS PASSED WITH 100% SUCCESS!
================================================================================
```

### 8.5 Local Server Execution

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
- **Landing Gateway:** `http://localhost:3000`
- **Institution Admin Console:** `http://localhost:3000/unilag/admin`
- **Student Practicum Portal:** `http://localhost:3000/unilag/student`
- **Field Supervisor Desk:** `http://localhost:3000/unilag/field`
- **Faculty Supervisor Console:** `http://localhost:3000/unilag/faculty`
- **System B Civic Help Gateway:** `http://localhost:3000/gateways/help`

---

## 9. Production Deployment

### Vercel Deployment
PracticumOS is optimized for deployment on Vercel:
1. Connect repository `parakletusguy/practicum-os` to Vercel.
2. In the Vercel project settings, configure the environment variables as specified in `.env.production.example`.
3. Set the build command to `prisma generate && next build`.

### Docker Deployment
The project contains an optimized production multi-stage [Dockerfile](file:///c:/Users/PARAKLETUS%20HUB/.gemini/PracticumOS/Dockerfile):
```bash
docker build -t practicum-os:latest .
docker run -p 3000:3000 --env-file .env practicum-os:latest
```

---

## 📄 License

This software is licensed under the MIT License. Copyright © 2026 PracticumOS Contributors.