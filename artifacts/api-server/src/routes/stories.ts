import { Router } from "express";
import db from "../lib/db";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";

const router = Router();

async function deleteB2File(url: string) {
  try {
    const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const region = process.env.AWS_REGION || "us-east-005";
    const endpoint = process.env.B2_ENDPOINT;
    const bucket = process.env.B2_BUCKET_NAME;
    const accessKeyId = process.env.B2_KEY_ID;
    const secretAccessKey = process.env.B2_APPLICATION_KEY;

    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return;

    // extract key from url
    // eg: https://f005.backblazeb2.com/file/bucket-name/stories/123.mp4 -> stories/123.mp4
    let key = "";
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.pathname.includes(`/file/${bucket}/`)) {
        key = parsedUrl.pathname.split(`/file/${bucket}/`)[1];
      } else if (parsedUrl.hostname === new URL(endpoint).hostname) {
         // https://s3.us-east-005.backblazeb2.com/bucket-name/stories/123.mp4
         key = parsedUrl.pathname.split(`/${bucket}/`)[1];
      } else if (process.env.B2_PUBLIC_URL && url.startsWith(process.env.B2_PUBLIC_URL)) {
         key = url.slice(process.env.B2_PUBLIC_URL.length).replace(/^\//, "");
      }
    } catch { }

    if (!key) return;

    const s3 = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });

    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (err) {
    console.error("Failed to delete B2 file:", err);
  }
}

router.post("/stories", authenticate, rateLimiters.messages, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    // Accept both camelCase (from frontend) and snake_case
    const media_url = req.body.mediaUrl ?? req.body.media_url;
    const kind = req.body.kind ?? "story";
    const text_overlay = req.body.text_overlay ?? req.body.textOverlay ?? null;

    if (!media_url) {
      res.status(400).json({ error: "media_url is required" });
      return;
    }

    const id = crypto.randomUUID();
    const created_at = Date.now().toString();
    const expires_at = (Date.now() + 24 * 60 * 60 * 1000).toString(); // 24 hours from now

    await db.execute(
      "INSERT INTO stories (id, author_id, media_url, kind, created_at, expires_at, text_overlay) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [id, userId, media_url, kind, created_at, expires_at, text_overlay]
    );

    const result = await db.query(
      `SELECT 
        id, 
        author_id as "authorId", 
        media_url as "mediaUrl", 
        kind, 
        created_at as "createdAt", 
        expires_at as "expiresAt", 
        text_overlay as "textOverlay" 
      FROM stories 
      WHERE id = $1`, 
      [id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Create story error:", error);
    res.status(500).json({ error: "Failed to create story" });
  }
});

router.get("/stories", authenticate, rateLimiters.read, async (req, res) => {
  try {
    const now = Date.now();
    
    // 1. Find and delete expired stories
    try {
      const expiredResult = await db.query(
        `SELECT id, media_url FROM stories WHERE CAST(expires_at AS BIGINT) <= $1`,
        [now]
      );
      if (expiredResult.rows.length > 0) {
        // Delete from DB
        const ids = expiredResult.rows.map((r: any) => `'${r.id}'`).join(',');
        await db.execute(`DELETE FROM stories WHERE id IN (${ids})`);
        
        // Delete from B2 in background
        expiredResult.rows.forEach((r: any) => {
          if (r.media_url) deleteB2File(r.media_url);
        });
      }
    } catch (err) {
      console.error("Failed to clean up expired stories:", err);
    }

    // 2. Fetch active stories
    const result = await db.query(
      `SELECT 
        id, 
        author_id as "authorId", 
        media_url as "mediaUrl", 
        kind, 
        created_at as "createdAt", 
        expires_at as "expiresAt", 
        text_overlay as "textOverlay" 
      FROM stories 
      WHERE CAST(expires_at AS BIGINT) > $1 
      ORDER BY CAST(created_at AS BIGINT) ASC`,
      [now]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error("Get stories error:", error);
    res.status(500).json({ error: "Failed to fetch stories" });
  }
});

router.delete("/stories/:id", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    // Get story before deleting so we can delete from B2
    const storyRes = await db.query(
      "SELECT media_url FROM stories WHERE id = $1 AND author_id = $2", 
      [id, userId]
    );

    const result = await db.execute(
      "DELETE FROM stories WHERE id = $1 AND author_id = $2",
      [id, userId]
    );

    // Support both PostgreSQL (rowCount) and SQLite (changes)
    const affected = (result as any).rowCount ?? (result as any).changes ?? 0;
    if (affected === 0) {
      res.status(404).json({ error: "Story not found or unauthorized" });
      return;
    }

    // Delete from B2
    if (storyRes.rows[0]?.media_url) {
      deleteB2File(storyRes.rows[0].media_url);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Delete story error:", error);
    res.status(500).json({ error: "Failed to delete story" });
  }
});

export default router;
