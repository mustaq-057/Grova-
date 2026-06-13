import { Router } from "express";
import { randomUUID } from "crypto";
import db from "../lib/db";
import { broadcast } from "../lib/sse";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";
import { postCoupleActivity, profileDisplayName } from "../lib/activity-feed";

interface Event {
  id: string;
  title: string;
  date: string;
  time?: string;
  description?: string;
  type: "date" | "anniversary" | "reminder";
  author: string;
  timestamp: string;
}

const router = Router();

router.get("/calendar/events", rateLimiters.read, authenticate, async (_req, res) => {
  try {
    const result = await db.execute("SELECT * FROM calendar_events ORDER BY date ASC");
    const events = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      date: row.date,
      time: row.time,
      description: row.description,
      type: row.type,
      author: row.author,
      timestamp: row.timestamp,
    }));
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

router.post("/calendar/events", rateLimiters.messages, authenticate, async (req, res) => {
  const { title, date, time, description, type, author } = req.body as {
    title: string;
    date: string;
    time?: string;
    description?: string;
    type: "date" | "anniversary" | "reminder";
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
      "INSERT INTO calendar_events (id, title, date, time, description, type, author, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [id, title, date, time || null, description || null, type, author, timestamp]
    );

    const event: Event = {
      id,
      title,
      date,
      time,
      description,
      type,
      author,
      timestamp,
    };
    
    // Broadcast new event to all clients
    broadcast("event-added", event);

    const fromName = await profileDisplayName(author);
    void postCoupleActivity(
      "calendar",
      author,
      fromName,
      `added a new event in calendar: ${title.trim()}`,
      `/calendar?event=${id}`,
    ).catch(() => {});

    res.json(event);
  } catch (err) {
    res.status(500).json({ error: "Failed to create event" });
  }
});

router.put("/calendar/events/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const { id } = req.params;
  const { title, date, time, description, type } = req.body as {
    title?: string;
    date?: string;
    time?: string;
    description?: string;
    type?: "date" | "anniversary" | "reminder";
  };

  try {
    const updateParts: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updateParts.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (date !== undefined) {
      updateParts.push(`date = $${paramIndex++}`);
      values.push(date);
    }
    if (time !== undefined) {
      updateParts.push(`time = $${paramIndex++}`);
      values.push(time);
    }
    if (description !== undefined) {
      updateParts.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (type !== undefined) {
      updateParts.push(`type = $${paramIndex++}`);
      values.push(type);
    }

    if (updateParts.length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    values.push(id);
    await db.execute(
      `UPDATE calendar_events SET ${updateParts.join(", ")} WHERE id = $${paramIndex}`,
      values
    );

    // Fetch updated event
    const result = await db.execute("SELECT * FROM calendar_events WHERE id = $1", [id]);
    const event = result.rows[0];
    
    // Broadcast event update to all clients
    broadcast("event-updated", event);

    res.json({
      id: event.id,
      title: event.title,
      date: event.date,
      time: event.time,
      description: event.description,
      type: event.type,
      author: event.author,
      timestamp: event.timestamp,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update event" });
  }
});

router.delete("/calendar/events/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute("DELETE FROM calendar_events WHERE id = $1", [id]);
    
    // Broadcast event deletion to all clients
    broadcast("event-deleted", { id });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete event" });
  }
});

export default router;
