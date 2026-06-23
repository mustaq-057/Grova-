import { Router } from "express";
import db from "../lib/db";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";

const router = Router();

router.post("/stories", authenticate, rateLimiters.messages, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { media_url, kind = "story" } = req.body;

    if (!media_url) {
      res.status(400).json({ error: "media_url is required" });
      return;
    }

    const id = crypto.randomUUID();
    const created_at = Date.now().toString();
    const expires_at = (Date.now() + 24 * 60 * 60 * 1000).toString(); // 24 hours from now

    await db.execute(
      "INSERT INTO stories (id, author_id, media_url, kind, created_at, expires_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, userId, media_url, kind, created_at, expires_at]
    );

    const result = await db.query("SELECT * FROM stories WHERE id = $1", [id]);
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
      "SELECT * FROM stories WHERE CAST(expires_at AS BIGINT) > $1 ORDER BY CAST(created_at AS BIGINT) ASC",
      [now]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error("Get stories error:", error);
    res.status(500).json({ error: "Failed to fetch stories" });
  }
});

export default router;
