import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ShieldAlert, ShieldCheck, AlertTriangle, Lock } from "lucide-react";

export default async function AdminScopeGuardPage({
  params,
}: {
  params: { tenant: string };
}) {
  const tenant = await prisma.organisation.findUnique({
    where: { slug: params.tenant },
  });

  if (!tenant) {
    notFound();
  }

  const cycle = await prisma.practicumCycle.findFirst({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });

  const scopeRules = (cycle?.scopeGuardRules as any[]) || [
    {
      activity: "Unaccompanied High-Risk Home Visit",
      allowedScope: "DIRECT_SUPERVISION",
      rationale: "Safety precaution for students in unfamiliar or hostile environments.",
    },
    {
      activity: "Court Representation / Evidence Deposition",
      allowedScope: "DIRECT_SUPERVISION",
      rationale: "Statutory legal proceedings require licensed supervisor testimony.",
    },
    {
      activity: "Routine Case File Review & Client Intake",
      allowedScope: "INDEPENDENT",
      rationale: "Foundational casework skill suitable for senior students.",
    },
    {
      activity: "Community Sensitization & Outreach",
      allowedScope: "CO_PRACTICE",
      rationale: "Collaborative team exercise with partner agency workers.",
    },
    {
      activity: "Statutory Child Removal & Emergency Foster Placement",
      allowedScope: "DIRECT_SUPERVISION",
      rationale: "High-consequence legal action requiring licensed child welfare officer.",
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 uppercase tracking-wider mb-1">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          Clinical Governance & Safety Engine
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          ScopeGuard™ Practice Boundary Rules
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure clinical practice constraints and boundary enforcement policies to ensure trainee safety, ethical compliance, and safeguarding protocols.
        </p>
      </div>

      {/* ScopeGuard Policy Card */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
            Active Boundary Engine
          </span>
          <h3 className="text-xl font-bold">ScopeGuard Algorithmic Enforcement</h3>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Whenever a student submits a practice event, ScopeGuard intercepts high-risk activities. Entries performed outside authorized supervision levels are automatically flagged for review.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-800/80 px-5 py-3 rounded-2xl border border-slate-700">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
          <div>
            <span className="text-xs font-bold text-white block">Real-time Policy</span>
            <span className="text-[10px] text-emerald-400">Zero AI Autonomous Grade</span>
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Institutional Practice Boundary Rules ({scopeRules.length} Active Rules)
          </h3>
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
            ENFORCED
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {scopeRules.map((rule, idx) => (
            <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">{rule.activity}</h4>
                <p className="text-xs text-slate-500">
                  {rule.rationale || "Adheres to national child welfare & NASW ethical guidelines."}
                </p>
              </div>

              <div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    rule.allowedScope === "DIRECT_SUPERVISION"
                      ? "bg-rose-50 text-rose-800 border-rose-200"
                      : rule.allowedScope === "CO_PRACTICE"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-emerald-50 text-emerald-800 border-emerald-200"
                  }`}
                >
                  Required: {rule.allowedScope.replace("_", " ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
