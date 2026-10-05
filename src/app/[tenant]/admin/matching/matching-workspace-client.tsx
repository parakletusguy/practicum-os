"use client";

import { useState, useTransition } from "react";
import { 
  Shuffle, 
  Building2, 
  Users, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Loader2, 
  Check, 
  AlertCircle,
  FileCheck2,
  SlidersHorizontal
} from "lucide-react";
import { 
  executeMatchingAlgorithmAction, 
  approveAllocationAction, 
  approveAllProposedAllocationsAction 
} from "@/modules/placement-matching/matching-actions";

interface MatchingWorkspaceClientProps {
  tenantSlug: string;
  cycleId: string;
  cycleName: string;
  offers: any[];
  unmatchedStudents: any[];
  students: any[];
  proposedCount: number;
  approvedCount: number;
}

export function MatchingWorkspaceClient({
  tenantSlug,
  cycleId,
  cycleName,
  offers,
  unmatchedStudents,
  students,
  proposedCount,
  approvedCount,
}: MatchingWorkspaceClientProps) {
  const [isPending, startTransition] = useTransition();
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const totalCapacity = offers.reduce((sum, o) => sum + o.totalSlots, 0);
  const availableCapacity = offers.reduce((sum, o) => sum + o.availableSlots, 0);

  const handleRunAlgorithm = () => {
    setActionFeedback(null);
    startTransition(async () => {
      const res = await executeMatchingAlgorithmAction(tenantSlug, cycleId);
      if (res.success) {
        setActionFeedback(res.message || "Matching algorithm executed successfully.");
      } else {
        setActionFeedback(res.error || "Failed to execute matching.");
      }
    });
  };

  const handleApproveAll = () => {
    setActionFeedback(null);
    startTransition(async () => {
      const res = await approveAllProposedAllocationsAction(tenantSlug, cycleId);
      if (res.success) {
        setActionFeedback(res.message || "All proposed allocations approved.");
      } else {
        setActionFeedback(res.error || "Failed to approve allocations.");
      }
    });
  };

  const handleApproveSingle = (allocationId: string) => {
    startTransition(async () => {
      await approveAllocationAction(tenantSlug, allocationId);
    });
  };

  return (
    <div className="space-y-6">
      {/* Metric & Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Unmatched</div>
            <div className="text-2xl font-extrabold text-amber-600 mt-0.5">
              {unmatchedStudents.length} Students
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Awaiting placement</div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Slot Capacity</div>
            <div className="text-2xl font-extrabold text-purple-700 mt-0.5">
              {availableCapacity} / {totalCapacity}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Available across agencies</div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Proposed Review</div>
            <div className="text-2xl font-extrabold text-blue-600 mt-0.5">
              {proposedCount} Pending
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Requires approval</div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Approved Postings</div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-0.5">
              {approvedCount} Placed
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Ready for dispatch</div>
          </div>
        </div>

        {/* Workflow Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={unmatchedStudents.length === 0 || availableCapacity === 0 || isPending}
            onClick={handleRunAlgorithm}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Shuffle className="w-4 h-4" />
            )}
            Run Algorithmic Match
          </button>

          {proposedCount > 0 && (
            <button
              type="button"
              disabled={isPending}
              onClick={handleApproveAll}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Approve All ({proposedCount})
            </button>
          )}
        </div>
      </div>

      {actionFeedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {actionFeedback}
        </div>
      )}

      {/* Available Capacity Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-600" />
            Active Agency Placement Capacity
          </h3>
          <span className="text-xs text-slate-500">
            {offers.length} Participating Host Settings
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
                  <span className="truncate">{offer.hostOrg.name}</span>
                  <span className="text-purple-700 font-extrabold flex-shrink-0">
                    {offer.availableSlots} / {offer.totalSlots} Slots
                  </span>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-1">
                  {offer.practiceAreas.map((area: string, i: number) => (
                    <span
                      key={i}
                      className="text-[10px] bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded font-medium"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Contact: {offer.contactPerson ?? "Coordinator"}</span>
                <span className="text-emerald-600 font-semibold">Verified Setting</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cohort Allocations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-bold text-slate-800">
              Student Allocation Register ({students.length})
            </span>
          </div>

          <span className="text-xs text-slate-500">
            Human Approval Protocol Enforced
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Matric #</th>
                <th className="py-3 px-4">Specialty & Pref</th>
                <th className="py-3 px-4">Assigned Agency</th>
                <th className="py-3 px-4">Supervisors</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student) => {
                const allocation = student.allocation;
                const status = allocation?.status ?? "UNALLOCATED";

                return (
                  <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {student.person.firstName} {student.person.lastName}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {student.matricNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="font-semibold text-slate-800">{student.specialty}</span>
                      <div className="text-[11px] text-slate-400">{student.locationPref}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {allocation ? (
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-purple-600" />
                          {allocation.hostOrg.name}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No Placement Assigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {allocation ? (
                        <div className="text-[11px]">
                          <div>Field: {allocation.fieldSupervisor?.firstName ?? "Assigned by Host"}</div>
                          <div className="text-slate-400">Faculty: {allocation.academicSupervisor?.firstName ?? "Assigned"}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block font-bold text-[10px] uppercase px-2 py-0.5 rounded-full ${
                          status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                            : status === "APPROVED"
                            ? "bg-blue-50 text-blue-800 border border-blue-300"
                            : status === "PROPOSED"
                            ? "bg-amber-50 text-amber-800 border border-amber-300"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {status === "PROPOSED" && (
                        <button
                          type="button"
                          onClick={() => handleApproveSingle(allocation.id)}
                          className="px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] border border-emerald-200 transition-colors cursor-pointer"
                        >
                          Approve
                        </button>
                      )}
                      {status === "APPROVED" && (
                        <span className="text-emerald-600 text-[11px] font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      )}
                      {status === "ACTIVE" && (
                        <span className="text-slate-400 text-[11px]">Active</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
