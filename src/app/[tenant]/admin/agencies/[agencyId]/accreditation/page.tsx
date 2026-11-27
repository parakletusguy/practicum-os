import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePortalAccess } from "@/lib/portal-access";
import { accreditationDueDate, accreditationReviewAction, renewalLabel } from "@/modules/placement-matching/accreditation";
import { AccreditationReviewForm } from "./review-form";

export default async function AccreditationPage({ params }: { params: Promise<{ tenant: string; agencyId: string }> }) {
  const { tenant: slug, agencyId } = await params;
  const { tenant } = await requirePortalAccess(slug, "admin");
  const agency = await db.organisation.findFirst({
    where: { id: agencyId, tenantId: tenant.id },
    select: { name: true, settings: true, updatedAt: true, verificationStatus: true },
  });
  if (!agency) notFound();
  const history = await db.auditLog.findMany({
    where: { tenantId: tenant.id, resourceType: "Organisation", resourceId: agencyId, actionType: accreditationReviewAction },
    select: { id: true, createdAt: true, afterState: true, actor: { select: { firstName: true, lastName: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  const dueOn = accreditationDueDate(agency.settings);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href={`/${slug}/admin/agencies`} className="text-sm text-emerald-800 underline">Back to agencies</Link>
      <h1 className="text-2xl font-bold">{agency.name} accreditation</h1>
      <p className="text-sm">{agency.verificationStatus} · {renewalLabel(dueOn)}</p>
      <AccreditationReviewForm tenantSlug={slug} agencyId={agencyId} version={agency.updatedAt.toISOString()} dueOn={dueOn} />
      <section className="space-y-3 rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Review history</h2>
        {history.length === 0 && <p className="text-sm text-slate-600">No reviews recorded yet.</p>}
        {history.map(({ id, createdAt, actor, afterState }) => {
          const review = afterState && typeof afterState === "object" && !Array.isArray(afterState) ? afterState : {};
          return (
            <article key={id} className="space-y-1 border-t pt-2 text-sm">
              <p className="font-semibold">{createdAt.toISOString().slice(0, 10)} · {String(review.verificationStatus ?? "")}</p>
              {actor && <p>{actor.firstName} {actor.lastName}</p>}
              {typeof review.renewalDueOn === "string" && <p>Renewal due {review.renewalDueOn}</p>}
              {typeof review.notes === "string" && <p className="whitespace-pre-wrap">{review.notes}</p>}
            </article>
          );
        })}
      </section>
    </div>
  );
}
