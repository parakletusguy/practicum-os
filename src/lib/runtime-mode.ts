/**
 * Demo mode is deliberately opt-in in production. It exists only to support
 * seeded local previews and must never stand in for authenticated access.
 */
export function isDemoMode(): boolean {
  return (
    process.env.PRACTICUM_DEMO_MODE === "true" ||
    (process.env.NODE_ENV !== "production" && process.env.PRACTICUM_DEMO_MODE !== "false")
  );
}

export function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return url && key ? { url, key } : null;
}

export function isSupabaseConfigured(): boolean {
  return getSupabasePublicConfig() !== null;
}
