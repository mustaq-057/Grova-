import { Router } from "express";
import { randomUUID } from "crypto";

interface Message {
  id: string;
  senderId: string;
  text?: string;
  type: "text" | "audio" | "heart";
  audioData?: string;
  timestamp: string;
  liked: boolean;
}


const router = Router();

router.get("/messages", (req, res) => {
  const since = req.query["since"] as string | undefined;
  if (since) {
    const filtered = messages.filter((m) => m.timestamp > since);
    res.json(filtered);
    return;
  }
  res.json(messages);
});

router.post("/messages", (req, res) => {
  const { senderId, text, type, audioData } = req.body as {
    senderId: string;
    text?: string;
    type?: string;
    audioData?: string;
  };
  const msg: Message = {
    id: randomUUID(),
    senderId,
    text,
    type: (type as Message["type"]) || "text",
    audioData,
    timestamp: new Date().toISOString(),
    liked: false,
  };
  messages.push(msg);
  res.json(msg);
});

router.patch("/messages/:id/like", (req, res) => {
  const msg = messages.find((m) => m.id === req.params["id"]);
  if (!msg) { res.status(404).json({ error: "Not found" }); return; }
  msg.liked = !msg.liked;
  res.json(msg);
});

router.delete("/messages", (_req, res) => {
  messages.length = 0;
  res.json({ success: true });
});

export default router;
