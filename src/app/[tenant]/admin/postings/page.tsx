import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { 
  MailCheck, 
  FileText, 
  Building2, 
  Users, 
  CheckCircle2, 
  Clock, 
  Send, 
  Printer, 
  ArrowRight,
  ExternalLink
} from "lucide-react";
import { PostingDeskClient } from "./posting-desk-client";

interface PostingsPageProps {
  params: Promise<{
    tenant: string;
  }>;
  searchParams?: Promise<{
    cycleId?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function PostingsPage(props: PostingsPageProps) {
  const searchParams = await props.searchParams;
  const params = await props.params;
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

  const allocations = currentCycle
    ? await db.placementAllocation.findMany({
        where: { cycleId: currentCycle.id },
        include: {
          studentPerson: true,
          cohortStudent: true,
          hostOrg: true,
          fieldSupervisor: true,
          academicSupervisor: true,
          emailDeliveries: {
            where: { kind: "POSTING_LETTER" },
            select: { status: true },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const postedCount = allocations.filter((a) => a.postingLetterRef && (a.status === "ACTIVE" || a.status === "POSTED")).length;
  const pendingCount = allocations.length - postedCount;
  const deliveredCount = allocations.filter((allocation) =>
    allocation.emailDeliveries.length > 0 && allocation.emailDeliveries.every((delivery) => delivery.status === "SENT"),
  ).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            <span>Practicum Management</span>
            <span>•</span>
            <span className="text-emerald-600">Phase 2: Postings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Electronic Posting Desk
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Issue official posting letters, attach an archival PDF, and track confirmed email delivery separately.
          </p>
        </div>

        {currentCycle && (
          <PostingDeskClient
            tenantSlug={tenantSlug}
            cycleId={currentCycle.id}
            pendingCount={pendingCount}
          />
        )}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Allocated Placements
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {allocations.length} Students
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Matched to accredited host settings
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Letters Issued
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {postedCount} Active Letters
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">
            Issued only after student and host recipients are queued
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Awaiting Issuance
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">
            {pendingCount} Awaiting
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Requires recipient details and batch issue action
          </div>
        </div>
      </div>

      {/* Postings Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MailCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-bold text-slate-800">
              Official Posting Roster ({allocations.length})
            </span>
          </div>

          <span className="text-xs text-slate-500">
            Email status reflects provider acceptance, not just a generated reference
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
                <th className="py-3 px-4">Posting Ref #</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Matric #</th>
                <th className="py-3 px-4">Host Agency</th>
                <th className="py-3 px-4">Supervisors</th>
                <th className="py-3 px-4">Dispatch Status</th>
                <th className="py-3 px-4 text-right">Official Document</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allocations.map((alloc) => {
                const hasLetter = !!alloc.postingLetterRef;

                return (
                  <tr key={alloc.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                      {alloc.postingLetterRef ?? (
                        <span className="text-slate-400 font-normal italic">Pending Ref</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {alloc.studentPerson.firstName} {alloc.studentPerson.lastName}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {alloc.cohortStudent.matricNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-purple-600" />
                        {alloc.hostOrg.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {alloc.hostOrg.city}, {alloc.hostOrg.country}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="text-[11px]">
                        <div>Field: <span className="font-medium text-slate-800">{alloc.fieldSupervisor?.firstName ?? "Assigned on Site"}</span></div>
                        <div className="text-slate-400">Faculty: {alloc.academicSupervisor?.firstName ?? "Assigned"}</div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {(() => {
                        const deliveries = alloc.emailDeliveries;
                        const sent = deliveries.length > 0 && deliveries.every((delivery) => delivery.status === "SENT");
                        const failed = deliveries.some((delivery) => delivery.status === "FAILED");
                        const queued = deliveries.some((delivery) =>
                          ["PENDING", "SENDING", "RETRY_SCHEDULED"].includes(delivery.status),
                        );
                        const label = sent
                          ? "Email accepted"
                          : failed
                            ? "Email failed"
                            : queued
                              ? "Email queued"
                              : alloc.status === "POSTED" || alloc.status === "ACTIVE"
                                ? "Issued — no receipt"
                                : "Awaiting issue";
                        const tone = sent
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : failed
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : queued
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200";
                        return <span className={`inline-block font-bold text-[10px] uppercase px-2 py-0.5 rounded-full border ${tone}`}>{label}</span>;
                      })()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/${tenantSlug}/admin/postings/${alloc.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px] transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        Official Letter
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-500 -mt-4">
        {deliveredCount} of {postedCount} issued letter(s) have confirmed email acceptance. Provider delivery and opening events remain available in the email provider dashboard.
      </p>
    </div>
  );
}
