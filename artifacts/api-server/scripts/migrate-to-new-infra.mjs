/**
 * One-time: copy all data from OLD_DATABASE_URL → DATABASE_URL and re-upload
 * media hosted on the old Cloudinary account to the new Cloudinary/B2 stack.
 *
 * Run: pnpm --filter @workspace/api-server exec node scripts/migrate-to-new-infra.mjs
 */
import { config } from "dotenv";
import crypto from "node:crypto";
import { Readable } from "node:stream";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v2 as cloudinary } from "cloudinary";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
config({ path: join(repoRoot, ".env") });

const OLD_DB = process.env.OLD_DATABASE_URL;
const NEW_DB = process.env.DATABASE_URL;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!OLD_DB || !NEW_DB) {
  console.error("Set OLD_DATABASE_URL and DATABASE_URL in .env");
  process.exit(1);
}
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  console.error("ENCRYPTION_KEY must be 64 hex chars in .env");
  process.exit(1);
}

const OLD_CLOUD = "djlbatypz";
const OLD_B2_HOST = "s3.us-east-005.backblazeb2.com";

function normalizeUrl(raw) {
  const url = new URL(raw);
  url.searchParams.delete("channel_binding");
  return url.toString();
}

async function createPool(url) {
  const normalized = normalizeUrl(url);
  if (normalized.includes("neon.tech")) {
    const { Pool, neonConfig } = await import("@neondatabase/serverless");
    const ws = (await import("ws")).default;
    neonConfig.webSocketConstructor = ws;
    return new Pool({ connectionString: normalized, max: 3 });
  }
  const pg = await import("pg");
  return new pg.default.Pool({
    connectionString: normalized,
    ssl: { rejectUnauthorized: false },
    max: 3,
  });
}

const CIPHER_RE = /^(?:\d+:)?[0-9a-f]{16,}:[0-9a-f]{16,}:[0-9a-f]+$/i;
const keyBuf = Buffer.from(ENCRYPTION_KEY, "hex");

function isEncrypted(value) {
  return typeof value === "string" && CIPHER_RE.test(value);
}

function decryptField(value) {
  if (value == null || value === "") return value;
  const s = String(value);
  if (!isEncrypted(s)) return s;
  const parts = s.split(":");
  try {
    if (parts.length === 3) {
      const iv = Buffer.from(parts[0], "hex");
      const authTag = Buffer.from(parts[1], "hex");
      const decipher = crypto.createDecipheriv("aes-256-gcm", keyBuf, iv);
      decipher.setAuthTag(authTag);
      return decipher.update(parts[2], "hex", "utf8") + decipher.final("utf8");
    }
    if (parts.length === 4) {
      const iv = Buffer.from(parts[1], "hex");
      const authTag = Buffer.from(parts[2], "hex");
      const decipher = crypto.createDecipheriv("aes-256-gcm", keyBuf, iv);
      decipher.setAuthTag(authTag);
      return decipher.update(parts[3], "hex", "utf8") + decipher.final("utf8");
    }
  } catch {
    return s;
  }
  return s;
}

function encryptField(value) {
  if (value == null || value === "") return value;
  const s = String(value);
  if (isEncrypted(s)) return s;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyBuf, iv);
  let enc = cipher.update(s, "utf8", "hex");
  enc += cipher.final("hex");
  return `1:${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${enc}`;
}

if (process.env.CLOUDINARY_URL) {
  const match = process.env.CLOUDINARY_URL.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
  if (match) {
    cloudinary.config({
      cloud_name: match[3],
      api_key: match[1],
      api_secret: match[2],
      secure: true,
    });
  }
}

const b2Client =
  process.env.B2_KEY_ID && process.env.B2_APPLICATION_KEY && process.env.B2_ENDPOINT
    ? new S3Client({
        region: "us-east-1",
        endpoint: process.env.B2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.B2_KEY_ID,
          secretAccessKey: process.env.B2_APPLICATION_KEY,
        },
      })
    : null;

const urlCache = new Map();

function needsMigration(url) {
  if (!url || typeof url !== "string") return false;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
  if (url.includes(`res.cloudinary.com/${OLD_CLOUD}/`)) return true;
  if (url.includes(OLD_B2_HOST)) return true;
  return false;
}

async function uploadBuffer(buffer, contentType, keyHint) {
  const key = `migrated/${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${keyHint.replace(/[^\w.-]+/g, "_").slice(0, 40)}`;

  if (process.env.CLOUDINARY_URL) {
    const resourceType = contentType.startsWith("video/")
      ? "video"
      : contentType.startsWith("image/")
        ? "image"
        : "raw";
    const publicId = `grova/${key.replace(/\.[^.]+$/, "")}`;
    if (resourceType === "video" || resourceType === "raw" || buffer.length > 512 * 1024) {
      return new Promise((resolveUrl, reject) => {
        const upload = cloudinary.uploader.upload_stream(
          { public_id: publicId, resource_type: resourceType, overwrite: true },
          (err, result) => {
            if (err) reject(err);
            else resolveUrl(result.secure_url);
          },
        );
        Readable.from(buffer).pipe(upload);
      });
    }
    const result = await cloudinary.uploader.upload(
      `data:${contentType};base64,${buffer.toString("base64")}`,
      { public_id: publicId, resource_type: resourceType, overwrite: true },
    );
    return result.secure_url;
  }

  if (b2Client) {
    await b2Client.send(
      new PutObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME || "mustaq",
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    return `${process.env.B2_ENDPOINT}/${process.env.B2_BUCKET_NAME || "mustaq"}/${key}`;
  }

  throw new Error("No storage backend configured");
}

async function migrateUrl(url) {
  if (!needsMigration(url)) return url;
  if (urlCache.has(url)) return urlCache.get(url);

  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  ⚠ Could not fetch ${url.slice(0, 80)}… (${res.status})`);
    return url;
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "application/octet-stream";
  const newUrl = await uploadBuffer(buffer, contentType, url.split("/").pop() || "file");
  urlCache.set(url, newUrl);
  console.log(`  ✓ Migrated media → ${newUrl.slice(0, 72)}…`);
  return newUrl;
}

async function migrateMaybeEncrypted(value, { reencrypt = false } = {}) {
  if (value == null || value === "") return value;
  const raw = String(value);
  const plain = isEncrypted(raw) ? decryptField(raw) : raw;
  if (!needsMigration(plain)) return value;
  const migrated = await migrateUrl(plain);
  if (isEncrypted(raw) || reencrypt) return encryptField(migrated);
  return migrated;
}

async function migratePlainUrl(value) {
  if (value == null || value === "") return value;
  const s = String(value);
  if (!needsMigration(s)) return s;
  return migrateUrl(s);
}

const TABLES = [
  "profiles",
  "couple_code",
  "profile_codes",
  "couple_prefs",
  "messages",
  "posts",
  "stories",
  "post_reactions",
  "post_likes",
  "post_comments",
  "shared_tasks",
  "hidden_messages",
  "chat_clear_state",
  "duas",
  "activity_feed",
  "push_subscriptions",
  "public_keys",
  "two_factor_auth",
  "message_reactions",
  "message_read_receipts",
  "message_media_opens",
  "forwarded_messages",
  "message_edits",
  "pinned_messages",
  "calendar_events",
  "daily_checkins",
  "relationship_milestones",
  "secret_notes",
  "scheduled_messages",
  "devices",
  "sessions",
  "primary_access_tokens",
];

async function tableExists(pool, name) {
  const r = await pool.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    [name],
  );
  return r.rows.length > 0;
}

async function getColumns(pool, name) {
  const r = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
    [name],
  );
  return r.rows.map((row) => row.column_name);
}

async function copyTable(oldPool, newPool, name) {
  if (!(await tableExists(oldPool, name))) {
    console.log(`  skip ${name} (not on source)`);
    return 0;
  }
  const cols = await getColumns(oldPool, name);
  if (cols.length === 0) return 0;

  const { rows } = await oldPool.query(`SELECT * FROM ${name}`);
  if (rows.length === 0) {
    console.log(`  ${name}: 0 rows`);
    return 0;
  }

  const colList = cols.map((c) => `"${c}"`).join(", ");
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
  let inserted = 0;

  for (const row of rows) {
    const values = cols.map((c) => row[c]);
    try {
      await newPool.query(
        `INSERT INTO ${name} (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
        values,
      );
      inserted++;
    } catch {
      try {
        await newPool.query(`INSERT INTO ${name} (${colList}) VALUES (${placeholders})`, values);
        inserted++;
      } catch (err2) {
        console.warn(`  ⚠ ${name} row insert failed:`, err2.message.slice(0, 100));
      }
    }
  }
  console.log(`  ${name}: copied ${inserted}/${rows.length} rows`);
  return inserted;
}

async function migrateMediaFields(newPool) {
  console.log("\n📸 Migrating stored media URLs…");

  const profiles = await newPool.query(`SELECT id, avatar FROM profiles`);
  for (const row of profiles.rows) {
    const avatar = await migratePlainUrl(row.avatar);
    if (avatar !== row.avatar) {
      await newPool.query(`UPDATE profiles SET avatar = $1 WHERE id = $2`, [avatar, row.id]);
    }
  }

  for (const table of ["posts", "stories"]) {
    if (!(await tableExists(newPool, table))) continue;
    const rows = await newPool.query(`SELECT id, media_url FROM ${table}`);
    for (const row of rows.rows) {
      const media = await migratePlainUrl(row.media_url);
      if (media !== row.media_url) {
        await newPool.query(`UPDATE ${table} SET media_url = $1 WHERE id = $2`, [media, row.id]);
      }
    }
  }

  const msgCols = ["image_url", "gif_url", "file_data"];
  const encCols = ["text", "audio_data", "image_data"];
  const messages = await newPool.query(`SELECT * FROM messages`);
  let msgUpdates = 0;
  for (const row of messages.rows) {
    const patches = {};
    for (const col of msgCols) {
      if (row[col] != null && row[col] !== "") {
        const next = await migrateMaybeEncrypted(row[col]);
        if (next !== row[col]) patches[col] = next;
      }
    }
    for (const col of encCols) {
      if (row[col] != null && row[col] !== "") {
        const next = await migrateMaybeEncrypted(row[col], { reencrypt: isEncrypted(String(row[col])) });
        if (next !== row[col]) patches[col] = next;
      }
    }
    const keys = Object.keys(patches);
    if (keys.length === 0) continue;
    const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
    await newPool.query(`UPDATE messages SET ${sets} WHERE id = $${keys.length + 1}`, [
      ...keys.map((k) => patches[k]),
      row.id,
    ]);
    msgUpdates++;
  }
  console.log(`  messages with migrated URLs: ${msgUpdates}`);
  console.log(`  total media files re-uploaded: ${urlCache.size}`);
}

async function main() {
  console.log("\n🔄 Grova infra migration (old Neon → new Neon + new Cloudinary/B2)\n");

  const oldPool = await createPool(OLD_DB);
  const newPool = await createPool(NEW_DB);

  try {
    const oldCounts = await oldPool.query(`SELECT COUNT(*)::int AS c FROM messages`);
    const newBefore = await newPool.query(`SELECT COUNT(*)::int AS c FROM messages`).catch(() => ({ rows: [{ c: 0 }] }));
    console.log(`Source messages: ${oldCounts.rows[0]?.c ?? "?"}`);
    console.log(`Target messages (before): ${newBefore.rows[0]?.c ?? 0}\n`);

    console.log("📋 Copying tables…");
    for (const table of TABLES) {
      await copyTable(oldPool, newPool, table);
    }

    await migrateMediaFields(newPool);

    const newAfter = await newPool.query(`SELECT COUNT(*)::int AS c FROM messages`);
    const profileCount = await newPool.query(`SELECT COUNT(*)::int AS c FROM profiles`);
    console.log(`\n✅ Done. Target now has ${newAfter.rows[0].c} messages, ${profileCount.rows[0].c} profiles.`);
    console.log(`   Encryption key unchanged — existing encrypted chats remain readable.\n`);
  } finally {
    await oldPool.end();
    await newPool.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
