import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate, formatMinutesToHours } from "@/lib/utils";
import { 
  Layers, 
  CheckCircle2, 
  Award, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRight,
  BookOpen
} from "lucide-react";

interface StudentDnaPageProps {
  params: {
    tenant: string;
  };
}

export const dynamic = "force-dynamic";

export default async function StudentDnaPage({ params }: StudentDnaPageProps) {
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
              practiceEvents: {
                where: { verificationStatus: "VERIFIED" },
                orderBy: { eventDate: "desc" },
              },
            },
          },
        },
      },
    },
  });

  const allocation = student?.cohortEnrollments[0]?.allocation;
  const verifiedEvents = allocation?.practiceEvents || [];

  const EPAS_DOMAINS = [
    { code: "EPAS-1", name: "Ethical & Professional Behavior", target: 40 },
    { code: "EPAS-2", name: "Human Rights & Social Justice", target: 35 },
    { code: "EPAS-3", name: "Anti-Oppressive Diversity Practice", target: 35 },
    { code: "EPAS-4", name: "Practice-Informed Research", target: 30 },
    { code: "EPAS-5", name: "Policy Practice & Statutory Mandates", target: 30 },
    { code: "EPAS-6", name: "Engage with Individuals & Families", target: 50 },
    { code: "EPAS-7", name: "Holistic Psychosocial Assessment", target: 50 },
    { code: "EPAS-8", name: "Multi-Disciplinary Intervention", target: 45 },
    { code: "EPAS-9", name: "Evaluation of Practice Outcomes", target: 30 },
  ];

  // Calculate demonstrated hours per domain
  const domainStats = EPAS_DOMAINS.map((domain) => {
    const linkedEvents = verifiedEvents.filter((e) =>
      e.competenciesTagged.some((t) => t.includes(domain.code))
    );

    const totalMinutes = linkedEvents.reduce((sum, e) => sum + e.verifiedMinutes, 0);
    const hours = Number((totalMinutes / 60).toFixed(1));
    const percent = Math.min(100, Math.round((hours / domain.target) * 100));

    return {
      ...domain,
      hours,
      eventCount: linkedEvents.length,
      percent,
      linkedEvents,
    };
  });

  const totalDemonstratedCompetencies = domainStats.filter((d) => d.eventCount > 0).length;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            <span>Core Intelligence Layer</span>
            <span>•</span>
            <span className="text-emerald-600">Practice DNA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Evolving Practice DNA
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Multidimensional competency profile synthesized from verified practice evidence.
          </p>
        </div>

        <Link
          href={`/${tenantSlug}/student/passport`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-sm"
        >
          <Award className="w-4 h-4 text-emerald-400" />
          View Practice Passport
        </Link>
      </div>

      {/* Summary DNA Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg border border-emerald-900/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3 border border-emerald-500/30">
            <Layers className="w-3.5 h-3.5" />
            Verified Competency Growth
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Evidence-Based Competency Profile
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
            Unlike static hour-logging, Practice DNA maps verified clinical interventions against national higher-education accreditation standards.
          </p>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-emerald-400">
              {totalDemonstratedCompetencies} / 9
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">
              Active Domains
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-extrabold text-white">
              {verifiedEvents.length}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">
              Verified Evidence
            </div>
          </div>
        </div>
      </div>

      {/* Competency Radar / Progress Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Competency Domain Mastery
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Accreditation benchmarks vs verified clinical hours accumulated.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {domainStats.map((domain) => (
            <div
              key={domain.code}
              className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {domain.code}
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {domain.hours} / {domain.target} hrs
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 mt-2">
                  {domain.name}
                </h4>

                <div className="mt-3 w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all"
                    style={{ width: `${domain.percent}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                <span>{domain.eventCount} Verified Events</span>
                <span className="font-semibold text-emerald-700">{domain.percent}% of Target</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verified Evidence Linkage Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Evidence Anchors (Verified Practice Events)
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Every point on your Practice DNA graph is linked directly to tamper-evident supervisor endorsements.
        </p>

        <div className="space-y-3">
          {verifiedEvents.map((event) => (
            <div
              key={event.id}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="font-bold text-slate-900 text-sm">
                  {event.activityTitle}
                </div>
                <div className="text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                  <span>{formatDate(event.eventDate)}</span>
                  <span>•</span>
                  <span>{formatMinutesToHours(event.verifiedMinutes)}</span>
                  <span>•</span>
                  <span className="font-mono text-[10px] text-slate-400">Ref: {event.clientRef}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {event.competenciesTagged.map((t, i) => (
                    <span key={i} className="text-[10px] font-medium bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-100">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-left sm:text-right flex-shrink-0">
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-white px-2.5 py-1 rounded-lg border border-emerald-200 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Supervisor Endorsed
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
