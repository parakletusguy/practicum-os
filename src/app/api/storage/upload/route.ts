import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { db } from "@/lib/db";
import { AuthenticationError, AuthorizationError, requireAuthenticatedActor } from "@/lib/authz";
import { getSupabasePublicConfig, isDemoMode } from "@/lib/runtime-mode";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const allocationId = formData.get("allocationId");

    if (!(file instanceof File) || typeof allocationId !== "string" || !allocationId) {
      return NextResponse.json(
        { error: "A file and placement allocation are required." },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Files must be between 1 byte and 10MB." }, { status: 400 });
    }
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: "This file type is not supported." }, { status: 400 });
    }

    const allocation = await db.placementAllocation.findUnique({
      where: { id: allocationId },
      select: { id: true, studentPersonId: true },
    });
    if (!allocation) {
      return NextResponse.json({ error: "Placement allocation not found." }, { status: 404 });
    }

    if (!isDemoMode()) {
      const actor = await requireAuthenticatedActor();
      if (allocation.studentPersonId !== actor.id) {
        throw new AuthorizationError("You may only upload evidence for your own placement.");
      }
    }

    const config = getSupabasePublicConfig();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!config || !serviceRoleKey) {
      return NextResponse.json({ error: "Evidence storage is not configured." }, { status: 503 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");
    const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
    const storagePath = `${allocation.id}/${crypto.randomUUID()}.${extension}`;
    const supabase = createClient(config.url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase.storage.from("evidence-vault").upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });
    if (error) {
      console.error("Evidence storage upload error:", error);
      return NextResponse.json({ error: "Evidence upload failed." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      storagePath: data.path,
      checksum,
      fileSizeBytes: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Evidence upload handler exception:", error);
    return NextResponse.json({ error: "Internal server error during upload." }, { status: 500 });
  }
}
