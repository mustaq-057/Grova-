import { Router } from "express";
import db from "../lib/db";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";

const router = Router();

router.post("/stories", authenticate, rateLimiters.messages, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { media_url, kind = "story", text_overlay } = req.body;

    if (!media_url) {
      res.status(400).json({ error: "media_url is required" });
      return;
    }

    const id = crypto.randomUUID();
    const created_at = Date.now().toString();
    const expires_at = (Date.now() + 24 * 60 * 60 * 1000).toString(); // 24 hours from now

    await db.execute(
      "INSERT INTO stories (id, author_id, media_url, kind, created_at, expires_at, text_overlay) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [id, userId, media_url, kind, created_at, expires_at, text_overlay || null]
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

    const result = await db.execute(
      "DELETE FROM stories WHERE id = $1 AND author_id = $2",
      [id, userId]
    );

    if (result.changes === 0) {
      res.status(404).json({ error: "Story not found or unauthorized" });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Delete story error:", error);
    res.status(500).json({ error: "Failed to delete story" });
  }
});

export default router;
