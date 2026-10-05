import { StudentSidebar } from "@/components/layout/StudentSidebar";
import { TenantHeader } from "@/components/layout/TenantHeader";

interface StudentLayoutProps {
  children: React.ReactNode;
  params: {
    tenant: string;
  };
}

export default function StudentLayout({ children, params }: StudentLayoutProps) {
  const tenantSlug = params.tenant;

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      <StudentSidebar tenantSlug={tenantSlug} />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <TenantHeader
          tenantSlug={tenantSlug}
          currentRole="STUDENT"
          userName="Chukwuemeka Eze (Trainee)"
        />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
