"use server";

// PracticumOS Session & Persona State Manager
import { cookies } from "next/headers";
import { DEMO_PERSONAS, DemoPersonaKey, DEFAULT_DEMO_PERSONA, DemoPersona } from "./auth-personas";
import { isDemoMode } from "./runtime-mode";

const PERSONA_COOKIE_NAME = "practicum_active_persona";

/**
 * Read the current active persona from cookies (Server Component / Action safe)
 */
export async function getActivePersona(): Promise<DemoPersona> {
  const cookieStore = cookies();
  const rawKey = cookieStore.get(PERSONA_COOKIE_NAME)?.value as DemoPersonaKey | undefined;
  
  if (rawKey && DEMO_PERSONAS[rawKey]) {
    return DEMO_PERSONAS[rawKey];
  }
  
  return DEMO_PERSONAS[DEFAULT_DEMO_PERSONA];
}

/**
 * Server Action to switch active demo persona and set cookie
 */
export async function setActivePersonaAction(personaKey: DemoPersonaKey) {
  if (!isDemoMode()) {
    return { success: false, error: "Demo personas are disabled in this environment." };
  }

  const cookieStore = cookies();
  if (DEMO_PERSONAS[personaKey]) {
    cookieStore.set(PERSONA_COOKIE_NAME, personaKey, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
    });
  }
  return { success: true, persona: DEMO_PERSONAS[personaKey] };
}
