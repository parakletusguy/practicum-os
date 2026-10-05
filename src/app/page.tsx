import Link from "next/link";
import { PublicNavbar } from "@/components/layout/Navbar";
import { 
  GraduationCap, 
  HeartHandshake, 
  UserCheck, 
  Building2, 
  ArrowRight, 
  ShieldCheck, 
  FileCheck2, 
  Layers, 
  Activity,
  Award,
  Sparkles,
  ExternalLink
} from "lucide-react";

export default function HomePage() {
  const gateways = [
    {
      id: "practice",
      number: "01",
      title: "I Need Practice",
      targetAudience: "Students, Trainees & Interns",
      description:
        "Access your official E-Practicum Guide, log verified practice events, track Practice DNA competencies, and build your portable Practice Passport.",
      icon: GraduationCap,
      accentColor: "from-blue-600 to-indigo-700",
      lightBg: "bg-blue-50 border-blue-200 text-blue-900",
      btnColor: "bg-blue-600 hover:bg-blue-700 text-white",
      href: "/unilag/student",
      features: [
        "Interactive E-Logbook with ScopeGuard",
        "Sanitized Evidence Uploads (Zero PII)",
        "Practice DNA Competency Graph",
        "Portable Practice Passport",
      ],
      badge: "Trainee Gateway",
    },
    {
      id: "help",
      number: "02",
      title: "I Need Help",
      targetAudience: "Individuals, Families & Communities",
      description:
        "Describe your care or welfare need. Find verified elder care, disability support, child welfare, psychosocial counseling, or NGO social programs.",
      icon: HeartHandshake,
      accentColor: "from-rose-500 to-pink-600",
      lightBg: "bg-rose-50 border-rose-200 text-rose-900",
      btnColor: "bg-rose-600 hover:bg-rose-700 text-white",
      href: "/gateways/help",
      features: [
        "Structured Human Needs Intake",
        "Verified Social Welfare Programs",
        "Family & Community Support Networks",
        "Vetted Local Service Providers",
      ],
      badge: "Community Gateway",
    },
    {
      id: "provider",
      number: "03",
      title: "I Can Help",
      targetAudience: "Caregivers, Volunteers & Practitioners",
      description:
        "Put your skills and compassion to work. Register your practice credentials, offer companionship or caregiving, and connect with accredited agencies.",
      icon: UserCheck,
      accentColor: "from-amber-500 to-orange-600",
      lightBg: "bg-amber-50 border-amber-200 text-amber-900",
      btnColor: "bg-amber-600 hover:bg-amber-700 text-white",
      href: "/gateways/provider",
      features: [
        "Practitioner Credential Verification",
        "Community Need Matching",
        "Safe Engagement Guidelines",
        "Continuity of Care Logging",
      ],
      badge: "Provider Gateway",
    },
    {
      id: "organisation",
      number: "04",
      title: "I Represent an Organisation",
      targetAudience: "Universities, Ministries, NGOs & Hosts",
      description:
        "Manage end-to-end practicum cycles, bulk student rosters, host agency capacities, algorithmic matching, dual-supervision, and official gradebooks.",
      icon: Building2,
      accentColor: "from-emerald-600 to-teal-700",
      lightBg: "bg-emerald-50 border-emerald-200 text-emerald-900",
      btnColor: "bg-emerald-600 hover:bg-emerald-700 text-white",
      href: "/unilag/admin",
      features: [
        "Full 30-Step Practicum Lifecycle",
        "Automated Matching & Posting Letters",
        "Dual-Supervision & Early Warning",
        "Dynamic Grading & Official Transcripts",
      ],
      badge: "Enterprise Gateway",
    },
  ];

  const intelligenceEngines = [
    {
      title: "Practice Event",
      desc: "Structured, tamper-evident record of practice activities, verified hours, supervision level, and critical reflections.",
      icon: FileCheck2,
    },
    {
      title: "Practice DNA",
      desc: "An evolving competency representation synthesized from verified evidence rather than crude hour counts.",
      icon: Layers,
    },
    {
      title: "ScopeGuard",
      desc: "Practice safety governor enforcing whether activities require direct observation, co-practice, or independent practice.",
      icon: ShieldCheck,
    },
    {
      title: "Adaptive Practicum",
      desc: "Competency gap identification during mid-practicum that dynamically adjusts supervision intensity and tasks.",
      icon: Activity,
    },
    {
      title: "Practice Passport",
      desc: "A portable, lifelong credential of verified skills and practice history without exposing confidential client PII.",
      icon: Award,
    },
    {
      title: "Needs-to-Services",
      desc: "Semantic ontology connecting vulnerable human inquiries to trusted community practitioners and NGO programs.",
      icon: Sparkles,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <ShieldCheck className="w-4 h-4" />
            Production-Ready Multi-Tenant Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
            Practicum<span className="text-emerald-400">OS</span>
          </h1>

          <p className="text-xl sm:text-2xl font-light text-slate-300 max-w-3xl mx-auto mb-8">
            The Operating System for Practice, Care & Social Welfare.
          </p>

          <p className="text-base text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Unifying higher-education field practicum, professional accreditation, 
            and community human-services delivery into a single verifiable, safeguarding-first platform.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/unilag/admin"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/25 transition-all text-sm"
            >
              Demo University Workspace (UNILAG)
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#gateways"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-6 py-3 rounded-xl border border-slate-700 transition-all text-sm"
            >
              Explore the 4 Gateways
            </a>
          </div>
        </div>

        {/* Live System Stats */}
        <div className="max-w-5xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-slate-800/60 backdrop-blur rounded-xl p-4 border border-slate-700/50">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400">400+</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Required Hours Managed</div>
          </div>
          <div className="bg-slate-800/60 backdrop-blur rounded-xl p-4 border border-slate-700/50">
            <div className="text-2xl sm:text-3xl font-bold text-blue-400">30 Steps</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">End-to-End Workflow</div>
          </div>
          <div className="bg-slate-800/60 backdrop-blur rounded-xl p-4 border border-slate-700/50">
            <div className="text-2xl sm:text-3xl font-bold text-purple-400">ScopeGuard</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Practice Safety Governor</div>
          </div>
          <div className="bg-slate-800/60 backdrop-blur rounded-xl p-4 border border-slate-700/50">
            <div className="text-2xl sm:text-3xl font-bold text-amber-400">PostgreSQL 17</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Multi-Tenant Database</div>
          </div>
        </div>
      </section>

      {/* The 4 Gateways Section */}
      <section id="gateways" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Unified Entry Architecture
          </span>
          <h2 className="text-3xl font-bold text-slate-900 mt-3 mb-4">
            Four Gateways. One Universal Operating System.
          </h2>
          <p className="text-slate-600 text-base">
            Every user interacts through a tailored gateway designed for their role in the practice and care ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {gateways.map((gw) => {
            const Icon = gw.icon;
            return (
              <div
                key={gw.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
                      Gateway {gw.number}
                    </span>
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      {gw.badge}
                    </span>
                  </div>

                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${gw.accentColor} text-white shadow-md`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{gw.title}</h3>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        {gw.targetAudience}
                      </p>
                    </div>
                  </div>

                  <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                    {gw.description}
                  </p>

                  <div className="space-y-2 mb-6">
                    <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      Key Capabilities:
                    </div>
                    {gw.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={gw.href}
                    className={`inline-flex items-center justify-center font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm ${gw.btnColor}`}
                  >
                    Enter Gateway
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                  <span className="text-xs text-slate-400">Direct Entry Access</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Core Domain Intelligence Section */}
      <section className="bg-slate-100/70 border-t border-b border-slate-200 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200">
              Foundational Intelligence Layer
            </span>
            <h2 className="text-3xl font-bold text-slate-900 mt-3 mb-4">
              The 6 Core Intelligence Engines
            </h2>
            <p className="text-slate-600 text-base">
              Preserved in every layer of the architecture to guarantee safety, competency rigor, and portability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {intelligenceEngines.map((engine, idx) => {
              const Icon = engine.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">
                      {engine.title}
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {engine.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; 2026 PracticumOS. The Operating System for Practice, Care & Social Welfare.
          </div>
          <div className="flex gap-6">
            <span>Human-in-the-Loop AI Governance</span>
            <span>Zero-PII Evidence Vault</span>
            <span>Anti-Surveillance Ethic</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
