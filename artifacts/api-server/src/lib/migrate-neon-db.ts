import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { encryptStoredField, isEncryptedPayload } from "./message-storage";

type DbExec = {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
  execute: (sql: string, params?: unknown[]) => Promise<unknown>;
};

/** Copy grova.db → neon.db once if switching default database name. */
export function ensureNeonSqliteFile(dbPath: string): void {
  if (!dbPath.endsWith("neon.db")) return;
  if (!fs.existsSync(dbPath)) {
    const legacy = path.join(path.dirname(dbPath), "grova.db");
    if (fs.existsSync(legacy)) {
      fs.copyFileSync(legacy, dbPath);
      console.log("[neon] Copied grova.db → neon.db");
    }
    return;
  }
  // neon exists but may be empty while grova still has data
  try {
    const neon = new Database(dbPath);
    const grovaPath = path.join(path.dirname(dbPath), "grova.db");
    const neonCount = neon.prepare("SELECT COUNT(*) as c FROM messages").get() as { c: number };
    if (neonCount.c === 0 && fs.existsSync(grovaPath)) {
      const grova = new Database(grovaPath, { readonly: true });
      const rows = grova.prepare("SELECT * FROM messages").all();
      if (rows.length > 0) {
        const insert = neon.prepare(`
          INSERT OR IGNORE INTO messages (
            id, sender_id, text, type, audio_data, gif_url, image_data,
            timestamp, liked, deleted, deleted_at, variant, companion_sticker
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const tx = neon.transaction((list: Record<string, unknown>[]) => {
          let n = 0;
          for (const r of list) {
            const res = insert.run(
              r.id, r.sender_id, r.text, r.type, r.audio_data, r.gif_url, r.image_data,
              r.timestamp, r.liked, r.deleted, r.deleted_at, r.variant, r.companion_sticker,
            );
            if (res.changes) n++;
          }
          return n;
        });
        const copied = tx(rows as Record<string, unknown>[]);
        console.log(`[neon] Migrated ${copied} message(s) from grova.db`);
      }
      grova.close();
    }
    neon.close();
  } catch (err) {
    console.warn("[neon] grova→neon migration skipped:", err);
  }
}

/** Encrypt any plaintext message / voice / image blobs still in the database. */
export async function encryptLegacyMessageFields(db: DbExec): Promise<number> {
  const result = await db.query(
    `SELECT id, text, audio_data, image_data FROM messages
     WHERE deleted = 0 AND (text IS NOT NULL OR audio_data IS NOT NULL OR image_data IS NOT NULL)`,
  );
  let updated = 0;
  for (const row of result.rows) {
    const id = String(row.id);
    const patches: { col: string; val: string }[] = [];
    for (const col of ["text", "audio_data", "image_data"] as const) {
      const raw = row[col];
      if (raw == null || raw === "") continue;
      const s = String(raw);
      if (isEncryptedPayload(s)) continue;
      const enc = encryptStoredField(s);
      if (enc) patches.push({ col, val: enc });
    }
    if (patches.length === 0) continue;
    const sets = patches.map((p) => `${p.col} = ?`).join(", ");
    await db.execute(`UPDATE messages SET ${sets} WHERE id = ?`, [
      ...patches.map((p) => p.val),
      id,
    ]);
    updated++;
  }
  if (updated > 0) {
    console.log(`[neon] Encrypted legacy fields on ${updated} message(s)`);
  }
  return updated;
}
