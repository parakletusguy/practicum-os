import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { AuthenticationError, requireAuthenticatedActor } from "@/lib/authz";
import { DEMO_PERSONAS } from "@/lib/auth-personas";
import { allocationRecordScope } from "@/lib/record-access";
import { getSupabasePublicConfig, isDemoMode } from "@/lib/runtime-mode";

export async function GET(request: NextRequest, props: { params: Promise<{ eventId: string }> }) {
  const params = await props.params;
  try {
    const actor = isDemoMode() ? null : await requireAuthenticatedActor();
    const event = await db.practiceEvent.findUnique({
      where: {
        id: params.eventId,
        allocation: actor
          ? allocationRecordScope(actor.id)
          : { cycle: { tenant: { slug: DEMO_PERSONAS.admin.tenantSlug } } },
      },
      select: {
        evidenceUrl: true,
        allocationId: true,
      },
    });
    if (!event?.evidenceUrl) {
      return NextResponse.json({ error: "Evidence was not found." }, { status: 404 });
    }
    if (event.evidenceUrl.includes("://") || !event.evidenceUrl.startsWith(`${event.allocationId}/`)) {
      return NextResponse.json(
        { error: "This legacy evidence reference must be migrated before it can be accessed." },
        { status: 410 }
      );
    }

    const config = getSupabasePublicConfig();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!config || !serviceRoleKey) {
      return NextResponse.json({ error: "Evidence storage is not configured." }, { status: 503 });
    }

    const supabase = createClient(config.url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await supabase.storage
      .from("evidence-vault")
      .createSignedUrl(event.evidenceUrl, 60, { download: true });
    if (error || !data?.signedUrl) {
      console.error("Evidence signed URL error:", error);
      return NextResponse.json({ error: "Evidence is temporarily unavailable." }, { status: 503 });
    }

    const response = NextResponse.redirect(data.signedUrl);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("Evidence download error:", error);
    return NextResponse.json({ error: "Unable to retrieve evidence." }, { status: 500 });
  }
}
