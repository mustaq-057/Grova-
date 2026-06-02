/**
 * Push local neon.db (SQLite) messages into Neon Postgres cloud.
 * Run after setting DATABASE_URL to your Neon connection string.
 */
import { config } from "dotenv";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import Database from "better-sqlite3";
import pg from "pg";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
config({ path: join(repoRoot, ".env") });

const dir = dirname(fileURLToPath(import.meta.url));
const sqlitePath = join(dir, "..", "neon.db");
const url = process.env.DATABASE_URL;

if (!url?.startsWith("postgresql")) {
  console.error("Set DATABASE_URL to your Neon postgresql:// connection string first.");
  process.exit(1);
}

if (!existsSync(sqlitePath)) {
  console.log("No local neon.db to upload.");
  process.exit(0);
}

const sqlite = new Database(sqlitePath, { readonly: true });
const rows = sqlite.prepare("SELECT * FROM messages").all();
sqlite.close();

if (rows.length === 0) {
  console.log("Local neon.db has no messages.");
  process.exit(0);
}

const pool = new pg.Pool({
  connectionString: url,
  connectionTimeoutMillis: 30000,
  ssl: url.includes("neon.tech") ? { rejectUnauthorized: false } : undefined,
});

const client = await pool.connect();
try {
  for (const r of rows) {
    await client.query(
      `INSERT INTO messages (
        id, sender_id, text, type, audio_data, gif_url, image_data,
        timestamp, liked, deleted, deleted_at, variant, companion_sticker
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      ON CONFLICT (id) DO NOTHING`,
      [
        r.id,
        r.sender_id,
        r.text,
        r.type,
        r.audio_data,
        r.gif_url,
        r.image_data,
        r.timestamp,
        r.liked,
        r.deleted,
        r.deleted_at,
        r.variant,
        r.companion_sticker,
      ],
    );
  }
  const count = await client.query("SELECT COUNT(*)::int AS c FROM messages WHERE deleted = 0");
  console.log(`Neon cloud now has ${count.rows[0].c} active message(s). Uploaded from local neon.db.`);
} finally {
  client.release();
  await pool.end();
}
