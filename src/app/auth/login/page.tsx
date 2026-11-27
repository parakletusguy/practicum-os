import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { isDemoMode } from "@/lib/runtime-mode";
import { isCommunitySignUp, signInDestination, signInErrorMessage } from "@/lib/sign-in";

export const metadata: Metadata = { title: "Sign in · PracticumOS" };

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ error?: string; next?: string; institution?: string }>;
}) {
  const query = await searchParams;
  const destination = signInDestination(typeof query.next === "string" ? query.next : null);
  return <LoginForm destination={destination} demoEnabled={isDemoMode()} initialMessage={signInErrorMessage(query.error)}
    communitySignUp={isCommunitySignUp(destination)} rsuPilot={query.institution === "rsu" || destination.startsWith("/rsu/")} />;
}
