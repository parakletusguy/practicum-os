"use client";

import { useState } from "react";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/Navbar";
import { 
  UserCheck, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Award, 
  Sparkles, 
  HeartHandshake,
  Briefcase,
  BadgeCheck
} from "lucide-react";
import { registerServiceProviderAction } from "@/modules/needs-matching/actions";

const AVAILABLE_SPECIALTIES = [
  "Elderly Care & Dementia",
  "Child Welfare & Protection",
  "Disability & Special Needs Support",
  "Psychosocial Counseling",
  "Trauma & Grief Recovery",
  "Family Mediation",
  "Home Convalescent Care",
  "Community Outreach & Food Security",
  "Substance Abuse Recovery",
  "Medical Social Work",
];

export default function ProviderOnboardingPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    "Elderly Care & Dementia",
    "Psychosocial Counseling",
  ]);
  const [yearsExperience, setYearsExperience] = useState<number>(3);
  const [primaryCity, setPrimaryCity] = useState("Lagos");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<string | null>(null);

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      if (selectedSkills.length > 1) {
        setSelectedSkills(selectedSkills.filter((s) => s !== skill));
      }
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await registerServiceProviderAction({
      firstName,
      lastName,
      email,
      phone,
      headline,
      bio,
      skills: selectedSkills,
      yearsExperience,
      primaryCity,
    });

    setLoading(false);

    if (res.success) {
      setSuccessResult(res.message || "Provider credentials registered successfully!");
    } else {
      setError(res.error || "Failed to register provider.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-amber-900 via-slate-900 to-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <UserCheck className="w-4 h-4" />
            Gateway 03: Caregiver & Practitioner Portal
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            I Can Help
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Put your professional caregiving, clinical experience, or volunteer skills to work. Connect with verified community needs and accredited institutions.
          </p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex-1">
        {successResult ? (
          <div className="bg-white rounded-2xl border border-emerald-200 p-8 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4">
              <BadgeCheck className="w-10 h-10" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Provider Credentials Verified
            </span>

            <h2 className="text-2xl font-bold text-slate-900 mt-4 mb-2">
              Welcome to the PracticumOS Provider Network
            </h2>

            <p className="text-sm text-slate-600 max-w-lg mx-auto mb-6">
              Your profile is registered in our certified provider registry. You are now discoverable by our semantic matchmaking engine when matching community care inquiries.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/gateways/matching"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                Explore Care Matcher Desk
              </Link>
              <button
                type="button"
                onClick={() => setSuccessResult(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                Update Profile
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8">
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium">
                {error}
              </div>
            )}

            {/* Section 1: Basic Identity */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold flex items-center justify-center">1</span>
                  Personal & Contact Details
                </h3>
                <span className="text-xs text-slate-400">Universal Practitioner Identity</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Fatima"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Bello"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Professional Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="fatima.bello@practitioner.org"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 802 000 0000"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Professional Qualifications */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold flex items-center justify-center">2</span>
                  Professional Headline & Experience
                </h3>
                <span className="text-xs text-slate-400">Displayed on Caregiver Profile</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Professional Title / Headline *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Licensed Clinical Social Worker & Geriatric Care Specialist"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Professional Biography & Practice Background *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Summarize your professional training, clinical licenses, institutional affiliations, and caregiving philosophy..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Years of Relevant Experience
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(parseInt(e.target.value) || 0)}
                    className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Primary City / Coverage Area *
                  </label>
                  <input
                    type="text"
                    required
                    value={primaryCity}
                    onChange={(e) => setPrimaryCity(e.target.value)}
                    placeholder="e.g. Lagos, Ikeja / Mainland"
                    className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Specialty Tags */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold flex items-center justify-center">3</span>
                  Core Specialties & Practice Areas
                </h3>
                <span className="text-xs text-slate-500">Select all that apply</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {AVAILABLE_SPECIALTIES.map((spec) => {
                  const active = selectedSkills.includes(spec);
                  return (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => toggleSkill(spec)}
                      className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
                        active
                          ? "bg-amber-500 border-amber-600 text-slate-950 shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {active ? `✓ ${spec}` : `+ ${spec}`}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>Practice Passport Certified</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-amber-600/20 text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? "Registering..." : "Activate Provider Credentials"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
