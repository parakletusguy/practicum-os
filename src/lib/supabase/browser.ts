"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "@/lib/runtime-mode";

export function createBrowserSupabaseClient() {
  const config = getSupabasePublicConfig();

  if (!config) {
    throw new Error("Supabase authentication has not been configured for this environment.");
  }

  return createBrowserClient(config.url, config.key);
}
