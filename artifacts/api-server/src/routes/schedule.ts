import { Router } from "express";
import { randomUUID } from "crypto";
import db from "../lib/db";
import { encryptStoredField, decryptStoredField } from "../lib/message-storage";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";

// Helper to normalize Express params (can be string or string[])
function getParam(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

const router = Router();

// Schedule a message
router.post("/schedule", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).user.id;
    const { senderId, text, type, audioData, gifUrl, imageData, variant, companionSticker, scheduledAt } = req.body;

    if (!senderId || !type || !scheduledAt) {
      res.status(400).json({ error: "senderId, type, and scheduledAt required" });
      return;
    }

    // Ensure user can only schedule messages for themselves
    if (senderId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only schedule messages for yourself" });
      return;
    }

    const id = randomUUID();
    const createdAt = new Date().toISOString();

    await db.execute(
      `INSERT INTO scheduled_messages (id, sender_id, text, type, audio_data, gif_url, image_data, variant, companion_sticker, scheduled_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [id, senderId, encryptStoredField(text), type, encryptStoredField(audioData), gifUrl || null, encryptStoredField(imageData), variant || null, companionSticker || null, scheduledAt, createdAt]
    );

    res.json({ success: true, id, scheduledAt });
  } catch (err) {
    console.error("Failed to schedule message:", err);
    res.status(500).json({ error: "Failed to schedule message" });
  }
});

// Get scheduled messages for a user
router.get("/schedule/:userId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).user.id;
    const { userId } = req.params;
    const normalizedUserId = getParam(userId);

    // Ensure user can only read their own scheduled messages
    if (normalizedUserId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only read your own scheduled messages" });
      return;
    }

    const result = await db.execute(
      "SELECT * FROM scheduled_messages WHERE sender_id = $1 AND sent = 0 ORDER BY scheduled_at ASC",
      [normalizedUserId]
    );

    const scheduledMessages = result.rows.map((row: any) => ({
      id: row.id,
      senderId: row.sender_id,
      text: decryptStoredField(row.text),
      type: row.type,
      audioData: decryptStoredField(row.audio_data),
      gifUrl: row.gif_url,
      imageData: decryptStoredField(row.image_data),
      variant: row.variant,
      companionSticker: row.companion_sticker,
      scheduledAt: row.scheduled_at,
      createdAt: row.created_at,
    }));

    res.json(scheduledMessages);
  } catch (err) {
    console.error("Failed to get scheduled messages:", err);
    res.status(500).json({ error: "Failed to get scheduled messages" });
  }
});

// Delete a scheduled message
router.delete("/schedule/:id", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = (req as { user?: { id: string } }).user!.id;
    const normalizedId = getParam(req.params.id);

    const existing = await db.execute(
      "SELECT sender_id FROM scheduled_messages WHERE id = $1",
      [normalizedId],
    );
    const row = existing.rows[0] as { sender_id?: string } | undefined;
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (row.sender_id !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await db.execute("DELETE FROM scheduled_messages WHERE id = $1", [normalizedId]);

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to delete scheduled message:", err);
    res.status(500).json({ error: "Failed to delete scheduled message" });
  }
});

export default router;
