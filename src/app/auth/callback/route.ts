import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "@/lib/runtime-mode";

function safeNextPath(value: string | null, origin: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/auth/workspaces";
  }

  const destination = new URL(value, origin);
  return destination.origin === origin ? destination.pathname + destination.search : "/auth/workspaces";
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const config = getSupabasePublicConfig();
  const loginUrl = new URL("/auth/login", request.url);

  if (!code || !config) {
    loginUrl.searchParams.set("error", "authentication");
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.redirect(
    new URL(safeNextPath(request.nextUrl.searchParams.get("next"), request.nextUrl.origin), request.url)
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

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (!error) {
    return response;
  }

  loginUrl.searchParams.set("error", "authentication");
  return NextResponse.redirect(loginUrl);
}
