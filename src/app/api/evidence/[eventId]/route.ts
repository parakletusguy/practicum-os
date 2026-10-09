import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { AuthenticationError, AuthorizationError, requireAuthenticatedActor } from "@/lib/authz";
import { getSupabasePublicConfig, isDemoMode } from "@/lib/runtime-mode";

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const event = await db.practiceEvent.findUnique({
      where: { id: params.eventId },
      include: {
        allocation: { include: { cycle: true } },
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

    if (!isDemoMode()) {
      const actor = await requireAuthenticatedActor();
      const directlyAssigned = [
        event.allocation.studentPersonId,
        event.allocation.fieldSupervisorId,
        event.allocation.academicSupervisorId,
      ].includes(actor.id);
      const coordinatorMembership = await db.orgMembership.findFirst({
        where: {
          personId: actor.id,
          organisationId: event.allocation.cycle.tenantId,
          status: "ACTIVE",
          role: { in: ["COORDINATOR", "INSTITUTION_ADMIN"] },
        },
        select: { id: true },
      });

      if (!directlyAssigned && !coordinatorMembership) {
        throw new AuthorizationError("You may not access this evidence.");
      }
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
      .createSignedUrl(event.evidenceUrl, 60);
    if (error || !data?.signedUrl) {
      console.error("Evidence signed URL error:", error);
      return NextResponse.json({ error: "Evidence is temporarily unavailable." }, { status: 503 });
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Evidence download error:", error);
    return NextResponse.json({ error: "Unable to retrieve evidence." }, { status: 500 });
  }
}
