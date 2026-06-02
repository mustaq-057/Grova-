/**
 * One-time: copy messages from grova.db → neon.db when neon is empty.
 * Run: node scripts/migrate-grova-to-neon.mjs
 */
import Database from "better-sqlite3";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const dir = dirname(fileURLToPath(import.meta.url));
const root = join(dir, "..");
const neonPath = join(root, "neon.db");
const grovaPath = join(root, "grova.db");

if (!existsSync(grovaPath)) {
  console.log("No grova.db — nothing to migrate.");
  process.exit(0);
}

const neon = new Database(neonPath);
const grova = new Database(grovaPath, { readonly: true });

const neonCount = neon.prepare("SELECT COUNT(*) as c FROM messages").get().c;
const grovaRows = grova.prepare("SELECT * FROM messages").all();

console.log(`neon.db: ${neonCount} messages, grova.db: ${grovaRows.length} messages`);

if (grovaRows.length === 0) {
  console.log("grova.db is empty.");
  process.exit(0);
}

const insert = neon.prepare(`
  INSERT OR IGNORE INTO messages (
    id, sender_id, text, type, audio_data, gif_url, image_data,
    timestamp, liked, deleted, deleted_at, variant, companion_sticker
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const tx = neon.transaction((rows) => {
  let copied = 0;
  for (const r of rows) {
    const res = insert.run(
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
    );
    if (res.changes) copied++;
  }
  return copied;
});

const copied = tx(grovaRows);
console.log(`Migrated ${copied} message(s) into neon.db`);

const byType = neon
  .prepare("SELECT type, COUNT(*) as n FROM messages WHERE deleted=0 GROUP BY type")
  .all();
console.log("neon.db now:", byType);

neon.close();
grova.close();
