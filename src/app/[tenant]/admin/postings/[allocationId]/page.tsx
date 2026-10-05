import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { 
  ArrowLeft, 
  Printer, 
  ShieldCheck, 
  Building2, 
  GraduationCap, 
  CheckCircle2, 
  FileCheck2 
} from "lucide-react";
import { PrintButton } from "@/components/ui/print-button";

interface PostingLetterPageProps {
  params: {
    tenant: string;
    allocationId: string;
  };
}

export const dynamic = "force-dynamic";

export default async function PostingLetterPage({ params }: PostingLetterPageProps) {
  const { tenant: tenantSlug, allocationId } = params;

  const allocation = await db.placementAllocation.findUnique({
    where: { id: allocationId },
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
      studentPerson: true,
      cohortStudent: true,
      hostOrg: true,
      fieldSupervisor: true,
      academicSupervisor: true,
    },
  });

  if (!allocation) {
    notFound();
  }

  const university = allocation.cycle.programme?.department.organisation.name || "University of Lagos";
  const department = allocation.cycle.programme?.department.name || "Department of Social Work";
  const programme = allocation.cycle.programme?.name || "Bachelor of Science in Social Work";

  const letterRef = allocation.postingLetterRef || "UNILAG/SWK/2026/PL-PENDING";
  const letterDate = allocation.postedAt ? formatDate(allocation.postedAt) : formatDate(new Date());

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href={`/${tenantSlug}/admin/postings`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Posting Desk
        </Link>

        <div className="flex items-center gap-3">
          <PrintButton />
        </div>
      </div>

      {/* Official Institutional Letter Document Sheet */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-10 sm:p-14 print:p-0 print:border-none print:shadow-none print:m-0 font-serif text-slate-900 leading-relaxed">
        {/* Institutional Letterhead */}
        <div className="text-center pb-6 border-b-2 border-emerald-900">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xl shadow-md">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-emerald-950 font-sans">
            {university}
          </h1>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-700 font-sans mt-0.5">
            Faculty of Social Sciences • {department}
          </div>
          <div className="text-[11px] italic text-slate-500 font-sans mt-1">
            Directorate of Field Education, Practicum & Community Welfare
          </div>
          <div className="text-[10px] text-slate-400 font-sans mt-0.5">
            University Road, Akoka, Yaba, Lagos, Nigeria • Web: practicum.unilag.edu.ng
          </div>
        </div>

        {/* Reference & Date Header */}
        <div className="mt-8 flex items-center justify-between text-xs font-sans font-semibold text-slate-700">
          <div>
            <span>Ref No: </span>
            <span className="font-mono font-bold text-slate-900">{letterRef}</span>
          </div>
          <div>
            <span>Date: </span>
            <span className="font-medium text-slate-900">{letterDate}</span>
          </div>
        </div>

        {/* Addressee */}
        <div className="mt-8 text-xs font-sans text-slate-800 space-y-0.5">
          <div className="font-bold">The Field Practice Coordinator / Executive Director,</div>
          <div className="font-bold text-slate-900">{allocation.hostOrg.name},</div>
          {allocation.hostOrg.address && <div>{allocation.hostOrg.address},</div>}
          <div>{allocation.hostOrg.city}, {allocation.hostOrg.country}.</div>
        </div>

        {/* Subject Header */}
        <div className="mt-8 pt-4 pb-2 border-t border-b border-slate-200 text-center font-sans font-extrabold text-sm sm:text-base text-slate-950 uppercase tracking-wide">
          Official Posting & Introduction for Supervised Field Practicum II
          <div className="text-xs font-semibold text-slate-600 mt-0.5 normal-case">
            Academic Session: {allocation.cycle.academicYear} • Target: {allocation.cycle.requiredHours} Verified Practice Hours
          </div>
        </div>

        {/* Letter Body */}
        <div className="mt-6 space-y-4 text-xs sm:text-sm text-slate-800 text-justify">
          <p>
            The Directorate of Field Education in the Department of Social Work presents its highest compliments.
            We are pleased to introduce our undergraduate student, <strong>{allocation.studentPerson.firstName} {allocation.studentPerson.lastName}</strong> (Matriculation Number: <strong className="font-mono">{allocation.cohortStudent.matricNumber}</strong>), who has been formally approved and posted to your esteemed organisation for their mandatory supervised field practicum.
          </p>

          <p>
            Field practicum is the central pedagogical cornerstone of our professional curriculum. Under the guidelines of national higher education accreditation, the student is required to complete a minimum of <strong>{allocation.cycle.requiredHours} verified hours</strong> of supervised practice commencing on <strong>{formatDate(allocation.cycle.startDate)}</strong> through <strong>{formatDate(allocation.cycle.endDate)}</strong>.
          </p>

          {/* Placement Specifications Box */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 font-sans space-y-2 text-xs my-4">
            <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
              Supervision & Placement Details:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500">Student Name: </span>
                <span className="font-semibold text-slate-800">{allocation.studentPerson.firstName} {allocation.studentPerson.lastName}</span>
              </div>
              <div>
                <span className="text-slate-500">Matriculation No: </span>
                <span className="font-mono font-semibold text-slate-800">{allocation.cohortStudent.matricNumber}</span>
              </div>
              <div>
                <span className="text-slate-500">Designated Field Supervisor: </span>
                <span className="font-semibold text-slate-800">
                  {allocation.fieldSupervisor
                    ? `${allocation.fieldSupervisor.firstName} ${allocation.fieldSupervisor.lastName}`
                    : "To be designated by Host Agency"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Faculty Supervisor Liaison: </span>
                <span className="font-semibold text-slate-800">
                  {allocation.academicSupervisor
                    ? `${allocation.academicSupervisor.firstName} ${allocation.academicSupervisor.lastName}`
                    : "Faculty Board Liaison"}
                </span>
              </div>
            </div>
          </div>

          <p>
            During this cycle, the trainee will maintain an official <strong>PracticumOS E-Logbook</strong>. Practice activities will be recorded daily, mapped to core professional competencies, and safeguarded by institutional <em>ScopeGuard</em> safety governors. We kindly request the designated Field Supervisor to verify the student&apos;s logged hours and provide constructive formative assessments.
          </p>

          <p>
            Thank you for your invaluable partnership in nurturing ethical, competent, and transformative practitioners for our society.
          </p>
        </div>

        {/* Official Signatory & Seal */}
        <div className="mt-12 pt-6 flex items-end justify-between font-sans">
          <div className="space-y-1">
            <div className="w-32 h-10 border-b border-slate-400 flex items-center justify-center italic text-emerald-800 font-serif text-sm">
              A. Ogunlesi
            </div>
            <div className="font-bold text-xs text-slate-900">Dr. Adebayo Ogunlesi, Ph.D, RSW</div>
            <div className="text-[11px] text-slate-500">Director of Field Education & Practicum</div>
            <div className="text-[10px] text-slate-400">Department of Social Work, University of Lagos</div>
          </div>

          <div className="text-right">
            <div className="inline-block p-3 rounded-xl border-2 border-emerald-800/40 bg-emerald-50/30 text-emerald-950 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider">Official University Seal</div>
              <div className="text-[9px] text-slate-500 font-mono mt-0.5">CHECKSUM: {allocation.id.slice(0, 18)}</div>
              <div className="text-[9px] text-emerald-700 font-semibold mt-1 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> VERIFIED CREDENTIAL
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
