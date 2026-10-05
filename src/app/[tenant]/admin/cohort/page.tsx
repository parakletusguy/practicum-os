import { db } from "@/lib/db";
import { 
  Users, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Search,
  Filter
} from "lucide-react";
import { CohortImportClient } from "./cohort-import-client";

interface CohortPageProps {
  params: {
    tenant: string;
  };
  searchParams?: {
    cycleId?: string;
  };
}

export const dynamic = "force-dynamic";

export default async function CohortPage({ params, searchParams }: CohortPageProps) {
  const tenantSlug = params.tenant;

  const tenant = await db.organisation.findUnique({
    where: { slug: tenantSlug },
  });

  if (!tenant) return <div>Tenant not found</div>;

  // Active cycle or selected cycle
  const cycles = await db.practicumCycle.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });

  const selectedCycleId = searchParams?.cycleId || cycles[0]?.id;
  const currentCycle = cycles.find((c) => c.id === selectedCycleId);

  const students = currentCycle
    ? await db.cohortStudent.findMany({
        where: { cycleId: currentCycle.id },
        include: {
          person: true,
          allocation: {
            include: {
              hostOrg: true,
              fieldSupervisor: true,
            },
          },
        },
        orderBy: { matricNumber: "asc" },
      })
    : [];

  const matchedCount = students.filter((s) => s.allocation).length;
  const pendingCount = students.length - matchedCount;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            <span>Practicum Management</span>
            <span>•</span>
            <span className="text-emerald-600">Phase 1: Ingestion</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Student Cohort Roster
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Import, validate, and manage entire trainee cohorts enrolled in supervised practice.
          </p>
        </div>

        {currentCycle && (
          <CohortImportClient
            tenantSlug={tenantSlug}
            cycleId={currentCycle.id}
            cycleName={currentCycle.name}
          />
        )}
      </div>

      {/* Cycle Selector & Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Selected Cycle
          </div>
          <div className="text-base font-bold text-slate-900 mt-1 truncate">
            {currentCycle?.name ?? "No cycle selected"}
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">
            {currentCycle?.academicYear} • {currentCycle?.requiredHours} Hours
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Enrolled
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {students.length} Students
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Roster validated for field education
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Placement Status
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {matchedCount} Matched
          </div>
          <div className="text-xs text-amber-600 font-medium mt-1">
            {pendingCount} Pending Placement Allocation
          </div>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-bold text-slate-800">
              Enrolled Students ({students.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search matric # or name..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48 sm:w-64"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Matriculation No.</th>
                <th className="py-3 px-4">Level / Specialty</th>
                <th className="py-3 px-4">Location Pref</th>
                <th className="py-3 px-4">Assigned Placement</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No students currently enrolled in this cycle. Use the CSV Importer above to load your cohort list.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const hasAllocation = !!student.allocation;
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {student.person.firstName} {student.person.lastName}
                        <div className="text-[11px] text-slate-400 font-normal">
                          {student.person.email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {student.matricNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="font-semibold text-slate-800">{student.level}</span>
                        <div className="text-[11px] text-slate-500">{student.specialty}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {student.locationPref ?? "Mainland"}
                      </td>
                      <td className="py-3.5 px-4">
                        {hasAllocation ? (
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                              {student.allocation?.hostOrg.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Sup: {student.allocation?.fieldSupervisor?.firstName ?? "Pending"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unallocated</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`inline-block font-bold text-[10px] uppercase px-2 py-0.5 rounded-full ${
                            hasAllocation
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {hasAllocation ? "Allocated" : "Pending Match"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
