import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "@/lib/runtime-mode";
import { signInDestination } from "@/lib/sign-in";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const config = getSupabasePublicConfig();
  const loginUrl = new URL("/auth/login", request.url);

  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const supportsToken = tokenHash && type === "email";
  const next = signInDestination(request.nextUrl.searchParams.get("next"));
  if (next !== "/auth/workspaces") loginUrl.searchParams.set("next", next);
  if ((!code && !supportsToken) || !config) {
    loginUrl.searchParams.set("error", "authentication");
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.redirect(
    new URL(next, request.url)
  );
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: "email" });
  if (!error) {
    return response;
  }

  loginUrl.searchParams.set("error", "authentication");
  return NextResponse.redirect(loginUrl);
}
