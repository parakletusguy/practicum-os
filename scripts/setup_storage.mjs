import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking storage.buckets...");
  try {
    const buckets = await prisma.$queryRaw`SELECT id, name, public FROM storage.buckets`;
    console.log("Existing buckets in DB:", buckets);

    const exists = buckets.some((b) => b.id === "evidence-vault" || b.name === "evidence-vault");
    if (!exists) {
      console.log("Creating 'evidence-vault' storage bucket...");
      await prisma.$executeRaw`
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
          'evidence-vault', 
          'evidence-vault', 
          true, 
          10485760, 
          ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
        )
        ON CONFLICT (id) DO NOTHING;
      `;
      console.log("✓ 'evidence-vault' bucket created successfully in storage.buckets!");
    } else {
      console.log("✓ 'evidence-vault' bucket already exists.");
    }

    // Set permissive RLS for evidence-vault so public/anon can read/insert
    await prisma.$executeRawUnsafe(`ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`);
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Public Evidence Vault Select" ON storage.objects;`);
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Public Evidence Vault Insert" ON storage.objects;`);
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Public Evidence Vault Update" ON storage.objects;`);
    
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Public Evidence Vault Select"
      ON storage.objects FOR SELECT
      TO public, anon, authenticated
      USING (bucket_id = 'evidence-vault');
    `);

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Public Evidence Vault Insert"
      ON storage.objects FOR INSERT
      TO public, anon, authenticated
      WITH CHECK (bucket_id = 'evidence-vault');
    `);

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Public Evidence Vault Update"
      ON storage.objects FOR UPDATE
      TO public, anon, authenticated
      USING (bucket_id = 'evidence-vault');
    `);
    console.log("✓ Storage RLS policies configured for 'evidence-vault'!");

  } catch (err) {
    console.error("Storage setup error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
