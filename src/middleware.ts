import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig, isDemoMode } from "@/lib/runtime-mode";

function isProtectedWorkspace(pathname: string) {
  return (
    /^\/[^/]+\/(admin|student|field|faculty)(?:\/|$)/.test(pathname) ||
    ["/gateways/help", "/gateways/provider", "/gateways/matching"].includes(pathname)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isDemoMode() || !isProtectedWorkspace(pathname)) {
    return NextResponse.next({ request });
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("error", "configuration");
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getClaims verifies the token; getSession only reads an untrusted cookie.
  const { data, error } = await supabase.auth.getClaims();
  if (!error && typeof data?.claims?.sub === "string") {
    return response;
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/auth/login";
  loginUrl.search = "";
  loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);

  const redirectResponse = NextResponse.redirect(loginUrl);
  response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
  return redirectResponse;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)"],
};
