import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided in form data." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the 10MB limit." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type '${file.type}' is not supported. Please upload a PDF, PNG, JPG, or DOCX.` },
        { status: 400 }
      );
    }

    // Convert file to ArrayBuffer and Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compute cryptographic SHA-256 tamper-evident checksum
    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

    // Sanitize filename to prevent PII exposure in URLs
    const extension = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const sanitizedKey = `evidence_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${extension}`;

    // Initialize Supabase Admin Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Upload to Supabase Storage bucket 'evidence-vault'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("evidence-vault")
      .upload(sanitizedKey, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase Storage upload error:", uploadError);
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get Public URL
    const { data: urlData } = supabase.storage
      .from("evidence-vault")
      .getPublicUrl(sanitizedKey);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      storagePath: uploadData.path,
      checksum,
      sanitizedFilename: sanitizedKey,
      originalFilename: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type,
    });
  } catch (error: any) {
    console.error("Evidence Vault upload handler exception:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during upload." },
      { status: 500 }
    );
  }
}
