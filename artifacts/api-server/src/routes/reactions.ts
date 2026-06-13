import { Router } from "express";
import { randomUUID } from "crypto";
import db from "../lib/db";
import { postCoupleActivity, profileDisplayName } from "../lib/activity-feed";
import { broadcast } from "../lib/sse";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";

// Helper to normalize Express params (can be string or string[])
function getParam(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

const router = Router();

// Add reaction to a message
router.post("/reactions", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).user.id;
    const { messageId, userId, emoji } = req.body;

    if (!messageId || !userId || !emoji) {
      res.status(400).json({ error: "messageId, userId, and emoji required" });
      return;
    }

    // Ensure user can only react as themselves
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only react as yourself" });
      return;
    }

    // Check if user already reacted with this emoji
    const existing = await db.execute(
      "SELECT * FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3",
      [messageId, userId, emoji]
    );

    if (existing.rows.length > 0) {
      // Remove the reaction (toggle off)
      await db.execute(
        "DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3",
        [messageId, userId, emoji]
      );
    } else {
      // One reaction per user — replace any previous emoji on this message
      await db.execute(
        "DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2",
        [messageId, userId]
      );
      const id = randomUUID();
      const timestamp = new Date().toISOString();
      await db.execute(
        "INSERT INTO message_reactions (id, message_id, user_id, emoji, timestamp) VALUES ($1, $2, $3, $4, $5)",
        [id, messageId, userId, emoji, timestamp]
      );
      const msgRow = await db.execute("SELECT sender_id FROM messages WHERE id = $1", [messageId]);
      const messageSenderId = (msgRow.rows[0] as { sender_id?: string } | undefined)?.sender_id;
      if (messageSenderId && messageSenderId !== userId) {
        const fromName = await profileDisplayName(userId);
        await postCoupleActivity("reaction", userId, fromName, `reacted with ${emoji}`, `/chat?highlight=${messageId}`).catch(() => {});
      }
    }

    // Get all reactions for this message
    const reactionsResult = await db.execute(
      "SELECT emoji, user_id FROM message_reactions WHERE message_id = $1",
      [messageId]
    );

    const reactions = reactionsResult.rows.map((row: any) => ({
      emoji: row.emoji,
      userId: row.user_id,
    }));

    broadcast("message-reaction", { messageId, reactions, byUserId: userId });
    res.json({ success: true, reactions });
  } catch (err) {
    console.error("Failed to add reaction:", err);
    res.status(500).json({ error: "Failed to add reaction" });
  }
});

// Get reactions for a message
router.get("/reactions/:messageId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const normalizedMessageId = getParam(messageId);

    const result = await db.execute(
      "SELECT emoji, user_id FROM message_reactions WHERE message_id = $1",
      [normalizedMessageId]
    );

    const reactions = result.rows.map((row: any) => ({
      emoji: row.emoji,
      userId: row.user_id,
    }));

    res.json(reactions);
  } catch (err) {
    console.error("Failed to get reactions:", err);
    res.status(500).json({ error: "Failed to get reactions" });
  }
});

// Delete reaction
router.delete("/reactions", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).user.id;
    const { messageId, userId, emoji } = req.body;

    if (!messageId || !userId || !emoji) {
      res.status(400).json({ error: "messageId, userId, and emoji required" });
      return;
    }

    // Ensure user can only delete their own reactions
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only delete your own reactions" });
      return;
    }

    await db.execute(
      "DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3",
      [messageId, userId, emoji]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to delete reaction:", err);
    res.status(500).json({ error: "Failed to delete reaction" });
  }
});

export default router;
