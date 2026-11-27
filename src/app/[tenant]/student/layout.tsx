import { requirePortalAccess } from "@/lib/portal-access";
import { StudentSidebar } from "@/components/layout/StudentSidebar";
import { TenantHeader } from "@/components/layout/TenantHeader";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { isDemoMode } from "@/lib/runtime-mode";

interface StudentLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    tenant: string;
  }>;
}

export default async function StudentLayout(props: StudentLayoutProps) {
  const params = await props.params;

  const {
    children
  } = props;

  const tenantSlug = params.tenant;
  const { actor } = await requirePortalAccess(tenantSlug, "student");
  const userName = [actor.firstName, actor.lastName].join(" ");

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
        <StudentSidebar tenantSlug={tenantSlug} />
        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
          <TenantHeader
            tenantSlug={tenantSlug}
            currentRole="STUDENT"
            userName={userName}
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
