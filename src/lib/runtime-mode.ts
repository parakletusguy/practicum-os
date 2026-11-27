/**
 * Demo mode is for seeded local and preview deployments.
 */
export function isDemoMode(): boolean {
  if (process.env.VERCEL_ENV === "production") return false;
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
