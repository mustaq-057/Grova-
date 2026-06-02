import { Router } from "express";
import { randomUUID } from "crypto";
import db from "../lib/db";
import { broadcast } from "../lib/sse";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";

interface Milestone {
  id: string;
  title: string;
  date: string;
  description?: string;
  type: "anniversary" | "first_date" | "special_moment" | "achievement" | "travel" | "memory";
  author: string;
  timestamp: string;
}

const router = Router();

router.get("/milestones", rateLimiters.read, authenticate, async (_req, res) => {
  try {
    const result = await db.execute("SELECT * FROM relationship_milestones ORDER BY date DESC");
    const milestones = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      date: row.date,
      description: row.description,
      type: row.type,
      author: row.author,
      timestamp: row.timestamp,
    }));
    res.json(milestones);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch milestones" });
  }
});

router.post("/milestones", rateLimiters.messages, authenticate, async (req, res) => {
  const { title, date, description, type, author } = req.body as {
    title: string;
    date: string;
    description?: string;
    type: "anniversary" | "first_date" | "special_moment" | "achievement" | "travel" | "memory";
    author: string;
  };
  if (!title || !date || !type || !author) {
    res.status(400).json({ error: "title, date, type, and author required" });
    return;
  }

  const id = randomUUID();
  const timestamp = new Date().toISOString();

  try {
    await db.execute(
      "INSERT INTO relationship_milestones (id, title, date, description, type, author, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [id, title, date, description || null, type, author, timestamp]
    );

    const milestone: Milestone = {
      id,
      title,
      date,
      description,
      type,
      author,
      timestamp,
    };
    
    // Broadcast new milestone to all clients
    broadcast("milestone-added", milestone);

    res.json(milestone);
  } catch (err) {
    res.status(500).json({ error: "Failed to create milestone" });
  }
});

router.delete("/milestones/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute("DELETE FROM relationship_milestones WHERE id = $1", [id]);
    
    // Broadcast milestone deletion to all clients
    broadcast("milestone-deleted", { id });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete milestone" });
  }
});

export default router;
