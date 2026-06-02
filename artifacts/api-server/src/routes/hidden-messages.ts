import { Router } from "express";
import db from "../lib/db";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";
import { getChatClearedAtForUser, setChatClearedForUser } from "../lib/chat-clear";
import { broadcast } from "../lib/sse";

const router = Router();

/** Clear chat for the authenticated user only — partner keeps all messages. */
router.post("/hidden-messages/clear-chat", rateLimiters.messages, authenticate, async (req, res) => {
  const authId = (req as { user?: { id: string } }).user!.id;
  const clearedAt = new Date().toISOString();
  try {
    await setChatClearedForUser(authId, clearedAt);
    res.json({ success: true, clearedAt });
  } catch (err) {
    console.error("clear-chat failed:", err);
    res.status(500).json({ error: "Failed to clear chat" });
  }
});

router.get("/hidden-messages/:userId", rateLimiters.read, authenticate, async (req, res) => {
  const authId = (req as { user?: { id: string } }).user!.id;
  const userId = String(req.params.userId);
  if (userId !== authId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const result = await db.execute(
      "SELECT message_id FROM hidden_messages WHERE user_id = $1",
      [userId],
    );
    const clearedAt = await getChatClearedAtForUser(userId);
    res.json({
      messageIds: result.rows.map((r: Record<string, unknown>) => String(r.message_id)),
      clearedAt,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch hidden messages" });
  }
});

router.post("/hidden-messages", rateLimiters.messages, authenticate, async (req, res) => {
  const authId = (req as { user?: { id: string } }).user!.id;
  const { userId, messageId } = req.body as { userId?: string; messageId?: string };
  if (!userId || !messageId || userId !== authId) {
    res.status(400).json({ error: "userId and messageId required" });
    return;
  }
  try {
    await db.execute(
      "INSERT INTO hidden_messages (user_id, message_id, hidden_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
      [userId, messageId, new Date().toISOString()],
    );
    // Only the user who hid it — never broadcast global message-deleted
    broadcast("message-hidden", { userId, messageId }, userId);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to hide message" });
  }
});

export default router;
