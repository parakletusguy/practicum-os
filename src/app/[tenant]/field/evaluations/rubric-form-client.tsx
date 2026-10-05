"use client";

import { useState } from "react";
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  User,
  Building2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { submitAssessmentEvaluationAction } from "@/modules/grading/evaluator";

const CSWE_COMPETENCIES = [
  {
    id: "EPAS-1",
    title: "EPAS 1: Demonstrate Ethical and Professional Behavior",
    description:
      "Adheres to professional boundaries, social work ethics, personal reflection, and appropriate technology use.",
  },
  {
    id: "EPAS-2",
    title: "EPAS 2: Advance Human Rights and Social & Economic Justice",
    description:
      "Applies understanding of social justice to advocate for client access to resources and fundamental human rights.",
  },
  {
    id: "EPAS-3",
    title: "EPAS 3: Anti-Racism, Diversity, Equity & Inclusion (ADEI)",
    description:
      "Demonstrates cultural humility, recognizes intersectionality, and mitigates implicit biases in clinical practice.",
  },
  {
    id: "EPAS-4",
    title: "EPAS 4: Practice-Informed Research & Research-Informed Practice",
    description:
      "Utilizes empirical evidence to inform casework interventions and contributes to agency practice wisdom.",
  },
  {
    id: "EPAS-5",
    title: "EPAS 5: Engage in Policy Practice",
    description:
      "Understands how social welfare policies affect service delivery, funding, and client outcomes.",
  },
  {
    id: "EPAS-6",
    title: "EPAS 6: Engagement with Individuals, Families & Communities",
    description:
      "Establishes empathic rapport, active listening, and constructive working alliances with diverse client systems.",
  },
  {
    id: "EPAS-7",
    title: "EPAS 7: Assessment of Client Systems",
    description:
      "Conducts comprehensive bio-psychosocial-spiritual assessments and identifies multidimensional strengths and risks.",
  },
  {
    id: "EPAS-8",
    title: "EPAS 8: Clinical Intervention & Service Implementation",
    description:
      "Executes collaborative intervention plans, crisis de-escalation, and therapeutic problem-solving.",
  },
  {
    id: "EPAS-9",
    title: "EPAS 9: Evaluation of Practice & Client Outcomes",
    description:
      "Critically monitors and evaluates client progress, intervention efficacy, and systematic service termination.",
  },
];

interface TraineeOption {
  allocationId: string;
  cycleId: string;
  studentName: string;
  matricNumber: string;
  agencyName: string;
  existingAssessments: {
    stage: string;
    totalScore: number;
    submittedAt: string | Date;
  }[];
}

interface Props {
  trainees: TraineeOption[];
  evaluatorPersonId: string;
  evaluatorType: "FIELD_SUPERVISOR" | "ACADEMIC_SUPERVISOR";
  tenantSlug: string;
}

export function RubricFormClient({
  trainees,
  evaluatorPersonId,
  evaluatorType,
  tenantSlug,
}: Props) {
  const [selectedAllocId, setSelectedAllocId] = useState<string>(trainees[0]?.allocationId || "");
  const [stage, setStage] = useState<"MIDPOINT" | "FINAL">("FINAL");
  const [scores, setScores] = useState<Record<string, number>>({
    "EPAS-1": 4,
    "EPAS-2": 4,
    "EPAS-3": 4,
    "EPAS-4": 3,
    "EPAS-5": 3,
    "EPAS-6": 5,
    "EPAS-7": 4,
    "EPAS-8": 4,
    "EPAS-9": 4,
  });
  const [qualitativeRemarks, setQualitativeRemarks] = useState<string>("");
  const [recommendations, setRecommendations] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selectedTrainee = trainees.find((t) => t.allocationId === selectedAllocId);

  // Compute calculated percentage score: sum of 9 items (max 9 * 5 = 45) scaled to 100%
  const totalRaw = Object.values(scores).reduce((a, b) => a + b, 0);
  const calculatedPercentage = Math.round((totalRaw / 45) * 100 * 10) / 10;

  const handleScoreChange = (competencyId: string, val: number) => {
    setScores((prev) => ({ ...prev, [competencyId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainee) return;
    setIsSubmitting(true);
    setToastMessage(null);

    const formData = new FormData();
    formData.append("cycleId", selectedTrainee.cycleId);
    formData.append("allocationId", selectedTrainee.allocationId);
    formData.append("evaluatorPersonId", evaluatorPersonId);
    formData.append("evaluatorType", evaluatorType);
    formData.append("stage", stage);
    formData.append("rubricPayload", JSON.stringify(scores));
    formData.append("totalScore", calculatedPercentage.toString());
    formData.append("maxScore", "100");
    formData.append("qualitativeRemarks", qualitativeRemarks);
    formData.append("recommendations", recommendations);
    formData.append("tenantSlug", tenantSlug);

    const res = await submitAssessmentEvaluationAction(formData);

    if (res.success) {
      setToastMessage({
        type: "success",
        text: `Evaluation successfully saved. Final score: ${calculatedPercentage}%.`,
      });
      setTimeout(() => {
        setToastMessage(null);
      }, 3000);
    } else {
      setToastMessage({ type: "error", text: res.error || "Failed to submit evaluation." });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8">
      {/* Selector & Stage Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
            Select Trainee to Evaluate
          </label>
          <select
            value={selectedAllocId}
            onChange={(e) => setSelectedAllocId(e.target.value)}
            className="w-full md:w-96 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            {trainees.map((t) => (
              <option key={t.allocationId} value={t.allocationId}>
                {t.studentName} ({t.matricNumber}) — {t.agencyName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Assessment Milestone
            </label>
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setStage("MIDPOINT")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  stage === "MIDPOINT" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                Midpoint Review
              </button>
              <button
                type="button"
                onClick={() => setStage("FINAL")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  stage === "FINAL" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500"
                }`}
              >
                Final Evaluation
              </button>
            </div>
          </div>
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
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Rubric Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rubric Matrix */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                CSWE 9 Core Competency Assessment Matrix
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rating scale: 1 = Unsatisfactory | 2 = Emerging | 3 = Competent | 4 = Proficient | 5 = Exemplary
              </p>
            </div>

            {/* Live Score Counter */}
            <div className="bg-emerald-50 border border-emerald-200 px-5 py-2.5 rounded-2xl text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Composite Rubric Score
              </span>
              <span className="text-2xl font-black text-emerald-700">
                {calculatedPercentage}%
              </span>
              <span className="text-[10px] text-emerald-600 font-medium block">
                ({totalRaw} / 45 Points)
              </span>
            </div>
          </div>

          {/* Competency Items */}
          <div className="space-y-6 divide-y divide-slate-100">
            {CSWE_COMPETENCIES.map((comp) => {
              const currentVal = scores[comp.id] || 3;

              return (
                <div key={comp.id} className="pt-6 first:pt-0 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-900">{comp.title}</h4>
                      <p className="text-xs text-slate-500 max-w-2xl">{comp.description}</p>
                    </div>

                    {/* Radio Pill Selector */}
                    <div className="flex items-center space-x-1.5 flex-shrink-0 pt-2 sm:pt-0">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleScoreChange(comp.id, val)}
                          className={`w-9 h-9 rounded-xl text-xs font-bold transition-all border ${
                            currentVal === val
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Qualitative Remarks & Recommendations */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            Qualitative Performance Commentary & Recommendations
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Detailed Supervisor Appraisal & Demonstrated Strengths *
              </label>
              <textarea
                value={qualitativeRemarks}
                onChange={(e) => setQualitativeRemarks(e.target.value)}
                required
                rows={4}
                placeholder="Highlight client rapport, case documentation accuracy, problem-solving under pressure, ethical integrity..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Development Directives & Next Steps for Professional Practice
              </label>
              <textarea
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                rows={3}
                placeholder="Recommended areas for continuing education or field practice enhancement..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">
            Evaluating as: <span className="font-bold text-slate-800">{evaluatorType}</span>. This
            official record directly updates the student's cohort gradebook.
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? "Committing Rubric..." : "Commit Official Evaluation"}
          </button>
        </div>
      </form>
    </div>
  );
}
