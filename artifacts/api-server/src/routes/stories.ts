import { Router } from "express";
import db from "../lib/db";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";
import { deleteImage } from "../lib/storage";

const router = Router();

function extractCloudinaryKey(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/grova\/([^/?]+)/);
  if (match) return match[1];
  return null;
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

    if (media_url.startsWith("data:")) {
      res.status(400).json({ error: "To protect database storage, stories must be uploaded to Cloudinary instead of storing raw base64 data." });
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
        
        // Delete from Cloudinary in background
        expiredResult.rows.forEach((r: any) => {
          if (r.media_url) {
            const key = extractCloudinaryKey(r.media_url);
            if (key) deleteImage(key);
          }
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

    // Delete from Cloudinary
    if (storyRes.rows[0]?.media_url) {
      const key = extractCloudinaryKey(storyRes.rows[0].media_url);
      if (key) deleteImage(key);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Delete story error:", error);
    res.status(500).json({ error: "Failed to delete story" });
  }
});

export default router;
