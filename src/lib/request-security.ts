/**
 * Route Handlers do not receive Server Actions' built-in Origin/Host check.
 * Cookie-authenticated browser writes therefore require a configured canonical
 * origin in production.
 */
export function hasTrustedBrowserOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL;

  if (!origin || !appOrigin) return false;

  try {
    return new URL(origin).origin === new URL(appOrigin).origin;
  } catch {
    return false;
  }
}
