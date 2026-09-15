import { createAdminClient } from "@/lib/supabase/admin";
import { readFileSync } from "fs";
import { join } from "path";

async function migrate() {
  const sb = createAdminClient();
  if (!sb) {
    console.error("Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const migrationsDir = join(process.cwd(), "supabase", "migrations");
  const files = ["001_create_schema.sql", "002_seed_data.sql"];

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    console.log(`Running ${file}...`);

    const { error } = await sb.rpc("exec_sql", { query: sql });
    if (error) {
      console.error(`Error in ${file}:`, error.message);
      process.exit(1);
    }
    console.log(`  ✓ ${file} applied`);
  }

  console.log("\nAll migrations applied successfully!");
}

migrate().catch(console.error);
