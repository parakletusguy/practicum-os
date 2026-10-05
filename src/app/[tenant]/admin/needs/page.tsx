import Link from "next/link";
import { prisma } from "@/lib/db";
import { 
  HeartHandshake, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Lock,
  Building2,
  Users
} from "lucide-react";

interface AdminNeedsPageProps {
  params: {
    tenant: string;
  };
}

export default async function AdminNeedsPage({ params }: AdminNeedsPageProps) {
  const requests = await prisma.needRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      seeker: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  const providersCount = await prisma.serviceProvider.count();
  const matchedCount = requests.filter(r => r.status === "MATCHED").length;
  const openCount = requests.filter(r => r.status === "OPEN").length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold uppercase tracking-wider mb-1">
            <HeartHandshake className="w-3.5 h-3.5" />
            System B Integration
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Community Needs & Social Care Triage
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Intake pipeline connecting community welfare requests with institutional student placements and accredited partner agencies.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/gateways/matching"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Launch Live Semantic Matcher
          </Link>
          <Link
            href="/gateways/help"
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm"
          >
            + New Care Request
          </Link>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Inquiries</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{requests.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Logged across all categories</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-600">Open & Triage</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{openCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">Awaiting referral dispatch</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">Dispatched / Matched</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{matchedCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">Active care coordination</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">Verified Providers</div>
          <div className="text-2xl font-extrabold text-indigo-600 mt-1">{providersCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">Onboarded in registry</div>
        </div>
      </div>

      {/* Needs Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Community Needs Triage Registry
          </h3>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Lock className="w-3 h-3" /> De-Identified Public Safeguarding
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No community care requests logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Case Title & Reference</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Urgency</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 line-clamp-1">{req.title}</div>
                      <div className="text-slate-500 line-clamp-1 mt-0.5">{req.description}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {req.category.replace(/_/g, " ")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        req.urgencyLevel === "CRITICAL"
                          ? "bg-rose-100 text-rose-800"
                          : req.urgencyLevel === "URGENT"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {req.urgencyLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {req.locationCity || "Nigeria"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        req.status === "MATCHED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href="/gateways/matching"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        Match <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
