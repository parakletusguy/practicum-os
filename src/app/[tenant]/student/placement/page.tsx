import { requirePortalAccess } from "@/lib/portal-access";
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

interface StudentPlacementPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function StudentPlacementPage(props: StudentPlacementPageProps) {
  const params = await props.params;
  const tenantSlug = params.tenant;

  const { actor, tenant } = await requirePortalAccess(tenantSlug, "student");
  const student = await db.person.findUnique({
    where: { id: actor.id },
    include: {
      cohortEnrollments: {
        where: { cycle: { tenantId: tenant.id } },
        orderBy: { cycle: { createdAt: "desc" } },
        take: 1,
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

        <Link href={`/${tenantSlug}/student/contracts/${allocation.id}`} className="mt-4 inline-flex rounded-lg border px-4 py-2 text-sm font-semibold text-emerald-800">
          Review learning contract
        </Link>
        <Link href={`/${tenantSlug}/student/reports/${allocation.id}`} className="mt-4 ml-2 inline-flex rounded-lg border px-4 py-2 text-sm font-semibold text-emerald-800">Reflection and portfolio</Link>
      </div>
    </div>
  );
}
