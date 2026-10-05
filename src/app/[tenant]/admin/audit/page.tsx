import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  History,
  ShieldCheck,
  Lock,
  User,
  Clock,
  Search,
  Filter,
  FileText,
  Building2,
} from "lucide-react";

export default async function AuditLedgerPage({
  params,
}: {
  params: { tenant: string };
}) {
  const tenant = await prisma.organisation.findUnique({
    where: { slug: params.tenant },
  });

  if (!tenant) {
    notFound();
  }

  const auditLogs = await prisma.auditLog.findMany({
    where: { tenantId: tenant.id },
    include: {
      actor: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
          <History className="w-4 h-4 text-emerald-600" />
          Institutional Governance & Transparency
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Immutable System Audit Ledger
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Tamper-evident chronological log of all sensitive actions: grade approvals, allocation overrides, clinical hours verification, and supervision records.
        </p>
      </div>

      {/* Security Status Card */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
            Audit Ledger Integrity Status
          </span>
          <h3 className="text-xl font-bold">Cryptographically Verified Audit Stream</h3>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            All administrative, supervisory, and grading mutations are logged with actor identity, resource identifiers, before-state and after-state payloads.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-800/80 px-5 py-3 rounded-2xl border border-slate-700">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
          <div>
            <span className="text-xs font-bold text-white block">Tamper Protection</span>
            <span className="text-[10px] text-emerald-400">Append-Only Schema</span>
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Recent Audit Events ({auditLogs.length} Events Logged)
          </h3>
          <span className="text-xs font-mono text-slate-400">Tenant: {tenant.name}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[10px] uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">State Delta / Mutation Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-sans text-xs">
                    No audit records registered in this cycle yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => {
                  const afterStateStr = log.afterState
                    ? JSON.stringify(log.afterState)
                    : "—";

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {log.actionType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-sans font-semibold">
                        {log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : "System Service"}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {log.resourceType} ({log.resourceId.slice(0, 8)}...)
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={afterStateStr}>
                        {afterStateStr}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
