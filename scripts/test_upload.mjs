import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testUpload() {
  const dummyPdf = Buffer.from("%PDF-1.4 Mock Clinical Case Assessment Document");
  const filename = `test_upload_${Date.now()}.pdf`;

  console.log(`Uploading ${filename} to 'evidence-vault'...`);
  const { data, error } = await supabase.storage
    .from("evidence-vault")
    .upload(filename, dummyPdf, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) {
    console.error("Upload error:", error);
  } else {
    console.log("✓ Upload succeeded! Data:", data);
    const { data: urlData } = supabase.storage
      .from("evidence-vault")
      .getPublicUrl(filename);
    console.log("✓ Public URL:", urlData.publicUrl);
  }
}

testUpload();
