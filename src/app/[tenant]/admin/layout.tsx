import { TenantSidebar } from "@/components/layout/TenantSidebar";
import { TenantHeader } from "@/components/layout/TenantHeader";
import { SidebarProvider } from "@/components/layout/SidebarContext";

interface AdminLayoutProps {
  children: React.ReactNode;
  params: {
    tenant: string;
  };
}

export default function AdminLayout({ children, params }: AdminLayoutProps) {
  const tenantSlug = params.tenant;
  const tenantName = tenantSlug === "unilag" ? "University of Lagos" : "Practicum Institution";

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
        <TenantSidebar tenantSlug={tenantSlug} tenantName={tenantName} />
        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
          <TenantHeader tenantSlug={tenantSlug} currentRole="COORDINATOR" />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
