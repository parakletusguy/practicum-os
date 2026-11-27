export function signInDestination(value: string | null | undefined) {
  const origin = "https://practicum.invalid";
  if (!value?.startsWith("/") || value.startsWith("//")) return "/auth/workspaces";
  const url = new URL(value, origin);
  if (url.origin !== origin) return "/auth/workspaces";
  const { pathname, search } = url;
  const portal = /^\/[^/]+\/(admin|student|field|faculty)(?:\/|$)/.test(pathname);
  return portal || pathname === "/platform" || pathname.startsWith("/gateways/") ? pathname + search : "/auth/workspaces";
}

export function afterInstitutionSignIn(next: string, isPlatformAdmin: boolean) {
  const destination = signInDestination(next);
  return isPlatformAdmin && destination === "/auth/workspaces" ? "/platform" : destination;
}

export function isCommunitySignUp(destination: string) {
  const path = destination.split("?")[0];
  return path === "/gateways/help" || path === "/gateways/provider";
}

export function isRsuEmail(email: string) {
  const domain = email.trim().toLowerCase().split("@").at(-1);
  return domain === "rsu.edu.ng" || domain === "ust.edu.ng";
}

export function signInErrorMessage(error: string | null | undefined) {
  if (error === "authentication") return "The email confirmation link could not be completed. Request a fresh sign-in using the form below.";
  if (error === "access") return "This account does not have access to that workspace. Check the email registered with your practicum office.";
  if (error === "configuration") return "Sign-in is temporarily unavailable. Contact your practicum office.";
  return null;
}
