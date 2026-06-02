import { Router } from "express";
import { randomUUID } from "crypto";
import db from "../lib/db";
import { encryptStoredField } from "../lib/message-storage";
import { broadcast } from "../lib/sse";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";

// Helper to normalize Express params (can be string or string[])
function getParam(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

const router = Router();

// Edit a message
router.patch("/messages/:id/edit", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).user.id;
    const { id } = req.params;
    const messageId = getParam(id);
    const { text, userId } = req.body;

    if (!text || !userId) {
      res.status(400).json({ error: "text and userId required" });
      return;
    }

    // Ensure user can only edit their own messages
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only edit your own messages" });
      return;
    }

    // Get the current message
    const currentMsg = await db.execute(
      "SELECT * FROM messages WHERE id = $1",
      [messageId]
    );

    if (currentMsg.rows.length === 0) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    const msg = currentMsg.rows[0];

    // Check if user owns the message
    if (msg.sender_id !== userId) {
      res.status(403).json({ error: "You can only edit your own messages" });
      return;
    }

    const ageMs = Date.now() - new Date(String(msg.timestamp)).getTime();
    if (ageMs > 60 * 60 * 1000) {
      res.status(400).json({ error: "Messages can only be edited within 1 hour" });
      return;
    }

    const editId = randomUUID();
    const editedAt = new Date().toISOString();
    await db.execute(
      "INSERT INTO message_edits (id, message_id, old_text, new_text, edited_at) VALUES ($1, $2, $3, $4, $5)",
      [editId, messageId, msg.text, text, editedAt],
    );

    await db.execute("UPDATE messages SET text = $1 WHERE id = $2", [
      encryptStoredField(text),
      messageId,
    ]);

    // Broadcast the edit
    broadcast("message-edited", { messageId, newText: text, editedAt });

    res.json({ success: true, text, editedAt });
  } catch (err) {
    console.error("Failed to edit message:", err);
    res.status(500).json({ error: "Failed to edit message" });
  }
});

// Get edit history for a message
router.get("/messages/:id/edits", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const messageId = getParam(id);

    const result = await db.execute(
      "SELECT * FROM message_edits WHERE message_id = $1 ORDER BY edited_at ASC",
      [messageId]
    );

    const edits = result.rows.map((row: any) => ({
      id: row.id,
      oldText: row.old_text,
      newText: row.new_text,
      editedAt: row.edited_at,
    }));

    res.json(edits);
  } catch (err) {
    console.error("Failed to get edit history:", err);
    res.status(500).json({ error: "Failed to get edit history" });
  }
});

export default router;
