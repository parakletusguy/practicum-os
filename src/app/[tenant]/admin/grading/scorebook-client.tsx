"use client";

import { useState } from "react";
import {
  Award,
  CheckCircle2,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  Sparkles,
  Building2,
  FileText,
  Printer,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import {
  calculateCohortGradesAction,
  approveCohortGradeAction,
} from "@/modules/grading/evaluator";

interface StudentGradeRow {
  studentId: string;
  gradeId?: string;
  matricNumber: string;
  studentName: string;
  agencyName: string;
  logbookHoursScore: number;
  fieldEvalScore: number;
  academicEvalScore: number;
  reportsScore: number;
  compositeScore: number;
  letterGrade: string;
  isApproved: boolean;
  approvedAt?: string | Date | null;
  moderationRemarks?: string | null;
}

interface Props {
  initialGrades: StudentGradeRow[];
  cycleId: string;
  cycleName: string;
  approverPersonId: string;
  tenantSlug: string;
}

export function ScorebookClient({
  initialGrades,
  cycleId,
  cycleName,
  approverPersonId,
  tenantSlug,
}: Props) {
  const [grades, setGrades] = useState<StudentGradeRow[]>(initialGrades);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [activeModalRow, setActiveModalRow] = useState<StudentGradeRow | null>(null);
  const [moderationRemarks, setModerationRemarks] = useState<string>("");
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filteredGrades = grades.filter(
    (g) =>
      g.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.matricNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.agencyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Grade Distribution
  const gradeDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  let totalComposite = 0;

  grades.forEach((g) => {
    gradeDistribution[g.letterGrade] = (gradeDistribution[g.letterGrade] || 0) + 1;
    totalComposite += g.compositeScore;
  });

  const cohortAverage = grades.length > 0 ? (totalComposite / grades.length).toFixed(1) : "0.0";
  const approvedCount = grades.filter((g) => g.isApproved).length;

  const handleRecalculate = async () => {
    setIsCalculating(true);
    setToastMessage(null);

    const res = await calculateCohortGradesAction(cycleId, tenantSlug);

    if (res.success) {
      setToastMessage({
        type: "success",
        text: res.message || "Grades recalculated successfully.",
      });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setToastMessage({ type: "error", text: res.error || "Failed to calculate grades." });
    }

    setIsCalculating(false);
  };

  const handleApproveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalRow || !activeModalRow.gradeId) return;
    setIsApproving(true);
    setToastMessage(null);

    const formData = new FormData();
    formData.append("gradeId", activeModalRow.gradeId);
    formData.append("approverPersonId", approverPersonId);
    formData.append("moderationRemarks", moderationRemarks);
    formData.append("tenantSlug", tenantSlug);

    const res = await approveCohortGradeAction(formData);

    if (res.success) {
      setGrades((prev) =>
        prev.map((row) =>
          row.gradeId === activeModalRow.gradeId
            ? {
                ...row,
                isApproved: true,
                approvedAt: new Date(),
                moderationRemarks: moderationRemarks,
              }
            : row
        )
      );
      setToastMessage({ type: "success", text: res.message || "Grade locked and approved." });
      setTimeout(() => {
        setActiveModalRow(null);
        setModerationRemarks("");
        setToastMessage(null);
      }, 1000);
    } else {
      setToastMessage({ type: "error", text: res.error || "Failed to approve grade." });
    }

    setIsApproving(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            Configurable Formula Engine
          </div>
          <h2 className="text-xl font-bold">{cycleName} — Master Cohort Scorebook</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Formula: 40% Field Supervisor + 30% Academic Review + 20% Logbook Hours + 10% Reflective Report.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-2 border border-slate-700"
          >
            <Printer className="w-4 h-4" />
            Print Broadsheet
          </button>
          <button
            onClick={handleRecalculate}
            disabled={isCalculating}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isCalculating ? "animate-spin" : ""}`} />
            {isCalculating ? "Evaluating..." : "Recalculate Dynamic Grades"}
          </button>
        </div>
      </div>

      {toastMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Grade Normalization Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Cohort Mean
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{cohortAverage}%</span>
          <span className="text-[11px] text-slate-500 font-medium">Composite Average</span>
        </div>

        {["A", "B", "C", "D", "F"].map((letter) => {
          const count = gradeDistribution[letter] || 0;
          const pct = grades.length > 0 ? Math.round((count / grades.length) * 100) : 0;
          return (
            <div
              key={letter}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Grade {letter}
              </span>
              <span
                className={`text-2xl font-black mt-1 block ${
                  letter === "A"
                    ? "text-emerald-600"
                    : letter === "B"
                    ? "text-blue-600"
                    : letter === "C"
                    ? "text-amber-600"
                    : "text-rose-600"
                }`}
              >
                {count}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">{pct}% of cohort</span>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="text-xs text-slate-600 font-medium flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-600" />
          <span>
            <strong className="text-slate-900">{approvedCount}</strong> of{" "}
            <strong className="text-slate-900">{grades.length}</strong> grades locked and approved
            by Board of Examiners.
          </span>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student or matric number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
          />
        </div>
      </div>

      {/* Scorebook Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Trainee / Matric</th>
                <th className="py-3 px-4">Placement Agency</th>
                <th className="py-3 px-3 text-center">Logbook (20%)</th>
                <th className="py-3 px-3 text-center">Field Eval (40%)</th>
                <th className="py-3 px-3 text-center">Academic (30%)</th>
                <th className="py-3 px-3 text-center">Report (10%)</th>
                <th className="py-3 px-4 text-center">Composite Score</th>
                <th className="py-3 px-3 text-center">Grade</th>
                <th className="py-3 px-4 text-center">Approval Status</th>
                <th className="py-3 px-4 text-right">Moderation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGrades.map((row) => (
                <tr key={row.studentId} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div>{row.studentName}</div>
                    <div className="text-[10px] font-mono text-slate-400 font-normal">
                      {row.matricNumber}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-[200px] truncate">
                    {row.agencyName}
                  </td>
                  <td className="py-3.5 px-3 text-center font-medium text-slate-700">
                    {row.logbookHoursScore.toFixed(1)}%
                  </td>
                  <td className="py-3.5 px-3 text-center font-medium text-slate-700">
                    {row.fieldEvalScore.toFixed(1)}%
                  </td>
                  <td className="py-3.5 px-3 text-center font-medium text-slate-700">
                    {row.academicEvalScore.toFixed(1)}%
                  </td>
                  <td className="py-3.5 px-3 text-center font-medium text-slate-700">
                    {row.reportsScore.toFixed(1)}%
                  </td>
                  <td className="py-3.5 px-4 text-center font-black text-slate-900 text-sm">
                    {row.compositeScore.toFixed(1)}%
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`inline-block w-8 h-8 rounded-xl font-black text-xs leading-8 ${
                        row.letterGrade === "A"
                          ? "bg-emerald-100 text-emerald-800"
                          : row.letterGrade === "B"
                          ? "bg-blue-100 text-blue-800"
                          : row.letterGrade === "C"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {row.letterGrade}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {row.isApproved ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Lock className="w-3 h-3 text-emerald-600" />
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Unlock className="w-3 h-3 text-amber-600" />
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {row.gradeId && (
                      <button
                        onClick={() => {
                          setActiveModalRow(row);
                          setModerationRemarks(row.moderationRemarks || "");
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-emerald-600 transition-colors"
                      >
                        {row.isApproved ? "View Lock" : "Moderate & Lock"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Moderation & Lock Modal */}
      {activeModalRow && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-6 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  Two-Person Moderation Lock Protocol
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">
                  Academic Grade Sign-Off
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeModalRow.studentName} ({activeModalRow.matricNumber})
                </p>
              </div>
              <button
                onClick={() => setActiveModalRow(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Score breakdown card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Final Composite Score
                </span>
                <span className="text-2xl font-black text-slate-900">
                  {activeModalRow.compositeScore}%
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Awarded Letter Grade
                </span>
                <span className="text-2xl font-black text-emerald-700">
                  {activeModalRow.letterGrade}
                </span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-200/60 text-slate-600">
                Logbook Hours: {activeModalRow.logbookHoursScore.toFixed(1)}% • Field Assessment:{" "}
                {activeModalRow.fieldEvalScore.toFixed(1)}% • Academic Review:{" "}
                {activeModalRow.academicEvalScore.toFixed(1)}%
              </div>
            </div>

            <form onSubmit={handleApproveGrade} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Departmental Examination Board Remarks & Moderation Audit Notes *
                </label>
                <textarea
                  value={moderationRemarks}
                  onChange={(e) => setModerationRemarks(e.target.value)}
                  disabled={activeModalRow.isApproved}
                  required
                  rows={3}
                  placeholder="E.g., Moderated and approved by the Departmental Board of Social Work. Meets statutory CSWE practicum standards."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModalRow(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
                {!activeModalRow.isApproved && (
                  <button
                    type="submit"
                    disabled={isApproving}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-emerald-600 text-white shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    {isApproving ? "Locking..." : "Lock & Confirm Official Grade"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
