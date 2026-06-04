#!/usr/bin/env node
/** Local-only connection check — reads secrets from .env (never commit .env). */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(root, ".env");
if (!fs.existsSync(envPath)) {
  console.error("Missing .env — copy .env.example and fill in values.");
  process.exit(1);
}

const env = {};
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const dbUrl = env.DATABASE_URL;
console.log("\n🔍 Testing connections (from .env)…\n");

if (!dbUrl?.startsWith("postgresql://")) {
  console.log("❌ DATABASE_URL missing or invalid");
} else {
  try {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: dbUrl, max: 1, connectionTimeoutMillis: 15000 });
    const r = await pool.query("SELECT COUNT(*)::int AS n FROM profiles");
    console.log("✅ Database connected — profiles:", r.rows[0]?.n ?? 0);
    await pool.end();
  } catch (e) {
    console.log("❌ Database:", e.message?.slice(0, 120) ?? e);
  }
}

console.log(env.CLOUDINARY_URL ? "✅ Cloudinary configured" : "⚠️  CLOUDINARY_URL not set");
console.log(env.B2_KEY_ID ? "✅ B2 configured" : "⚠️  B2 not set");
console.log(env.ENCRYPTION_KEY?.length === 64 ? "✅ Encryption key length OK" : "⚠️  ENCRYPTION_KEY");
console.log("\nDone.\n");
