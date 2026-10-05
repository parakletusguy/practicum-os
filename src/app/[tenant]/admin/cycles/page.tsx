import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { 
  Calendar, 
  Plus, 
  Clock, 
  GraduationCap, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { CycleModalClient } from "./cycle-modal-client";

interface CyclesPageProps {
  params: {
    tenant: string;
  };
}

export const dynamic = "force-dynamic";

export default async function CyclesPage({ params }: CyclesPageProps) {
  const tenantSlug = params.tenant;

  const tenant = await db.organisation.findUnique({
    where: { slug: tenantSlug },
    include: {
      departments: {
        include: {
          programmes: true,
        },
      },
    },
  });

  if (!tenant) return <div>Tenant not found</div>;

  const cycles = await db.practicumCycle.findMany({
    where: { tenantId: tenant.id },
    include: {
      programme: true,
      _count: {
        select: {
          students: true,
          placementOffers: true,
          allocations: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const programmes = tenant.departments.flatMap((d) => d.programmes);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            <span>Practicum Management</span>
            <span>•</span>
            <span className="text-emerald-600">Phase 1: Setup</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Practicum Cycles
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure 1-month, 3-month, 6-month, semester, hours-based or custom field practice cycles.
          </p>
        </div>

        <CycleModalClient tenantSlug={tenantSlug} programmes={programmes} />
      </div>

      {/* Cycle Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cycles.map((cycle) => {
          const isActive = cycle.status === "ACTIVE";
          return (
            <div
              key={cycle.id}
              className={`bg-white rounded-2xl border p-6 shadow-xs flex flex-col justify-between transition-all ${
                isActive
                  ? "border-emerald-300 ring-2 ring-emerald-500/10 shadow-sm"
                  : "border-slate-200"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {cycle.academicYear}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isActive
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {cycle.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {cycle.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {cycle.programme?.name ?? "General Practice"}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Duration</div>
                    <div className="font-semibold text-slate-800 mt-0.5 capitalize">
                      {cycle.durationType.toLowerCase().replace("_", " ")}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Required Hours</div>
                    <div className="font-semibold text-emerald-700 mt-0.5">
                      {cycle.requiredHours} Hours
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Timeline</div>
                    <div className="text-slate-600 mt-0.5 text-[11px]">
                      {formatDate(cycle.startDate)} – {formatDate(cycle.endDate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Enrolled Trainees</div>
                    <div className="font-semibold text-slate-800 mt-0.5">
                      {cycle._count.students} Students
                    </div>
                  </div>
                </div>

                {/* ScopeGuard rules summary */}
                <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-xs text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-[11px]">
                    ScopeGuard rules active for clinical risk governance.
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/${tenantSlug}/admin/cohort?cycleId=${cycle.id}`}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  Manage Cohort ({cycle._count.students}) <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href={`/${tenantSlug}/admin/matching?cycleId=${cycle.id}`}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  Matching Desk
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
