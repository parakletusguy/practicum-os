"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { DEMO_PERSONAS, type DemoPersonaKey } from "@/lib/auth-personas";
import { setActivePersonaAction } from "@/lib/auth-session";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { confirmInstitutionCodeAction, requestInstitutionCodeAction } from "./actions";

export function LoginForm({ destination, demoEnabled, initialMessage, communitySignUp, rsuPilot }: {
  destination: string; demoEnabled: boolean; initialMessage: string | null; communitySignUp: boolean; rsuPilot: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [notice, setNotice] = useState(initialMessage ? { error: true, text: initialMessage } : null);
  const [pending, startTransition] = useTransition();

  function requestCode() {
    setNotice(null);
    startTransition(async () => {
      try {
        if (communitySignUp) {
          const url = new URL("/auth/callback", window.location.origin);
          url.searchParams.set("next", destination);
          const { error } = await createBrowserSupabaseClient().auth.signInWithOtp({
            email: email.trim().toLowerCase(), options: { emailRedirectTo: url.toString() },
          });
          setNotice(error
            ? { error: true, text: error.message }
            : { error: false, text: "Check your email and open the confirmation link in this browser." });
          return;
        }
        const result = await requestInstitutionCodeAction(email, rsuPilot ? "rsu" : undefined);
        setNotice({ error: !result.success, text: result.message });
        if (result.success) setAwaitingCode(true);
      } catch {
        setNotice({ error: true, text: "Sign-in is temporarily unavailable. Try again shortly." });
      }
    });
  }

  function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    startTransition(async () => {
      try {
        const result = await confirmInstitutionCodeAction(email, token, destination, rsuPilot ? "rsu" : undefined);
        if (result.success && result.destination) router.replace(result.destination);
        else setNotice({ error: true, text: result.message ?? "Could not verify sign-in. Try again." });
      } catch {
        setNotice({ error: true, text: "Could not verify sign-in. Try again shortly." });
      }
    });
  }

  function tryDemo(role: DemoPersonaKey) {
    startTransition(async () => {
      const result = await setActivePersonaAction(role);
      if (result.success) router.push(DEMO_PERSONAS[role].defaultPath);
      else setNotice({ error: true, text: "This demo workspace could not be opened." });
    });
  }

  const input = "mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-emerald-600 focus:outline-emerald-600";
  const primary = "w-full rounded-lg bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60";
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900 sm:py-20">
      <div className="mx-auto max-w-md space-y-5">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-emerald-800"><ShieldCheck className="h-5 w-5" /> PracticumOS</Link>
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-1">
            {rsuPilot && <p className="text-sm font-semibold text-emerald-800">Rivers State University · Social Work</p>}
            <h1 className="text-2xl font-bold">{communitySignUp ? "Sign in to community services" : "Sign in to your practicum"}</h1>
            <p className="text-sm leading-6 text-slate-600">
              {communitySignUp ? "Enter your email to receive a confirmation link." : rsuPilot
                ? "Use your university email to verify your account. The practicum office assigns your pilot role."
                : "Use the email address registered with your practicum office. We’ll email you a one-time sign-in code."}
            </p>
          </div>
          {notice && <p role={notice.error ? "alert" : "status"} className={notice.error ? "rounded-lg bg-rose-50 p-3 text-sm text-rose-900" : "rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900"}>{notice.text}</p>}

          {!awaitingCode ? <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); requestCode(); }}>
            <label className="block text-sm font-medium">Email address
              <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} className={input} />
            </label>
            <button className={primary} disabled={pending}>{pending ? "Sending…" : communitySignUp ? "Send confirmation link" : "Email sign-in code"}</button>
            {!communitySignUp && <button type="button" disabled={pending} className="text-sm text-emerald-800 underline" onClick={() => { setNotice(null); setAwaitingCode(true); }}>I already have a code</button>}
          </form> : <form onSubmit={verifyCode} className="space-y-4">
            <label className="block text-sm font-medium">Email address
              <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} className={input} />
            </label>
            <label className="block text-sm font-medium">One-time code
              <input name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" required maxLength={10}
                value={token} onChange={(event) => setToken(event.target.value.replace(/\D/g, ""))} className={input} />
            </label>
            <button className={primary} disabled={pending}>{pending ? "Checking…" : "Confirm sign-in"}</button>
            <div className="flex justify-between gap-4 text-sm text-emerald-800">
              <button type="button" disabled={pending} className="underline" onClick={() => { setAwaitingCode(false); setToken(""); setNotice(null); }}>Use the email form</button>
              <button type="button" disabled={pending || !email.trim()} className="underline" onClick={requestCode}>Request a new code</button>
            </div>
          </form>}
        </section>
        {demoEnabled && <details className="rounded-xl border bg-white p-4 text-sm">
          <summary className="cursor-pointer font-semibold">Open a local demo role</summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {Object.values(DEMO_PERSONAS).map((persona) => <button type="button" key={persona.key} disabled={pending}
              onClick={() => tryDemo(persona.key)} className="rounded border p-2 text-left">{persona.roleLabel}</button>)}
          </div>
        </details>}
      </div>
    </main>
  );
}
