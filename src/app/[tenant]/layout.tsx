interface TenantLayoutProps {
  children: React.ReactNode;
}

// Every tenant portal reads request-bound identity and live practicum data.
// Rendering it per request prevents Next.js from querying the production
// database while building a deploy artifact.
export const dynamic = "force-dynamic";

export default function TenantLayout({ children }: TenantLayoutProps) {
  return <>{children}</>;
}
