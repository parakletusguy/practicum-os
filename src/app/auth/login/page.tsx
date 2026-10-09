"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  UserCheck, 
  GraduationCap, 
  Stethoscope, 
  BookOpen, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  Mail,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { DEMO_PERSONAS, DemoPersonaKey } from "@/lib/auth-personas";
import { setActivePersonaAction } from "@/lib/auth-session";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loadingPersona, setLoadingPersona] = useState<DemoPersonaKey | null>(null);
  const [customAuthLoading, setCustomAuthLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const demoEnabled =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_PRACTICUM_DEMO_MODE === "true";
  const authConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );

  const handleDemoLogin = async (key: DemoPersonaKey) => {
    setLoadingPersona(key);
    try {
      const result = await setActivePersonaAction(key);
      if (!result.success) {
        throw new Error(result.error || "Demo access is unavailable.");
      }
      const targetPath = DEMO_PERSONAS[key].defaultPath;
      router.push(targetPath);
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Failed to switch persona. Please try again." });
      setLoadingPersona(null);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setCustomAuthLoading(true);
    setMessage(null);

    if (!authConfigured) {
      setCustomAuthLoading(false);
      setMessage({
        type: "error",
        text: "Sign-in is not configured in this environment. Use local demo access or configure Supabase Auth.",
      });
      return;
    }

    try {
      const requestedPath = new URLSearchParams(window.location.search).get("next");
      const nextPath =
        requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
          ? requestedPath
          : "/";
      const redirectUrl = new URL("/auth/callback", window.location.origin);
      redirectUrl.searchParams.set("next", nextPath);

      const { error } = await createBrowserSupabaseClient().auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectUrl.toString() },
      });

      if (error) {
        throw error;
      }

      setMessage({
        type: "success",
        text: "Check your email for a sign-in link. It will return you to PracticumOS.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to send the sign-in link.",
      });
    } finally {
      setCustomAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10 text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <span className="text-3xl font-extrabold tracking-tight">
            Practicum<span className="text-emerald-400">OS</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-100">
          Sign In to Practice, Care & Social Welfare
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Select an instant demo persona to explore, or enter your institutional credentials.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10 space-y-8">
        {demoEnabled && (
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Preview: seeded demo roles</span>
            </div>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold">
              Local preview
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            Explore seeded sample data. These buttons do not authenticate a real user and are disabled in production.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Coordinator */}
            <button
              onClick={() => handleDemoLogin("admin")}
              disabled={loadingPersona !== null}
              className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-700/80 hover:border-emerald-500 text-left transition-all group shadow-xs"
            >
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white group-hover:text-emerald-400">Practicum Director</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs text-slate-300 font-medium">Dr. Adebayo Ogunlesi</p>
                <p className="text-[11px] text-slate-500 truncate">UNILAG Dept. of Social Work</p>
              </div>
            </button>

            {/* Student */}
            <button
              onClick={() => handleDemoLogin("student")}
              disabled={loadingPersona !== null}
              className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-700/80 hover:border-blue-500 text-left transition-all group shadow-xs"
            >
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-slate-950 transition-colors">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white group-hover:text-blue-400">Student Trainee</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs text-slate-300 font-medium">Chukwuemeka Eze</p>
                <p className="text-[11px] text-slate-500 truncate">400L Clinical Placement</p>
              </div>
            </button>

            {/* Field Supervisor */}
            <button
              onClick={() => handleDemoLogin("field")}
              disabled={loadingPersona !== null}
              className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-700/80 hover:border-purple-500 text-left transition-all group shadow-xs"
            >
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-slate-950 transition-colors">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white group-hover:text-purple-400">Field Supervisor</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs text-slate-300 font-medium">Mrs. Ngozi Okonkwo</p>
                <p className="text-[11px] text-slate-500 truncate">Lagos Social Welfare Unit</p>
              </div>
            </button>

            {/* Academic Faculty */}
            <button
              onClick={() => handleDemoLogin("faculty")}
              disabled={loadingPersona !== null}
              className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-700/80 hover:border-amber-500 text-left transition-all group shadow-xs"
            >
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white group-hover:text-amber-400">Academic Faculty</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs text-slate-300 font-medium">Dr. Folashade Adeleke</p>
                <p className="text-[11px] text-slate-500 truncate">Faculty Supervisor & Advisor</p>
              </div>
            </button>
          </div>
        </div>
        )}

        {/* Production authentication */}
        <div className="bg-slate-800/40 backdrop-blur border border-slate-700/60 rounded-2xl p-6 sm:p-8">
          <h3 className="text-sm font-bold text-slate-300 mb-1 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" />
            Institutional sign-in
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Enter your university email address to receive a secure sign-in link.
          </p>

          {message && (
            <div
              role="status"
              aria-live="polite"
              className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-400 mb-1">
                Institutional Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="e.g. yourname@unilag.edu.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-2">
              <Link
                href="/"
                className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                ← Back to Gateways
              </Link>
              <button
                type="submit"
                disabled={customAuthLoading}
                className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm"
              >
                {customAuthLoading ? "Sending Link..." : "Send Sign-in Link"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
