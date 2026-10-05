import { db } from "@/lib/db";
import { 
  BookOpen, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Scale, 
  HeartHandshake, 
  Lock,
  Layers,
  FileCheck2
} from "lucide-react";

interface GuidePageProps {
  params: {
    tenant: string;
  };
}

export const dynamic = "force-dynamic";

export default async function GuidePage({ params }: GuidePageProps) {
  const tenantSlug = params.tenant;

  const tenant = await db.organisation.findUnique({
    where: { slug: tenantSlug },
  });

  const activeCycle = await db.practicumCycle.findFirst({
    where: {
      tenantId: tenant?.id,
      status: "ACTIVE",
    },
  });

  const guideConfig: any = activeCycle?.eGuideConfig || {};
  const requiredHours = activeCycle?.requiredHours || 400;
  const weeklyPace = Math.ceil(requiredHours / 16);

  const competencyDomains = [
    { code: "EPAS-1", title: "Demonstrate Ethical & Professional Behavior", desc: "Integrate ethical decision-making, professional boundaries, and critical self-reflection." },
    { code: "EPAS-2", title: "Advance Human Rights & Social Justice", desc: "Advocate for marginalized individuals, vulnerable families, and systemic community equity." },
    { code: "EPAS-3", title: "Anti-Oppressive & Diversity Practice", desc: "Demonstrate cultural humility, active listening, and respect for lived experience." },
    { code: "EPAS-4", title: "Practice-Informed Research", desc: "Utilize quantitative and qualitative research insights to inform clinical interventions." },
    { code: "EPAS-5", title: "Policy Practice & Statutory Mandates", desc: "Navigate social welfare legislation, child rights acts, and institutional policies." },
    { code: "EPAS-6", title: "Engagement with Service Users", desc: "Establish trauma-informed rapport with individuals, families, and community groups." },
    { code: "EPAS-7", title: "Holistic Psychosocial Assessment", desc: "Synthesize developmental, environmental, and behavioral assessment data." },
    { code: "EPAS-8", title: "Targeted Multi-Disciplinary Intervention", desc: "Execute collaborative care plans, case conferences, and rehabilitation goals." },
    { code: "EPAS-9", title: "Evaluation of Practice Outcomes", desc: "Measure intervention efficacy and formulate continuous improvement feedback." },
  ];

  const safeguardingRules = [
    {
      title: "Zero Identifiable Client Data",
      text: "Never write a service-user's real name, national identity number, or residential street address in your logbook. Use anonymized case references (e.g. CASE-2026-CFW-092).",
      icon: Lock,
    },
    {
      title: "ScopeGuard Safety Bounds",
      text: "Unaccompanied high-risk home visits, psychiatric crisis calls, and court depositions are strictly forbidden without direct on-site supervisor accompaniment.",
      icon: ShieldCheck,
    },
    {
      title: "Evidence Media Sanitization",
      text: "Never upload identifiable face photos of clients or minors. The platform automatically scrubs EXIF GPS metadata, but visual anonymization is mandatory.",
      icon: AlertTriangle,
    },
    {
      title: "Anti-Surveillance Dignity",
      text: "PracticumOS does not continuously track your GPS coordinates. Practice events are verified through supervisor observation and agency check-in stamps.",
      icon: Scale,
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
          <span>Student Workspace</span>
          <span>•</span>
          <span className="text-emerald-600">Curriculum & Guidelines</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Interactive E-Practicum Guide
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Institutional curriculum, ethical mandates, ScopeGuard safety bounds, and competency standards.
        </p>
      </div>

      {/* Directorate Welcome Statement */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Welcome from the Directorate of Field Education
            </h3>
            <p className="text-xs text-slate-500">
              Department of Social Work • University of Lagos
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
          {guideConfig.welcomeMessage ||
            "Welcome to the 2026/2027 Senior Field Practicum. Practicum is not an observational exercise; it is an immersive, ethically governed, and supervised clinical journey. Every interaction you log in your PracticumOS E-Logbook contributes to your evolving Practice DNA and lifelong professional credential."}
        </p>

        {/* Target Pace Calculator Bar */}
        <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Requirement</div>
            <div className="text-lg font-extrabold text-emerald-800 mt-0.5">
              {requiredHours} Verified Hours
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Accreditation benchmark</div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Recommended Pace</div>
            <div className="text-lg font-extrabold text-purple-700 mt-0.5">
              ~{weeklyPace} Hours / Week
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Across a 16-week semester</div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Clinical Hurdle</div>
            <div className="text-lg font-extrabold text-blue-700 mt-0.5">
              Midpoint Sign-off
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Mandatory supervisor review</div>
          </div>
        </div>
      </div>

      {/* Safeguarding & Ethics Mandates */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Core Safeguarding & Anti-Surveillance Rules
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {safeguardingRules.map((rule, idx) => {
            const Icon = rule.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{rule.title}</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mt-2">
                    {rule.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Core Competency Framework (9 EPAS Domains) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              Practice DNA Competency Framework (9 Core Domains)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Every practice event must link to at least one of these competencies.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            CSWE & IFSW Aligned
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {competencyDomains.map((c) => (
            <div
              key={c.code}
              className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {c.code}
              </span>
              <h4 className="text-xs font-bold text-slate-900 mt-2 leading-snug">
                {c.title}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                {c.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
