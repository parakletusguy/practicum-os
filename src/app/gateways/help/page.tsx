"use client";

import { useState } from "react";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/Navbar";
import { 
  HeartHandshake, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Lock, 
  Info,
  Sparkles,
  PhoneCall,
  Clock,
  MapPin
} from "lucide-react";
import { NEED_CATEGORIES_CATALOG, NeedCategoryType } from "@/modules/needs-matching/types";
import { submitNeedRequestAction } from "@/modules/needs-matching/actions";

export default function NeedHelpPage() {
  const [selectedCategory, setSelectedCategory] = useState<NeedCategoryType>("ELDERLY_CARE");
  const [urgencyLevel, setUrgencyLevel] = useState<"LOW" | "STANDARD" | "URGENT" | "CRITICAL">("STANDARD");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationCity, setLocationCity] = useState("Lagos");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    caseToken: string;
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await submitNeedRequestAction({
      firstName,
      lastName,
      email,
      phone,
      category: selectedCategory,
      title,
      description,
      urgencyLevel,
      locationCity,
    });

    setLoading(false);

    if (res.success && res.caseToken) {
      setResult({
        caseToken: res.caseToken,
        message: res.message,
      });
    } else {
      setError(res.error || "An error occurred submitting your request.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-rose-900 via-slate-900 to-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <HeartHandshake className="w-4 h-4" />
            Gateway 02: Community Care & Welfare Intake
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            I Need Help
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Connect with accredited social care agencies, verified community practitioners, and supervised social welfare programs.
          </p>
        </div>
      </section>

      {/* Urgent Safeguarding Notice */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 text-amber-900 shadow-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <strong className="font-bold">Immediate Crisis or Emergency?</strong> If you or someone you know is in immediate life-threatening physical danger, child abuse crisis, or severe psychological trauma, please reach out to emergency services or call the 24/7 National Emergency Hotline (<strong>112 / 767</strong> in Nigeria) immediately.
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex-1">
        {result ? (
          <div className="bg-white rounded-2xl border border-emerald-200 p-8 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Request Logged Safely
            </span>

            <h2 className="text-2xl font-bold text-slate-900 mt-4 mb-2">
              Your Care Request Has Been Registered
            </h2>

            <p className="text-sm text-slate-600 max-w-lg mx-auto mb-6">
              Our semantic matchmaking engine has assigned a confidential, de-identified reference code. Certified intake workers and accredited agencies can now review your request.
            </p>

            {/* Case Token Badge */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-md mx-auto mb-6">
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                Zero-PII Case Reference Token
              </div>
              <div className="text-2xl font-mono font-bold text-slate-800 tracking-wider">
                {result.caseToken}
              </div>
              <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" /> Encrypted & Anonymized for Safeguarding
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/gateways/matching"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                View Care Matcher Desk
              </Link>
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setTitle("");
                  setDescription("");
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                Submit Another Request
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

            {/* Step 1: Select Care Category */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-extrabold flex items-center justify-center">1</span>
                  Select Care Category
                </h3>
                <span className="text-xs text-slate-500">Pick the primary area of assistance</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.values(NEED_CATEGORIES_CATALOG).map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`text-left p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? "border-rose-500 bg-rose-50/70 shadow-sm ring-1 ring-rose-500"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="font-semibold text-xs sm:text-sm text-slate-900 mb-1 flex items-center justify-between">
                        {cat.label}
                        {isSelected && <div className="w-2 h-2 rounded-full bg-rose-500" />}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {cat.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Need Description & Urgency */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-extrabold flex items-center justify-center">2</span>
                  Describe the Need
                </h3>
                <div className="flex items-center gap-1 text-xs text-emerald-600">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Auto-Sanitized Anti-PII</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Brief Summary Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elderly mother living alone needs companionship and medication reminder visits"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Detailed Situation & Desired Support *
                  </label>
                  <span className="text-xs text-slate-400">Min. 15 characters</span>
                </div>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the context, schedule requirements, mobility or language considerations. Do not write full residential addresses or credit cards; those will be scrubbed automatically."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Urgency Level
                  </label>
                  <select
                    value={urgencyLevel}
                    onChange={(e) => setUrgencyLevel(e.target.value as any)}
                    className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="LOW">Low (Within next month / Planning ahead)</option>
                    <option value="STANDARD">Standard (Within 1-2 weeks)</option>
                    <option value="URGENT">Urgent (Within 48-72 hours)</option>
                    <option value="CRITICAL">Critical (Immediate social service assessment needed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Location (City / LGA / State) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Yaba, Lagos Mainland, Lagos"
                    value={locationCity}
                    onChange={(e) => setLocationCity(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Contact & Privacy Information */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-extrabold flex items-center justify-center">3</span>
                  Contact Information (Held in Confidence)
                </h3>
                <span className="text-xs text-slate-400">Used only by verified coordinators</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Ngozi"
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Obi"
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ngozi.obi@example.com"
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Zero-PII Token Encrypted</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-rose-600/20 text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? "Registering Safely..." : "Submit Care Request"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
