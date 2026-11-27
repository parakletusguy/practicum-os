import { requirePortalAccess } from "@/lib/portal-access";
import { TenantSidebar } from "@/components/layout/TenantSidebar";
import { TenantHeader } from "@/components/layout/TenantHeader";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { isDemoMode } from "@/lib/runtime-mode";
import { db } from "@/lib/db";

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    tenant: string;
  }>;
}

export default async function AdminLayout(props: AdminLayoutProps) {
  const params = await props.params;

  const {
    children
  } = props;

  const tenantSlug = params.tenant;
  const { actor, tenant } = await requirePortalAccess(tenantSlug, "admin");
  const tenantName = tenant.name;
  const canManageAccess = !isDemoMode() && Boolean(await db.orgMembership.findFirst({
    where: { personId: actor.id, organisationId: tenant.id, role: "INSTITUTION_ADMIN", status: "ACTIVE" },
    select: { id: true },
  }));

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
        <TenantSidebar tenantSlug={tenantSlug} tenantName={tenantName} canManageAccess={canManageAccess} />
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
