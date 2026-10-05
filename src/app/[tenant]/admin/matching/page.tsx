import { db } from "@/lib/db";
import { 
  Shuffle, 
  Building2, 
  Users, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Layers, 
  AlertCircle,
  FileCheck2,
  MailCheck
} from "lucide-react";
import Link from "next/link";
import { MatchingWorkspaceClient } from "./matching-workspace-client";

interface MatchingPageProps {
  params: {
    tenant: string;
  };
  searchParams?: {
    cycleId?: string;
  };
}

export const dynamic = "force-dynamic";

export default async function MatchingPage({ params, searchParams }: MatchingPageProps) {
  const tenantSlug = params.tenant;

  const tenant = await db.organisation.findUnique({
    where: { slug: tenantSlug },
  });

  if (!tenant) return <div>Tenant not found</div>;

  const cycles = await db.practicumCycle.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });

  const selectedCycleId = searchParams?.cycleId || cycles[0]?.id;
  const currentCycle = cycles.find((c) => c.id === selectedCycleId);

  // Fetch placement offers for this cycle
  const offers = currentCycle
    ? await db.placementOffer.findMany({
        where: { cycleId: currentCycle.id },
        include: {
          hostOrg: true,
        },
        orderBy: { availableSlots: "desc" },
      })
    : [];

  // Fetch all students and their allocation status
  const students = currentCycle
    ? await db.cohortStudent.findMany({
        where: { cycleId: currentCycle.id },
        include: {
          person: true,
          allocation: {
            include: {
              hostOrg: true,
              fieldSupervisor: true,
              academicSupervisor: true,
            },
          },
        },
        orderBy: { matricNumber: "asc" },
      })
    : [];

  const unmatchedStudents = students.filter((s) => !s.allocation);
  const proposedAllocations = students.filter((s) => s.allocation?.status === "PROPOSED");
  const approvedAllocations = students.filter((s) => s.allocation && s.allocation.status !== "PROPOSED");

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            <span>Practicum Management</span>
            <span>•</span>
            <span className="text-emerald-600">Phase 2: Matching</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Placement Matching Workspace
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Distribute students across accredited practice settings via algorithmic matching or coordinator review.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/${tenantSlug}/admin/postings`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <MailCheck className="w-4 h-4 text-emerald-400" />
            Posting Desk ({approvedAllocations.length} Approved)
          </Link>
        </div>
      </div>

      {currentCycle && (
        <MatchingWorkspaceClient
          tenantSlug={tenantSlug}
          cycleId={currentCycle.id}
          cycleName={currentCycle.name}
          offers={offers}
          unmatchedStudents={unmatchedStudents}
          students={students}
          proposedCount={proposedAllocations.length}
          approvedCount={approvedAllocations.length}
        />
      )}
    </div>
  );
}
