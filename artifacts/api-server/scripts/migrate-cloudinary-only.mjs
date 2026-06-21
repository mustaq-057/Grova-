/**
 * Re-upload media still pointing at the old Cloudinary account (djlbatypz)
 * into the NEW account configured in CLOUDINARY_URL, then rewrite DB URLs.
 *
 * Run from repo root:
 *   pnpm --filter @workspace/api-server exec node scripts/migrate-cloudinary-only.mjs
 */
import { config } from "dotenv";
import crypto from "node:crypto";
import { Readable } from "node:stream";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
config({ path: join(repoRoot, ".env") });

const DATABASE_URL = process.env.DATABASE_URL;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const OLD_CLOUD = "djlbatypz";

if (!DATABASE_URL) {
  console.error("Set DATABASE_URL in .env");
  process.exit(1);
}
if (!process.env.CLOUDINARY_URL?.startsWith("cloudinary://")) {
  console.error("Set CLOUDINARY_URL to the NEW Cloudinary account in .env");
  process.exit(1);
}
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  console.error("ENCRYPTION_KEY must be 64 hex chars in .env");
  process.exit(1);
}

const match = process.env.CLOUDINARY_URL.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
if (!match) {
  console.error("Invalid CLOUDINARY_URL format");
  process.exit(1);
}
cloudinary.config({
  cloud_name: match[3],
  api_key: match[1],
  api_secret: match[2],
  secure: true,
});

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

const urlCache = new Map();

function needsMigration(url) {
  if (!url || typeof url !== "string") return false;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
  return url.includes(`res.cloudinary.com/${OLD_CLOUD}/`);
}

async function uploadBuffer(buffer, contentType, keyHint) {
  const key = `migrated/${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${keyHint.replace(/[^\w.-]+/g, "_").slice(0, 40)}`;
  const resourceType = contentType.startsWith("video/")
    ? "video"
    : contentType.startsWith("image/")
      ? "image"
      : "raw";
  const publicId =
    resourceType === "raw" || resourceType === "video"
      ? `grova/${key}`
      : `grova/${key.replace(/\.[^.]+$/, "")}`;

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
  console.log(`  ✓ ${url.slice(0, 60)}… → ${newUrl.slice(0, 60)}…`);
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

async function tableExists(pool, name) {
  const r = await pool.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    [name],
  );
  return r.rows.length > 0;
}

async function main() {
  console.log("\n☁️  Cloudinary migration (old djlbatypz → new account)\n");
  const pool = await createPool(DATABASE_URL);

  try {
    const profiles = await pool.query(`SELECT id, avatar FROM profiles`);
    for (const row of profiles.rows) {
      const avatar = await migratePlainUrl(row.avatar);
      if (avatar !== row.avatar) {
        await pool.query(`UPDATE profiles SET avatar = $1 WHERE id = $2`, [avatar, row.id]);
      }
    }

    for (const table of ["posts", "stories"]) {
      if (!(await tableExists(pool, table))) continue;
      const rows = await pool.query(`SELECT id, media_url FROM ${table}`);
      for (const row of rows.rows) {
        const media = await migratePlainUrl(row.media_url);
        if (media !== row.media_url) {
          await pool.query(`UPDATE ${table} SET media_url = $1 WHERE id = $2`, [media, row.id]);
        }
      }
    }

    if (await tableExists(pool, "library_books")) {
      const books = await pool.query(`SELECT id, epub_url FROM library_books`);
      for (const row of books.rows) {
        const epub = await migratePlainUrl(row.epub_url);
        if (epub !== row.epub_url) {
          await pool.query(`UPDATE library_books SET epub_url = $1 WHERE id = $2`, [epub, row.id]);
        }
      }
    }

    const msgCols = ["image_url", "gif_url", "file_data"];
    const encCols = ["text", "audio_data", "image_data"];
    const messages = await pool.query(`SELECT * FROM messages`);
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
      await pool.query(`UPDATE messages SET ${sets} WHERE id = $${keys.length + 1}`, [
        ...keys.map((k) => patches[k]),
        row.id,
      ]);
      msgUpdates++;
    }

    console.log(`\n✅ Done. Re-uploaded ${urlCache.size} files, updated ${msgUpdates} messages.\n`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
