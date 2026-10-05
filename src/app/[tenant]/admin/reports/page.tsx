import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  GraduationCap,
  Printer,
  FileSpreadsheet,
  Award,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Building2,
} from "lucide-react";

export default async function OfficialReportsDeskPage({
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

  const cycle = await prisma.practicumCycle.findFirst({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    include: {
      students: {
        include: {
          person: true,
          allocation: {
            include: {
              hostOrg: true,
              practiceEvents: true,
            },
          },
          grade: true,
        },
      },
    },
  });

  if (!cycle) {
    notFound();
  }

  const students = cycle.students;
  const approvedGradesCount = students.filter((s) => s.grade?.isApproved).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            University Academic Registry
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Official Practicum Transcripts & Institutional Broadsheet
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate verifiable individual student practicum transcripts, broadsheet gazettes, and official accreditation reports with cryptographic security seals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/${params.tenant}/admin/grading`}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Award className="w-3.5 h-3.5" />
            Open Scorebook Desk
          </Link>
        </div>
      </div>

      {/* Cohort Certification Status Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 p-6 rounded-2xl border border-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
            Academic Cycle Certification
          </span>
          <h3 className="text-xl font-bold">{cycle.name}</h3>
          <p className="text-xs text-slate-300 mt-1">
            Academic Year {cycle.academicYear} • {cycle.requiredHours} Required Clinical Hours
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-800/80 px-5 py-3 rounded-2xl border border-slate-700">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Certified Grades
            </span>
            <span className="text-xl font-black text-emerald-400">
              {approvedGradesCount} / {students.length}
            </span>
          </div>
          <Lock className="w-6 h-6 text-emerald-400" />
        </div>
      </div>

      {/* Trainees List for Transcript Generation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Student Practicum Dossiers & Official Transcripts
          </h3>
          <span className="text-xs text-slate-500">{students.length} Students Enrolled</span>
        </div>

        <div className="divide-y divide-slate-100">
          {students.map((student) => {
            const alloc = student.allocation;
            const grade = student.grade;
            const verifiedMins = alloc?.practiceEvents
              .filter((e) => e.verificationStatus === "VERIFIED")
              .reduce((s, e) => s + e.verifiedMinutes, 0) || 0;
            const verifiedHours = (verifiedMins / 60).toFixed(1);

            return (
              <div
                key={student.id}
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">
                      {student.person.firstName} {student.person.lastName}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {student.matricNumber}
                    </span>
                    {grade?.isApproved ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Board Certified
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Provisional
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {alloc?.hostOrg.name || "Placement Agency"} • Verified Hours: {verifiedHours} /{" "}
                    {cycle.requiredHours} hrs
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Final Grade
                    </span>
                    <span
                      className={`text-lg font-black ${
                        grade?.letterGrade === "A"
                          ? "text-emerald-700"
                          : grade?.letterGrade === "B"
                          ? "text-blue-700"
                          : "text-amber-700"
                      }`}
                    >
                      {grade?.letterGrade || "—"} ({grade?.compositeScore ? `${grade.compositeScore}%` : "Pending"})
                    </span>
                  </div>

                  <Link
                    href={`/${params.tenant}/admin/reports/${student.id}`}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-emerald-600 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Official Transcript
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
