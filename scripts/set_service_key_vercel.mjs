import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const sr = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!sr) {
  console.error("No SUPABASE_SERVICE_ROLE_KEY found in process.env");
  process.exit(1);
}

const tempFile = path.join(os.tmpdir(), "sr_key.txt");
fs.writeFileSync(tempFile, sr.trim());

for (const env of ["production", "preview", "development"]) {
  console.log(`Setting SUPABASE_SERVICE_ROLE_KEY for ${env}...`);
  execSync(`vercel env add SUPABASE_SERVICE_ROLE_KEY ${env} -y --force < "${tempFile}"`, {
    shell: "cmd.exe",
    stdio: "inherit",
  });
}

fs.unlinkSync(tempFile);
console.log("✓ SUPABASE_SERVICE_ROLE_KEY successfully added to Vercel!");
