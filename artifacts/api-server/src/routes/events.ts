import { Router } from "express";
import { addClient, removeClient } from "../lib/sse";

const router = Router();

router.get("/sse", (req, res) => {
  // Serverless: long-lived SSE is not supported — client falls back to polling.
  if (process.env.VERCEL) {
    res.status(200).json({ mode: "poll", pollIntervalMs: 1_000 });
    return;
  }

  const q = req.query.userId;
  const fromQuery = typeof q === "string" ? q : Array.isArray(q) ? q[0] : undefined;
  const userId = fromQuery === "wife" || fromQuery === "me" ? fromQuery : "anon";
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  const clientId = `${userId}-${Date.now()}`;

  addClient(clientId, res, userId);

  // Keep-alive heartbeat
  const hb = setInterval(() => {
    try { res.write(": ping\n\n"); } catch { clearInterval(hb); }
  }, 20000);

  req.on("close", () => {
    clearInterval(hb);
    removeClient(clientId);
  });

  res.write("event: connected\ndata: {}\n\n");
});

export default router;
