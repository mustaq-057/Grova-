import { Router } from "express";
import { randomUUID } from "crypto";
import db from "../lib/db";
import { broadcast } from "../lib/sse";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";
import { postCoupleActivity, profileDisplayName } from "../lib/activity-feed";

interface Checkin {
  id: string;
  question: string;
  answer: string;
  mood: "happy" | "neutral" | "sad";
  author: string;
  timestamp: string;
}

const router = Router();

router.get("/checkins", rateLimiters.read, authenticate, async (_req, res) => {
  try {
    const result = await db.execute("SELECT * FROM daily_checkins ORDER BY timestamp DESC");
    const checkins = result.rows.map((row: any) => ({
      id: row.id,
      question: row.question,
      answer: row.answer,
      mood: row.mood,
      author: row.author,
      timestamp: row.timestamp,
    }));
    res.json(checkins);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch checkins" });
  }
});

router.post("/checkins", rateLimiters.messages, authenticate, async (req, res) => {
  const { question, answer, mood, author } = req.body as {
    question: string;
    answer: string;
    mood: "happy" | "neutral" | "sad";
    author: string;
  };
  if (!question || !answer || !mood || !author) {
    res.status(400).json({ error: "question, answer, mood, and author required" });
    return;
  }

  const id = randomUUID();
  const timestamp = new Date().toISOString();

  try {
    await db.execute(
      "INSERT INTO daily_checkins (id, question, answer, mood, author, timestamp) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, question, answer, mood, author, timestamp]
    );

    const checkin: Checkin = {
      id,
      question,
      answer,
      mood,
      author,
      timestamp,
    };
    
    // Broadcast new checkin to all clients
    broadcast("checkin-added", checkin);

    const fromName = await profileDisplayName(author);
    void postCoupleActivity(
      "checkin",
      author,
      fromName,
      "responded in check-in",
      `/checkin?highlight=${id}`,
    ).catch(() => {});

    res.json(checkin);
  } catch (err) {
    res.status(500).json({ error: "Failed to create checkin" });
  }
});

router.delete("/checkins/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute("DELETE FROM daily_checkins WHERE id = $1", [id]);
    
    // Broadcast checkin deletion to all clients
    broadcast("checkin-deleted", { id });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete checkin" });
  }
});

export default router;
