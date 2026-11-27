import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/auth/login/actions";
import { db } from "@/lib/db";

export default async function RsuAccessRequestedPage() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || typeof data?.claims?.sub !== "string") redirect("/auth/login?institution=rsu");
  const request = await db.auditLog.findFirst({
    where: { tenant: { slug: "rsu" }, actionType: "RSU_PILOT_ACCESS_REQUESTED", resourceType: "AuthIdentity", resourceId: data.claims.sub },
    select: { id: true },
  });
  if (!request) redirect("/auth/workspaces");
  return (
    <main className="mx-auto max-w-xl space-y-4 px-5 py-14">
      <p className="text-sm font-semibold text-emerald-800">Rivers State University · Social Work</p>
      <h1 className="text-2xl font-bold">Pilot access requested</h1>
      <p>Your email is verified. The practicum office needs to assign your role before you can open the pilot workspace.</p>
      <div className="flex gap-4 text-sm font-semibold text-emerald-800">
        <Link href="/auth/workspaces" className="underline">Check workspaces</Link>
        <form action={signOutAction}><button className="underline">Sign out</button></form>
      </div>
    </main>
  );
}
