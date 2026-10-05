import { TenantSidebar } from "@/components/layout/TenantSidebar";
import { TenantHeader } from "@/components/layout/TenantHeader";

interface TenantLayoutProps {
  children: React.ReactNode;
  params: {
    tenant: string;
  };
}

export default function TenantLayout({ children, params }: TenantLayoutProps) {
  const tenantSlug = params.tenant;
  const tenantName = tenantSlug === "unilag" ? "University of Lagos" : "Practicum Institution";

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      <TenantSidebar tenantSlug={tenantSlug} tenantName={tenantName} />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <TenantHeader tenantSlug={tenantSlug} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
