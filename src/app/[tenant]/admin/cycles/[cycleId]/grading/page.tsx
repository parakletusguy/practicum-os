import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePortalAccess } from "@/lib/portal-access";
import { DEFAULT_GRADING_FORMULA, readGradingFormula } from "@/modules/grading/formula";
import { GradingSettingsForm } from "./grading-settings-form";

export default async function CycleGradingPage({ params }: { params: Promise<{ tenant: string; cycleId: string }> }) {
  const { tenant: slug, cycleId } = await params;
  const { tenant } = await requirePortalAccess(slug, "admin");
  const cycle = await db.practicumCycle.findFirst({
    where: { id: cycleId, tenantId: tenant.id },
    select: { name: true, status: true, updatedAt: true, gradingFormula: true, _count: { select: { cohortGrades: true } } },
  });
  if (!cycle) notFound();
  let formula = DEFAULT_GRADING_FORMULA;
  let invalid = false;
  try { formula = readGradingFormula(cycle.gradingFormula); } catch { invalid = true; }
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href={`/${tenant.slug}/admin/cycles`} className="text-sm text-emerald-800 underline">Back to cycles</Link>
      <h1 className="text-2xl font-bold">Grading settings</h1>
      <p className="text-sm text-slate-600">{cycle.name}</p>
      {invalid && <p role="alert" className="text-sm text-amber-800">The saved weights are invalid. The form shows default settings for review.</p>}
      <GradingSettingsForm tenantSlug={tenant.slug} cycleId={cycleId} version={cycle.updatedAt.toISOString()} formula={formula}
        locked={cycle.status === "GRADING" || cycle.status === "ARCHIVED" || cycle._count.cohortGrades > 0} />
    </div>
  );
}
