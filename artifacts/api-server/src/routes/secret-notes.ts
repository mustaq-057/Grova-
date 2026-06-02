import { Router } from "express";
import { randomUUID } from "crypto";
import db from "../lib/db";
import { broadcast } from "../lib/sse";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";

interface SecretNote {
  id: string;
  content: string;
  author: string;
  timestamp: string;
}

const router = Router();

router.get("/secret-notes", rateLimiters.read, authenticate, async (_req, res) => {
  try {
    const result = await db.execute("SELECT * FROM secret_notes ORDER BY timestamp DESC");
    const notes = result.rows.map((row: any) => ({
      id: row.id,
      content: row.content,
      author: row.author,
      timestamp: row.timestamp,
    }));
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch secret notes" });
  }
});

router.post("/secret-notes", rateLimiters.messages, authenticate, async (req, res) => {
  const authId = (req as { user?: { id: string } }).user!.id;
  const { content } = req.body as { content?: string; author?: string };
  if (!content?.trim()) {
    res.status(400).json({ error: "content required" });
    return;
  }

  const id = randomUUID();
  const timestamp = new Date().toISOString();
  const author = authId;

  try {
    await db.execute(
      "INSERT INTO secret_notes (id, content, author, timestamp) VALUES ($1, $2, $3, $4)",
      [id, content.trim(), author, timestamp]
    );

    const note: SecretNote = {
      id,
      content,
      author,
      timestamp,
    };
    
    // Broadcast new secret note to all clients
    broadcast("secret-note-added", note);

    res.json(note);
  } catch (err) {
    res.status(500).json({ error: "Failed to create secret note" });
  }
});

router.delete("/secret-notes/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const authId = (req as { user?: { id: string } }).user!.id;
  const id = String(req.params.id);

  try {
    const existing = await db.execute("SELECT author FROM secret_notes WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (String((existing.rows[0] as { author: string }).author) !== authId) {
      res.status(403).json({ error: "Only the creator can delete this note" });
      return;
    }
    await db.execute("DELETE FROM secret_notes WHERE id = $1", [id]);
    
    // Broadcast secret note deletion to all clients
    broadcast("secret-note-deleted", { id });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete secret note" });
  }
});

export default router;
