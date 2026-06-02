import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const dir = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(dir, "..", "neon.db"));
const r = db
  .prepare(
    "UPDATE messages SET deleted = 1, deleted_at = datetime('now'), audio_data = NULL WHERE type = 'audio' AND deleted = 0",
  )
  .run();
console.log(`Removed ${r.changes} voice message(s)`);
db.close();
