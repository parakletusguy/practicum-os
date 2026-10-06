import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard tenant portal paths
  if (
    !pathname.includes("/admin") &&
    !pathname.includes("/student") &&
    !pathname.includes("/field") &&
    !pathname.includes("/faculty")
  ) {
    return NextResponse.next();
  }

  // Read active persona cookie
  const activePersona = request.cookies.get("practicum_active_persona")?.value || "admin";

  const response = NextResponse.next();
  // Pass active persona in custom header for server components
  response.headers.set("x-practicum-persona", activePersona);

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)",
  ],
};
