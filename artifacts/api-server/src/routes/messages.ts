import { Router } from "express";
import { randomUUID } from "crypto";
import { broadcast } from "../lib/sse";

export interface Message {
  id: string;
  senderId: string;
  text?: string;
  type: "text" | "audio" | "heart" | "sticker" | "gif" | "image";
  audioData?: string;
  gifUrl?: string;
  imageData?: string;
  timestamp: string;
  liked: boolean;
}

// Start with empty chat — fresh slate
const messages: Message[] = [];

const router = Router();

router.get("/messages", (_req, res) => { res.json(messages); });

router.post("/messages", (req, res) => {
  const { senderId, text, type, audioData, gifUrl, imageData } = req.body as Partial<Message>;
  const msg: Message = {
    id: randomUUID(),
    senderId: senderId ?? "unknown",
    text,
    type: (type as Message["type"]) || "text",
    audioData,
    gifUrl,
    imageData,
    timestamp: new Date().toISOString(),
    liked: false,
  };
  messages.push(msg);
  broadcast("new-message", msg);
  res.json(msg);
});

router.patch("/messages/:id/like", (req, res) => {
  const msg = messages.find((m) => m.id === req.params["id"]);
  if (!msg) { res.status(404).json({ error: "Not found" }); return; }
  msg.liked = !msg.liked;
  broadcast("message-liked", msg);
  res.json(msg);
});

router.delete("/messages", (_req, res) => {
  messages.length = 0;
  broadcast("messages-cleared", {});
  res.json({ success: true });
});

export default router;
