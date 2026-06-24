import db from "./src/lib/db";
import { config } from "dotenv";
config({ path: "../.env" });

async function insertMock() {
  const id = "mock-123456";
  const author_id = "me";
  const media_url = "https://f005.backblazeb2.com/file/grova-mustaq-2026lol/stories/test-upload.jpg";
  const kind = "story";
  const created_at = Date.now().toString();
  const expires_at = (Date.now() + 86400000).toString();

  await db.execute(
    "INSERT INTO stories (id, author_id, media_url, kind, created_at, expires_at) VALUES ($1, $2, $3, $4, $5, $6)",
    [id, author_id, media_url, kind, created_at, expires_at]
  );
  console.log("Mock story inserted.");
}

insertMock().catch(console.error).finally(() => process.exit(0));
