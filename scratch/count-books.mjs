import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env");
if (!fs.existsSync(envPath)) {
  console.error("Missing .env");
  process.exit(1);
}

const env = {};
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

async function checkDb(name, url) {
  if (!url?.startsWith("postgresql://")) {
    console.log(`${name}: URL missing or invalid`);
    return;
  }
  try {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 10000 });
    const r = await pool.query("SELECT COUNT(*)::int AS n FROM library_books");
    console.log(`${name} TOTAL_BOOKS:`, r.rows[0]?.n ?? 0);
    
    const r2 = await pool.query("SELECT source, COUNT(*)::int AS count FROM library_books GROUP BY source ORDER BY count DESC");
    console.log(`${name} Books by source:`);
    for (const row of r2.rows) {
      console.log(`- ${row.source}: ${row.count}`);
    }
    
    await pool.end();
  } catch (e) {
    console.log(`${name} Error:`, e.message);
  }
}

await checkDb("DATABASE_URL", env.DATABASE_URL);
await checkDb("OLD_DATABASE_URL", env.OLD_DATABASE_URL);
