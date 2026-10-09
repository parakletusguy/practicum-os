import { TenantSidebar } from "@/components/layout/TenantSidebar";
import { TenantHeader } from "@/components/layout/TenantHeader";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { SystemRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireTenantRole } from "@/lib/authz";
import { isDemoMode } from "@/lib/runtime-mode";

interface AdminLayoutProps {
  children: React.ReactNode;
  params: {
    tenant: string;
  };
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const tenantSlug = params.tenant;
  let tenantName = tenantSlug === "unilag" ? "University of Lagos" : "Practicum Institution";

  if (!isDemoMode()) {
    try {
      const { tenant } = await requireTenantRole(tenantSlug, [
        SystemRole.COORDINATOR,
        SystemRole.INSTITUTION_ADMIN,
      ]);
      tenantName = tenant.name;
    } catch {
      redirect("/auth/login?error=access");
    }
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
        <TenantSidebar tenantSlug={tenantSlug} tenantName={tenantName} />
        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
          <TenantHeader
            tenantSlug={tenantSlug}
            currentRole="COORDINATOR"
            allowRoleSwitch={isDemoMode()}
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
