import { requirePortalAccess } from "@/lib/portal-access";
import { TenantSidebar } from "@/components/layout/TenantSidebar";
import { TenantHeader } from "@/components/layout/TenantHeader";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { isDemoMode } from "@/lib/runtime-mode";
import { db } from "@/lib/db";
import { fieldDirectorFromSettings } from "@/lib/institution-settings";

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
  const demo = isDemoMode();
  const memberships = demo ? [] : await db.orgMembership.findMany({
    where: {
      personId: actor.id, status: "ACTIVE",
      OR: [{ role: "PLATFORM_SUPERADMIN" }, { organisationId: tenant.id, role: "INSTITUTION_ADMIN" }],
    },
    select: { role: true },
  });
  const canManageAccess = memberships.some(({ role }) => role === "INSTITUTION_ADMIN");
  const canOpenPlatform = memberships.some(({ role }) => role === "PLATFORM_SUPERADMIN");
  const director = fieldDirectorFromSettings(tenant.settings);
  const isDirector = director?.personId === actor.id;
  const userName = isDirector ? director.name : [actor.firstName, actor.lastName].join(" ");
  const roleLabel = isDirector || demo ? "Field Director" : canManageAccess ? "Institutional administrator" : "Coordinator";

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
        <TenantSidebar tenantSlug={tenantSlug} tenantName={tenantName} canManageAccess={canManageAccess}
          canOpenPlatform={canOpenPlatform} demo={demo} />
        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
          <TenantHeader
            tenantSlug={tenantSlug}
            tenantName={tenantName}
            currentRole="COORDINATOR"
            userName={userName}
            roleLabel={roleLabel}
            allowRoleSwitch={demo}
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
