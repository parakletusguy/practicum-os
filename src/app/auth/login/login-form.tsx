"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, KeyRound, LoaderCircle, Mail, RotateCw } from "lucide-react";
import { PracticumLogo } from "@/components/layout/PracticumLogo";
import { actionStyle, formControlStyle } from "@/components/ui/action-styles";
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
  const codeForm = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!awaitingCode) return;
    const emailInput = codeForm.current?.querySelector<HTMLInputElement>("input[type=email]");
    const codeInput = codeForm.current?.querySelector<HTMLInputElement>("input[name=code]");
    (emailInput?.value.trim() ? codeInput : emailInput)?.focus();
  }, [awaitingCode]);

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

  const primary = actionStyle("primary", "w-full");
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900 sm:py-20">
      <div className="mx-auto max-w-md space-y-5">
        <Link href={rsuPilot ? "/rsu" : "/"} className="inline-flex rounded-lg text-slate-900"><PracticumLogo /></Link>
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-1">
            {rsuPilot && <p className="text-sm font-semibold text-emerald-800">Rivers State University · Social Work</p>}
            <h1 className="text-2xl font-bold">{communitySignUp ? "Sign in to community services" : "Sign in to your practicum"}</h1>
            <p className="text-sm leading-6 text-slate-600">
              {communitySignUp ? "Enter your email to receive a confirmation link." : awaitingCode
                ? "Enter the one-time code sent to your email address."
                : "Use the email address registered with your practicum office. We’ll email you a one-time sign-in code."}
            </p>
          </div>
          {notice && <p role={notice.error ? "alert" : "status"} className={notice.error ? "rounded-lg bg-rose-50 p-3 text-sm text-rose-900" : "rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900"}>{notice.text}</p>}

          {!awaitingCode ? <form className="space-y-4" aria-busy={pending} onSubmit={(event) => { event.preventDefault(); requestCode(); }}>
            <label className="block text-sm font-medium">Email address
              <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} className={formControlStyle} />
            </label>
            <button type="submit" className={primary} disabled={pending}>
              {pending ? <LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin" /> : <Mail aria-hidden="true" className="size-4" />}
              {pending ? "Sending…" : communitySignUp ? "Send confirmation link" : "Email sign-in code"}
            </button>
            {!communitySignUp && <button type="button" disabled={pending} className={actionStyle("secondary", "w-full")} onClick={() => { setNotice(null); setAwaitingCode(true); }}>
              <KeyRound aria-hidden="true" className="size-4" /> I already have a code
            </button>}
          </form> : <form ref={codeForm} onSubmit={verifyCode} aria-busy={pending} className="space-y-4">
            <label className="block text-sm font-medium">Email address
              <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} className={formControlStyle} />
            </label>
            <label className="block text-sm font-medium">One-time code
              <input name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" required maxLength={10}
                value={token} onChange={(event) => setToken(event.target.value.replace(/\D/g, ""))} className={formControlStyle} />
            </label>
            <button type="submit" className={primary} disabled={pending}>
              {pending ? <LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin" /> : <ArrowRight aria-hidden="true" className="size-4" />}
              {pending ? "Checking…" : "Confirm sign-in"}
            </button>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={pending} className={actionStyle("secondary", "grow")} onClick={() => { setAwaitingCode(false); setToken(""); setNotice(null); }}>
                <ArrowLeft aria-hidden="true" className="size-4" /> Back to email
              </button>
              <button type="button" disabled={pending || !email.trim()} className={actionStyle("secondary", "grow")} onClick={requestCode}>
                <RotateCw aria-hidden="true" className="size-4" /> Request a new code
              </button>
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
