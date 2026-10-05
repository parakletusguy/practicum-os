"use client";

import { useState, useTransition } from "react";
import { Upload, X, Loader2, CheckCircle2, FileText, AlertCircle } from "lucide-react";
import { importCohortStudentsAction, StudentImportRecord } from "@/modules/practicum-core/cohort-actions";

interface CohortImportClientProps {
  tenantSlug: string;
  cycleId: string;
  cycleName: string;
}

export function CohortImportClient({
  tenantSlug,
  cycleId,
  cycleName,
}: CohortImportClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [csvText, setCsvText] = useState("");
  const [parsedRows, setParsedRows] = useState<StudentImportRecord[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const sampleCsv = `firstName,lastName,email,matricNumber,phone,level,specialty,locationPref
Oluwaseun,Balogun,o.balogun@student.unilag.edu.ng,190408055,+2348081112233,400L,Child Welfare,Ikeja
Zainab,Mohammed,z.mohammed@student.unilag.edu.ng,190408062,+2348082223344,400L,Psychosocial Support,Yaba
Chidiebere,Okeke,c.okeke@student.unilag.edu.ng,190408078,+2348083334455,400L,Community Development,Surulere
Fatima,Sanusi,f.sanusi@student.unilag.edu.ng,190408089,+2348084445566,400L,Medical Social Work,Lekki
Babajide,Williams,b.williams@student.unilag.edu.ng,190408094,+2348085556677,400L,Family Reconciliation,Victoria Island`;

  const handleParse = (text: string) => {
    setCsvText(text);
    setStatusMessage(null);
    if (!text.trim()) {
      setParsedRows([]);
      return;
    }

    const lines = text.trim().split("\n");
    if (lines.length <= 1) {
      setParsedRows([]);
      return;
    }

    const rows: StudentImportRecord[] = [];
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",").map((p) => p.trim());
      if (parts.length >= 4) {
        rows.push({
          firstName: parts[0] || "",
          lastName: parts[1] || "",
          email: parts[2] || "",
          matricNumber: parts[3] || "",
          phone: parts[4] || "",
          level: parts[5] || "400L",
          specialty: parts[6] || "General Practice",
          locationPref: parts[7] || "Lagos",
        });
      }
    }
    setParsedRows(rows);
  };

  const handleLoadSample = () => {
    handleParse(sampleCsv);
  };

  const handleImport = () => {
    if (parsedRows.length === 0) return;

    startTransition(async () => {
      const result = await importCohortStudentsAction({
        tenantSlug,
        cycleId,
        students: parsedRows,
      });

      if (result.success) {
        setStatusMessage({
          type: "success",
          text: `Successfully imported ${result.importedCount} student(s) into ${cycleName}.`,
        });
        setTimeout(() => {
          setIsOpen(false);
          setParsedRows([]);
          setCsvText("");
        }, 1500);
      } else {
        setStatusMessage({
          type: "error",
          text: result.error || "Failed to import students.",
        });
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
      >
        <Upload className="w-4 h-4" />
        Import Student Cohort (CSV)
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Bulk Ingest Student Cohort
                </h3>
                <p className="text-xs text-slate-500">
                  Import student list for: <span className="font-semibold text-slate-800">{cycleName}</span>
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Paste CSV text with columns: <code>firstName,lastName,email,matricNumber,phone,level,specialty,locationPref</code>
              </span>
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
              >
                Load Sample Data
              </button>
            </div>

            <textarea
              rows={5}
              placeholder="Paste comma-separated rows here..."
              value={csvText}
              onChange={(e) => handleParse(e.target.value)}
              className="w-full text-xs font-mono p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {/* Parsing Summary & Preview */}
            {parsedRows.length > 0 && (
              <div className="mt-4 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">
                    Preview: {parsedRows.length} Valid Records Detected
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Import
                  </span>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                      <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">Matric #</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Specialty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="p-2 font-medium">{r.firstName} {r.lastName}</td>
                          <td className="p-2 font-mono">{r.matricNumber}</td>
                          <td className="p-2 text-slate-500">{r.email}</td>
                          <td className="p-2 text-slate-600">{r.specialty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {statusMessage && (
              <div
                className={`mt-4 p-3 rounded-lg text-xs font-medium ${
                  statusMessage.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border border-rose-200 text-rose-800"
                }`}
              >
                {statusMessage.text}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={parsedRows.length === 0 || isPending}
                onClick={handleImport}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs disabled:opacity-60 cursor-pointer"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isPending ? "Importing Roster..." : `Import ${parsedRows.length} Students`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
