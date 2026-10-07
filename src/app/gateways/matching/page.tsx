"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/Navbar";
import { 
  Sparkles, 
  Search, 
  Building2, 
  UserCheck, 
  GraduationCap, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ArrowRight, 
  ShieldCheck, 
  Filter, 
  Check, 
  Send, 
  Lock
} from "lucide-react";
import { 
  getOpenNeedRequestsAction, 
  getNeedRequestWithMatchesAction, 
  dispatchNeedMatchAction 
} from "@/modules/needs-matching/actions";
import { MatchScoreResult, NEED_CATEGORIES_CATALOG } from "@/modules/needs-matching/types";

export default function NeedMatcherDeskPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const [activeRequestData, setActiveRequestData] = useState<any | null>(null);
  const [matches, setMatches] = useState<MatchScoreResult[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [dispatchLoading, setDispatchLoading] = useState(false);

  // Load list of requests
  const loadRequests = async () => {
    setLoadingList(true);
    const res = await getOpenNeedRequestsAction();
    if (res.success && res.requests) {
      setRequests(res.requests);
      if (res.requests.length > 0 && !selectedRequestId) {
        setSelectedRequestId(res.requests[0].id);
      }
    }
    setLoadingList(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // When selected request changes, calculate matches
  useEffect(() => {
    if (!selectedRequestId) return;
    const fetchMatches = async () => {
      setLoadingMatches(true);
      setDispatchStatus(null);
      const res = await getNeedRequestWithMatchesAction(selectedRequestId);
      if (res.success) {
        setActiveRequestData(res.request);
        setMatches(res.matches || []);
      }
      setLoadingMatches(false);
    };
    fetchMatches();
  }, [selectedRequestId]);

  const handleDispatch = async (match: MatchScoreResult) => {
    if (!selectedRequestId) return;
    setDispatchLoading(true);
    const res = await dispatchNeedMatchAction(
      selectedRequestId,
      match.targetId,
      match.targetType,
      match.name
    );
    setDispatchLoading(false);
    if (res.success) {
      setDispatchStatus(res.message || "Match successfully confirmed!");
      loadRequests();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />

      {/* Header */}
      <section className="bg-slate-950 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Care Matcher
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Community Care Matching Desk
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Connect community care inquiries with accredited agencies, verified volunteers, and supervised student trainees.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/gateways/help"
              className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
            >
              + New Care Request
            </Link>
            <Link
              href="/gateways/provider"
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
            >
              + Register Helper
            </Link>
          </div>
        </div>
      </section>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Needs Roster */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span>Community Requests</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
                  {requests.length}
                </span>
              </h2>
              <button
                onClick={loadRequests}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Refresh
              </button>
            </div>

            {loadingList ? (
              <div className="p-8 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
                Loading community requests...
              </div>
            ) : requests.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
                <p className="text-sm text-slate-500">No care requests currently found.</p>
                <Link
                  href="/gateways/help"
                  className="inline-block text-xs font-bold text-rose-600 hover:underline"
                >
                  Create a sample care request &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5 overflow-y-auto max-h-[750px] pr-1">
                {requests.map((req) => {
                  const isSelected = selectedRequestId === req.id;
                  const catMeta = (NEED_CATEGORIES_CATALOG as any)[req.category] || NEED_CATEGORIES_CATALOG.OTHER;

                  const urgencyBadge = {
                    LOW: "bg-slate-100 text-slate-700",
                    STANDARD: "bg-blue-100 text-blue-700",
                    URGENT: "bg-amber-100 text-amber-800",
                    CRITICAL: "bg-rose-100 text-rose-800 animate-pulse",
                  }[req.urgencyLevel as string] || "bg-slate-100 text-slate-700";

                  const isMatched = req.status === "MATCHED";

                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelectedRequestId(req.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-500"
                          : "border-slate-200/90 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${catMeta.colorBadge}`}>
                          {catMeta.label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${urgencyBadge}`}>
                            {req.urgencyLevel}
                          </span>
                          {isMatched && (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Matched
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 mb-1">
                        {req.title}
                      </h4>

                      <p className="text-xs text-slate-600 line-clamp-2 mb-2 leading-relaxed">
                        {req.description}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {req.locationCity || "Nigeria"}
                        </span>
                        <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Match Analysis & Dispatch */}
          <div className="lg:col-span-7">
            {activeRequestData ? (
              <div className="space-y-5">
                {/* Selected Need Details Card */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400" /> Confidential Request
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                      activeRequestData.status === "MATCHED" 
                        ? "bg-emerald-100 text-emerald-800" 
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      Status: {activeRequestData.status === "MATCHED" ? "Matched" : "Awaiting Match"}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {activeRequestData.title}
                  </h3>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
                    {activeRequestData.description}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <div>
                      <span className="font-semibold text-slate-700">Category:</span>{" "}
                      {activeRequestData.category.replace(/_/g, " ")}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Location:</span>{" "}
                      {activeRequestData.locationCity}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Urgency:</span>{" "}
                      {activeRequestData.urgencyLevel}
                    </div>
                  </div>
                </div>

                {/* Match Recommendations */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        Recommended Matches ({matches.length})
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Matched based on location, specialty, and verified qualifications.
                      </p>
                    </div>
                  </div>

                  {dispatchStatus && (
                    <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {dispatchStatus}
                    </div>
                  )}

                  {loadingMatches ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                      Finding matching providers...
                    </div>
                  ) : matches.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl text-slate-500 text-sm">
                      No matching providers found in this area yet. Check back soon or register a provider.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {matches.map((match, idx) => {
                        const Icon = {
                          ORGANISATION: Building2,
                          SERVICE_PROVIDER: UserCheck,
                          STUDENT_ALLOCATION: GraduationCap,
                        }[match.targetType];

                        return (
                          <div
                            key={idx}
                            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="flex items-start gap-3 flex-1">
                              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-indigo-600 shadow-sm flex-shrink-0">
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-slate-900">
                                    {match.name}
                                  </h4>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                                    {match.verificationBadge}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600">
                                  {match.headlineOrOrgType}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {match.matchedKeywords.map((k, i) => (
                                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700">
                                      #{k}
                                    </span>
                                  ))}
                                  {match.locationMatch && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">
                                      ✓ Local Area
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3">
                              <div className="text-right">
                                <div className="text-lg font-extrabold text-indigo-600">
                                  {match.score}%
                                </div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                                  Match Fit
                                </div>
                              </div>

                              <button
                                type="button"
                                disabled={dispatchLoading || activeRequestData.status === "MATCHED"}
                                onClick={() => handleDispatch(match)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors disabled:opacity-40"
                              >
                                <Send className="w-3.5 h-3.5" />
                                {activeRequestData.status === "MATCHED" ? "Connected" : "Connect Match"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                Select a community request on the left to see matching providers.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
