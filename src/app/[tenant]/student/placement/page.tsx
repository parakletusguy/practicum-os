import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  UserCheck, 
  CheckCircle2, 
  ShieldCheck, 
  Clock,
  ArrowRight
} from "lucide-react";
import { LearningContractClient } from "./learning-contract-client";

interface StudentPlacementPageProps {
  params: {
    tenant: string;
  };
}

export const dynamic = "force-dynamic";

export default async function StudentPlacementPage({ params }: StudentPlacementPageProps) {
  const tenantSlug = params.tenant;

  const student = await db.person.findFirst({
    where: { email: "c.eze@student.unilag.edu.ng" },
    include: {
      cohortEnrollments: {
        include: {
          cycle: true,
          allocation: {
            include: {
              hostOrg: true,
              fieldSupervisor: true,
              academicSupervisor: true,
            },
          },
        },
      },
    },
  });

  const enrollment = student?.cohortEnrollments[0];
  const allocation = enrollment?.allocation;

  if (!allocation) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h2 className="text-base font-bold text-slate-800">Placement Pending</h2>
        <p className="text-xs text-slate-500 mt-1">
          You have not yet been assigned to an active practice setting. Check back once matching completes.
        </p>
      </div>
    );
  }

  // Check if student already signed learning contract in audit log
  const contractLog = await db.auditLog.findFirst({
    where: {
      resourceId: allocation.id,
      actionType: "LEARNING_CONTRACT_SIGNED",
    },
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
          <span>Student Workspace</span>
          <span>•</span>
          <span className="text-emerald-600">Placement Profile</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Placement Profile & Learning Contract
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Verified host setting details, supervisor points of contact, and official placement onboarding.
        </p>
      </div>

      {/* Main Agency Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center font-bold flex-shrink-0">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                  {allocation.hostOrg.orgType}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Accredited Host
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1.5">
                {allocation.hostOrg.name}
              </h2>
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{allocation.hostOrg.address}, {allocation.hostOrg.city}, {allocation.hostOrg.country}</span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right flex-shrink-0">
            <div className="text-[10px] uppercase font-bold text-slate-400">Official Posting Ref</div>
            <div className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 mt-1 inline-block">
              {allocation.postingLetterRef ?? "Pending Ref"}
            </div>
            <div className="mt-2">
              <Link
                href={`/${tenantSlug}/admin/postings/${allocation.id}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                <FileText className="w-3.5 h-3.5" />
                View Official Posting Letter →
              </Link>
            </div>
          </div>
        </div>

        {/* Supervisors Two-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 pt-2">
          {/* Field Supervisor */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Designated Field Supervisor (Agency)
            </div>
            <div className="text-sm font-bold text-slate-900">
              {allocation.fieldSupervisor?.firstName} {allocation.fieldSupervisor?.lastName}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Practice Educator & On-site Preceptor
            </div>

            <div className="mt-3 space-y-1.5 text-xs text-slate-600">
              {allocation.fieldSupervisor?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{allocation.fieldSupervisor.email}</span>
                </div>
              )}
              {allocation.fieldSupervisor?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{allocation.fieldSupervisor.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Academic Supervisor */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Faculty Liaison (University)
            </div>
            <div className="text-sm font-bold text-slate-900">
              {allocation.academicSupervisor?.firstName} {allocation.academicSupervisor?.lastName}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Department of Social Work, Faculty Liaison
            </div>

            <div className="mt-3 space-y-1.5 text-xs text-slate-600">
              {allocation.academicSupervisor?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{allocation.academicSupervisor.email}</span>
                </div>
              )}
              {allocation.academicSupervisor?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{allocation.academicSupervisor.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Learning Contract & Ethics Commitment Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Practicum Learning Contract & Professional Code of Ethics
            </h3>
            <p className="text-xs text-slate-500">
              Mandatory institutional covenant between trainee, field supervisor, and university directorate.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-xs text-slate-700 leading-relaxed">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Professional Confidentiality:</strong> I solemnly pledge never to disclose identifiable client names, residential addresses, national identity details, or identifiable photographs in my logbook or case notes.
            </span>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>ScopeGuard Compliance:</strong> I agree strictly to undertake high-risk clinical tasks (such as unaccompanied home visits, child removal proceedings, or psychiatric crisis interventions) solely under the direct on-site observation of my certified Field Supervisor.
            </span>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Practice Integrity:</strong> I commit to logging only authentic, verified hours and completing the required 400 practice hours with honest critical reflection on my evolving competency.
            </span>
          </div>
        </div>

        {/* Digital Signature Component */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <LearningContractClient
            tenantSlug={tenantSlug}
            allocationId={allocation.id}
            isAlreadySigned={!!contractLog}
            studentFullName={`${student?.firstName} ${student?.lastName}`}
          />
        </div>
      </div>
    </div>
  );
}
