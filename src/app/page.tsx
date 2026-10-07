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
  CheckCircle2,
  Clock,
  Compass,
  Users
} from "lucide-react";

export default function HomePage() {
  const gateways = [
    {
      id: "practice",
      number: "01",
      title: "Students & Interns",
      subtitle: "Track hours, build skills, and get verified",
      description:
        "Log your fieldwork hours, receive timely feedback from agency supervisors, and graduate with an accredited, tamper-proof portfolio of your experience.",
      icon: GraduationCap,
      accentColor: "from-blue-600 to-indigo-600",
      lightBg: "bg-blue-50/70 border-blue-200/60 text-blue-900",
      btnColor: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20",
      href: "/unilag/student",
      features: [
        "Simple digital logbook with built-in safety boundaries",
        "Confidential document uploads protecting client privacy",
        "Visual progress across core professional competencies",
        "Verified, portable portfolio for your future career",
      ],
      badge: "Student Hub",
    },
    {
      id: "help",
      number: "02",
      title: "Get Support",
      subtitle: "Find local care and social welfare services",
      description:
        "Connect with accredited care agencies, trained social workers, and community assistance programs for elderly care, family support, or counseling.",
      icon: HeartHandshake,
      accentColor: "from-rose-500 to-pink-600",
      lightBg: "bg-rose-50/70 border-rose-200/60 text-rose-900",
      btnColor: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20",
      href: "/gateways/help",
      features: [
        "Confidential and simple care request form",
        "Verified community programs and social welfare NGOs",
        "Support networks for families, children, and elders",
        "Vetted local care providers you can count on",
      ],
      badge: "Community Care",
    },
    {
      id: "provider",
      number: "03",
      title: "Volunteer & Help",
      subtitle: "Offer your skills and support people in need",
      description:
        "Put your training and compassion into action. Register your skills, discover community initiatives, and collaborate with verified welfare agencies.",
      icon: UserCheck,
      accentColor: "from-amber-500 to-orange-600",
      lightBg: "bg-amber-50/70 border-amber-200/60 text-amber-900",
      btnColor: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20",
      href: "/gateways/provider",
      features: [
        "Simple practitioner and volunteer verification",
        "Meaningful matches with community assistance needs",
        "Clear safety and engagement guidelines",
        "Transparent care and activity tracking",
      ],
      badge: "Care Providers",
    },
    {
      id: "organisation",
      number: "04",
      title: "Universities & Agencies",
      subtitle: "Manage fieldwork placements and evaluations",
      description:
        "Seamlessly coordinate placement cycles, student rosters, partner host agencies, supervisor sign-offs, and final transcripts in one unified portal.",
      icon: Building2,
      accentColor: "from-emerald-600 to-teal-700",
      lightBg: "bg-emerald-50/70 border-emerald-200/60 text-emerald-900",
      btnColor: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20",
      href: "/unilag/admin",
      features: [
        "Smooth step-by-step placement lifecycle management",
        "Smart matching between students and host agencies",
        "Combined university and field supervisor reviews",
        "Verified gradebooks and official completion transcripts",
      ],
      badge: "Institutional Portal",
    },
  ];

  const coreBenefits = [
    {
      title: "Verified Activity Logs",
      desc: "Accurate, tamper-proof logs of hours, activities, and supervisor feedback that prove real experience.",
      icon: FileCheck2,
    },
    {
      title: "Skills & Milestones",
      desc: "Clear visual tracking of core professional competencies as students progress through their placement.",
      icon: Layers,
    },
    {
      title: "Built-In Safety Safeguards",
      desc: "Intelligent checks that ensure students only perform tasks appropriate for their training level.",
      icon: ShieldCheck,
    },
    {
      title: "Timely Guidance & Support",
      desc: "Spot challenges early so academic and field supervisors can step in with personalized assistance.",
      icon: Activity,
    },
    {
      title: "Verified Career Portfolio",
      desc: "A portable, certified record of achievements that graduates can confidently share with employers.",
      icon: Award,
    },
    {
      title: "Compassionate Care Matching",
      desc: "Thoughtfully connect community care inquiries to accredited local helpers and support programs.",
      icon: Sparkles,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold tracking-wide mb-6">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Fieldwork & Community Care, Simplified
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Practicum<span className="text-emerald-400">OS</span>
          </h1>

          <p className="text-lg sm:text-2xl font-normal text-slate-200 max-w-3xl mx-auto mb-4 leading-relaxed">
            The modern platform connecting students, universities, and care providers.
          </p>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            Manage student internships with confidence, ensure high standards of safety, and bridge communities with trusted local care services.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/unilag/admin"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all text-sm"
            >
              Explore UNILAG University Portal
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#gateways"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-semibold px-6 py-3.5 rounded-xl border border-slate-700 transition-all text-sm"
            >
              Choose Your Path
            </a>
          </div>
        </div>

        {/* Live System Stats Cards */}
        <div className="max-w-5xl mx-auto mt-12 sm:mt-16 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-center">
          <div className="bg-slate-900/80 backdrop-blur rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-sm">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">400+</div>
            <div className="text-xs text-slate-300 font-medium mt-1">Hours Tracked</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Real-time verification</div>
          </div>
          <div className="bg-slate-900/80 backdrop-blur rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-sm">
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-400">100%</div>
            <div className="text-xs text-slate-300 font-medium mt-1">Step-by-Step</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Guided placement journey</div>
          </div>
          <div className="bg-slate-900/80 backdrop-blur rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-sm">
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-400">Safety First</div>
            <div className="text-xs text-slate-300 font-medium mt-1">Practice Boundaries</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Protecting students & clients</div>
          </div>
          <div className="bg-slate-900/80 backdrop-blur rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-sm">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">Strict Privacy</div>
            <div className="text-xs text-slate-300 font-medium mt-1">Protected Records</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Confidential client care</div>
          </div>
        </div>
      </section>

      {/* The 4 Gateways Section */}
      <section id="gateways" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Tailored Experiences
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-3">
            Designed for Every Role in Practice & Care
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Whether you are learning in the field, organizing student cohorts, or seeking community assistance, we have a workspace built for you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {gateways.map((gw) => {
            const Icon = gw.icon;
            return (
              <div
                key={gw.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
                      Option {gw.number}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      {gw.badge}
                    </span>
                  </div>

                  <div className="flex items-start gap-4 mb-3">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${gw.accentColor} text-white shadow-md flex-shrink-0 group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{gw.title}</h3>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">
                        {gw.subtitle}
                      </p>
                    </div>
                  </div>

                  <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                    {gw.description}
                  </p>

                  <div className="space-y-2.5 mb-2">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      What You Can Do:
                    </div>
                    {gw.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={gw.href}
                    className={`inline-flex items-center justify-center font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm ${gw.btnColor}`}
                  >
                    Enter Workspace
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                  <span className="text-xs text-slate-400 font-medium">Instant Access</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Core Domain Benefits Section */}
      <section className="bg-white border-t border-b border-slate-200/80 py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Reliable Foundation
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-3">
              Built on Trust, Safety & Accountability
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Every feature is built around the real-world needs of social work, health sciences, and community care education.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {coreBenefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-50/70 hover:bg-white rounded-2xl p-6 border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mb-2">
                      {benefit.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 border-t border-slate-800 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div>
            &copy; 2026 PracticumOS. Fieldwork education and community care placements.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-slate-400">
            <span>Confidential Records</span>
            <span>Supervisor Verified</span>
            <span>Ethical Safeguards</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
