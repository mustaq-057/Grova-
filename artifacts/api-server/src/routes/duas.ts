import { Router } from "express";
import { randomUUID } from "crypto";
import db from "../lib/db";
import { broadcast } from "../lib/sse";
import { postCoupleActivity, profileDisplayName } from "../lib/activity-feed";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";

interface Dua {
  id: string;
  arabic: string;
  translation: string;
  author: string;
  timestamp: string;
}

const router = Router();

router.get("/duas", rateLimiters.read, authenticate, async (_req, res) => {
  try {
    const result = await db.execute("SELECT * FROM duas ORDER BY timestamp DESC");
    const duas = result.rows.map((row: any) => ({
      id: row.id,
      arabic: row.arabic,
      translation: row.translation,
      author: row.author,
      timestamp: row.timestamp,
    }));
    res.json(duas);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch duas" });
  }
});

router.post("/duas", rateLimiters.messages, authenticate, async (req, res) => {
  const { arabic, translation, author } = req.body as {
    arabic: string;
    translation?: string;
    author: string;
  };
  if (!arabic || !author) {
    res.status(400).json({ error: "arabic and author required" });
    return;
  }

  const id = randomUUID();
  const timestamp = new Date().toISOString();

  try {
    await db.execute(
      "INSERT INTO duas (id, arabic, translation, author, timestamp) VALUES ($1, $2, $3, $4, $5)",
      [id, arabic, translation || "", author, timestamp]
    );

    const dua: Dua = {
      id,
      arabic,
      translation: translation || "",
      author,
      timestamp,
    };
    
    // Broadcast new dua to all clients
    broadcast("dua-added", dua);
    await postCoupleActivity("dua", author, await profileDisplayName(author), "added a new dua").catch(() => {});

    res.json(dua);
  } catch (err) {
    res.status(500).json({ error: "Failed to create dua" });
  }
});

router.delete("/duas/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const authenticatedUserId = (req as { user?: { id: string } }).user?.id;
  const id = String(req.params.id);

  try {
    const existing = await db.execute("SELECT author FROM duas WHERE id = $1", [id]);
    const row = existing.rows[0] as { author?: string } | undefined;
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (row.author !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only delete your own duas" });
      return;
    }

    await db.execute("DELETE FROM duas WHERE id = $1", [id]);
    broadcast("dua-deleted", { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete dua" });
  }
});

export default router;
