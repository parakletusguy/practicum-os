import { db } from "@/lib/db";
import { 
  Building2, 
  Plus, 
  MapPin, 
  Phone, 
  Mail, 
  Users, 
  Layers, 
  CheckCircle2,
  Calendar
} from "lucide-react";
import { AgencyModalClient } from "./agency-modal-client";

interface AgenciesPageProps {
  params: {
    tenant: string;
  };
}

export const dynamic = "force-dynamic";

export default async function AgenciesPage({ params }: AgenciesPageProps) {
  const tenantSlug = params.tenant;

  const tenant = await db.organisation.findUnique({
    where: { slug: tenantSlug },
  });

  if (!tenant) return <div>Tenant not found</div>;

  // Placement host agencies
  const partnerAgencies = await db.organisation.findMany({
    where: {
      tenantId: tenant.id,
      orgType: { in: ["MINISTRY", "NGO", "HOSPITAL", "WELFARE_AGENCY", "COMMUNITY_CENTRE"] },
    },
    include: {
      placementOffers: {
        include: {
          cycle: true,
        },
      },
      hostedAllocations: {
        include: {
          studentPerson: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const activeCycles = await db.practicumCycle.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });

  const totalSlotsAcrossAgencies = partnerAgencies.reduce(
    (acc, a) => acc + a.placementOffers.reduce((sum, o) => sum + o.totalSlots, 0),
    0
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            <span>Practicum Management</span>
            <span>•</span>
            <span className="text-emerald-600">Phase 1: Capacity Collection</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Placement Partner Agencies & Capacity
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Register accredited practice organisations, collect available slots, and define practice areas.
          </p>
        </div>

        <AgencyModalClient tenantSlug={tenantSlug} activeCycles={activeCycles} />
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Partner Agencies
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {partnerAgencies.length} Organisations
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">
            Accredited for field practicum
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Declared Capacity
          </div>
          <div className="text-2xl font-extrabold text-purple-700 mt-1">
            {totalSlotsAcrossAgencies} Practice Spaces
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Across clinical & community specialties
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Verification Status
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6" /> 100% Vetted
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Zero unverified host placements
          </div>
        </div>
      </div>

      {/* Agencies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {partnerAgencies.map((agency) => {
          const totalAgencyCapacity = agency.placementOffers.reduce((sum, o) => sum + o.totalSlots, 0);
          const currentPlacedStudents = agency.hostedAllocations.length;

          return (
            <div
              key={agency.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {agency.name}
                      </h3>
                      <div className="text-xs text-slate-500 font-medium">
                        {agency.orgType} • {agency.city}, {agency.country}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {agency.verificationStatus}
                  </span>
                </div>

                {/* Contact info */}
                <div className="space-y-1.5 text-xs text-slate-600 mt-4 pt-3 border-t border-slate-100">
                  {agency.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{agency.address}</span>
                    </div>
                  )}
                  {agency.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{agency.email}</span>
                    </div>
                  )}
                  {agency.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{agency.phone}</span>
                    </div>
                  )}
                </div>

                {/* Active Placement Offers */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-700 mb-2">
                    Active Placement Offers:
                  </div>

                  {agency.placementOffers.length === 0 ? (
                    <div className="text-xs text-slate-400 italic">
                      No active offers declared for upcoming cycles.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {agency.placementOffers.map((offer) => (
                        <div
                          key={offer.id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                        >
                          <div className="flex items-center justify-between font-semibold text-slate-900">
                            <span>{offer.cycle.name}</span>
                            <span className="text-emerald-700 font-bold">
                              {offer.availableSlots} / {offer.totalSlots} Slots Free
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-1">
                            {offer.practiceAreas.map((area, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium"
                              >
                                {area}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer status */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  Currently Placed: <strong className="text-slate-900">{currentPlacedStudents} Trainees</strong>
                </span>
                <span className="text-purple-600 font-semibold">
                  Capacity: {totalAgencyCapacity} Total
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
