import { randomUUID } from "crypto";
import { Router } from "express";
import db from "../lib/db";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";
import { postCoupleActivity, profileDisplayName } from "../lib/activity-feed";

const router = Router();

const NOTE_TTL_MS = 24 * 60 * 60 * 1000;

async function purgeExpiredNotes(): Promise<void> {
  const now = Date.now();
  await db.execute("DELETE FROM avatar_notes WHERE CAST(expires_at AS BIGINT) <= $1", [now]);
}

router.get("/notes", authenticate, rateLimiters.read, async (_req, res) => {
  try {
    await purgeExpiredNotes();
    const now = Date.now();
    const result = await db.query(
      `SELECT
        id,
        user_id as "userId",
        text,
        created_at as "createdAt",
        expires_at as "expiresAt"
      FROM avatar_notes
      WHERE CAST(expires_at AS BIGINT) > $1`,
      [now],
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get avatar notes error:", error);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

router.post("/notes", authenticate, rateLimiters.messages, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const text = String(req.body.text ?? "").trim();
    if (!text) {
      res.status(400).json({ error: "Note text is required" });
      return;
    }
    if (text.length > 60) {
      res.status(400).json({ error: "Note must be 60 characters or less" });
      return;
    }

    const now = Date.now();
    const id = randomUUID();
    const createdAt = now.toString();
    const expiresAt = (now + NOTE_TTL_MS).toString();

    await db.execute("DELETE FROM avatar_notes WHERE user_id = $1", [userId]);
    await db.execute(
      "INSERT INTO avatar_notes (id, user_id, text, created_at, expires_at) VALUES ($1, $2, $3, $4, $5)",
      [id, userId, text, createdAt, expiresAt],
    );

    const displayName = await profileDisplayName(userId);
    await postCoupleActivity("note", userId, displayName, `shared a note: "${text}"`, `/?noteUserId=${userId}`).catch(() => {});

    const result = await db.query(
      `SELECT
        id,
        user_id as "userId",
        text,
        created_at as "createdAt",
        expires_at as "expiresAt"
      FROM avatar_notes
      WHERE id = $1`,
      [id],
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Create avatar note error:", error);
    res.status(500).json({ error: "Failed to share note" });
  }
});

router.delete("/notes/:id", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const existing = await db.query(
      "SELECT id FROM avatar_notes WHERE id = $1 AND user_id = $2",
      [id, userId],
    );
    if (!existing.rows[0]) {
      res.status(404).json({ error: "Note not found or unauthorized" });
      return;
    }

    await db.execute("DELETE FROM avatar_notes WHERE id = $1 AND user_id = $2", [id, userId]);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete avatar note error:", error);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

export default router;
