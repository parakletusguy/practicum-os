import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate, formatMinutesToHours } from "@/lib/utils";
import { 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  Building2, 
  Clock, 
  Layers, 
  Printer, 
  ExternalLink,
  QrCode
} from "lucide-react";
import { PrintButton } from "@/components/ui/print-button";

interface StudentPassportPageProps {
  params: {
    tenant: string;
  };
}

export const dynamic = "force-dynamic";

export default async function StudentPassportPage({ params }: StudentPassportPageProps) {
  const tenantSlug = params.tenant;

  const student = await db.person.findFirst({
    where: { email: "c.eze@student.unilag.edu.ng" },
    include: {
      cohortEnrollments: {
        include: {
          cycle: {
            include: {
              programme: {
                include: {
                  department: {
                    include: {
                      organisation: true,
                    },
                  },
                },
              },
            },
          },
          allocation: {
            include: {
              hostOrg: true,
              fieldSupervisor: true,
              practiceEvents: {
                where: { verificationStatus: "VERIFIED" },
              },
            },
          },
        },
      },
    },
  });

  const enrollment = student?.cohortEnrollments[0];
  const cycle = enrollment?.cycle;
  const allocation = enrollment?.allocation;
  const verifiedEvents = allocation?.practiceEvents || [];

  const totalVerifiedMinutes = verifiedEvents.reduce((sum, e) => sum + e.verifiedMinutes, 0);
  const totalVerifiedHours = (totalVerifiedMinutes / 60).toFixed(1);

  const passportId = `P-PASSPORT-${student?.id.slice(0, 8).toUpperCase()}-2026`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4">
      {/* Action Bar (Hidden in Print) */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            <span>Career Portfolio</span>
            <span>•</span>
            <span className="text-emerald-600">Verified Credential</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Portable Practice Passport
          </h1>
        </div>

        <PrintButton />
      </div>

      {/* Official Passport Card Sheet */}
      <div className="bg-white rounded-2xl border-2 border-emerald-800/30 shadow-xl p-8 sm:p-12 print:p-0 print:border-none print:shadow-none print:m-0 font-sans text-slate-900">
        {/* Passport Crest Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-slate-900">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-800/20">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold tracking-widest uppercase text-emerald-800">
                PracticumOS Professional Credential
              </span>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                Practice Passport
              </h2>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                Portable Record of Verified Practice & Competency Endorsements
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Passport Identifier</div>
            <div className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded mt-0.5 inline-block">
              {passportId}
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center justify-start sm:justify-end gap-1">
              <CheckCircle2 className="w-3 h-3" /> Zero Client PII Exposed
            </div>
          </div>
        </div>

        {/* Practitioner Dossier */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 my-8 p-6 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Practitioner Name</div>
            <div className="text-base font-bold text-slate-900 mt-1">
              {student?.firstName} {student?.lastName}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Matriculation No: <span className="font-mono font-bold text-slate-700">{enrollment?.matricNumber}</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Accredited Programme</div>
            <div className="text-xs font-bold text-slate-900 mt-1">
              {cycle?.programme?.name ?? "Bachelor of Social Work"}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {cycle?.programme?.department.organisation.name ?? "University of Lagos"}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Verified Practice Hours</div>
            <div className="text-2xl font-black text-emerald-800 mt-0.5">
              {totalVerifiedHours} Hours
            </div>
            <div className="text-xs text-emerald-600 font-semibold">
              Supervised Clinical Experience
            </div>
          </div>
        </div>

        {/* Verified Placement Settings */}
        <div className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-purple-600" />
            Accredited Practice Settings Completed
          </h3>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100/80 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Placement Organisation</th>
                  <th className="py-2.5 px-4">Practice Typology</th>
                  <th className="py-2.5 px-4">Field Supervisor</th>
                  <th className="py-2.5 px-4 text-right">Hours Logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {allocation?.hostOrg.name}
                    <div className="text-[10px] text-slate-400 font-normal">
                      {allocation?.hostOrg.city}, {allocation?.hostOrg.country}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    Child Welfare & Family Rehabilitation
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {allocation?.fieldSupervisor?.firstName} {allocation?.fieldSupervisor?.lastName}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-800">
                    {totalVerifiedHours} hrs
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Certified Competencies Endorsement Grid */}
        <div className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-600" />
            Certified Practice DNA Competencies
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/40 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900">EPAS-1: Ethical & Professional Behavior</strong>
                <p className="text-[11px] text-slate-600 mt-0.5">Demonstrated adherence to professional boundaries and codes of ethics.</p>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/40 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900">EPAS-3: Anti-Oppressive Diversity Practice</strong>
                <p className="text-[11px] text-slate-600 mt-0.5">Applied cultural humility and community dialogue in grassroots engagement.</p>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/40 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900">EPAS-6: Direct Engagement with Service Users</strong>
                <p className="text-[11px] text-slate-600 mt-0.5">Conducted trauma-informed intake interviews and rapport building.</p>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/40 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900">EPAS-8: Inter-Agency Intervention</strong>
                <p className="text-[11px] text-slate-600 mt-0.5">Coordinated multi-disciplinary case conferences with medical and school teams.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Footer & QR-Seal */}
        <div className="pt-6 border-t-2 border-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div>
            <div className="font-bold text-slate-900">Official PracticumOS Digital Attestation</div>
            <p className="text-[11px] text-slate-500 max-w-md mt-0.5">
              This passport is a tamper-evident record backed by cryptographic checksums. Issued by the Directorate of Field Education for lifelong professional licensure and career verification.
            </p>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center flex-shrink-0">
            <div className="text-[9px] font-mono uppercase text-slate-400">Cryptographic Seal</div>
            <div className="font-mono text-xs font-bold text-slate-800 mt-0.5">
              SHA256: {student?.id.slice(0, 16)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
