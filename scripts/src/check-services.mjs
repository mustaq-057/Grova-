#!/usr/bin/env node
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
config({ path: path.join(root, ".env") });

const results = [];

async function run() {
  try {
    const { Pool, neonConfig } = await import("@neondatabase/serverless");
    const ws = (await import("ws")).default;
    neonConfig.webSocketConstructor = ws;
    const u = new URL(process.env.DATABASE_URL);
    u.searchParams.delete("channel_binding");
    const pool = new Pool({ connectionString: u.toString(), max: 1 });
    await pool.query("SELECT 1");
    await pool.end();
    results.push(["Neon PostgreSQL", "OK"]);
  } catch (e) {
    results.push(["Neon PostgreSQL", `FAIL: ${e.message}`]);
  }

  try {
    if (!process.env.CLOUDINARY_URL?.startsWith("cloudinary://")) {
      throw new Error("CLOUDINARY_URL not set");
    }
    const { v2: cloudinary } = await import("cloudinary");
    cloudinary.config({ secure: true });
    await cloudinary.api.ping();
    results.push(["Cloudinary", "OK"]);
  } catch (e) {
    results.push(["Cloudinary", `FAIL: ${e.message}`]);
  }

  console.log("\nService connectivity:\n");
  for (const [name, status] of results) {
    console.log(`  ${status.startsWith("OK") ? "✅" : "❌"} ${name}: ${status}`);
  }
  console.log("");
  process.exit(results.some(([, s]) => s.startsWith("FAIL")) ? 1 : 0);
}

run();
