import { StudentSidebar } from "@/components/layout/StudentSidebar";
import { TenantHeader } from "@/components/layout/TenantHeader";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { SystemRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireTenantRole } from "@/lib/authz";
import { isDemoMode } from "@/lib/runtime-mode";

interface StudentLayoutProps {
  children: React.ReactNode;
  params: {
    tenant: string;
  };
}

export default async function StudentLayout({ children, params }: StudentLayoutProps) {
  const tenantSlug = params.tenant;
  let userName = "Chukwuemeka Eze";

  if (!isDemoMode()) {
    try {
      const { actor } = await requireTenantRole(tenantSlug, [SystemRole.STUDENT]);
      userName = `${actor.firstName} ${actor.lastName}`;
    } catch {
      redirect("/auth/login?error=access");
    }
  }

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
