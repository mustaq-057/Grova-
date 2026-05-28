import { Router } from "express";
import { addClient, removeClient } from "../lib/sse";

const router = Router();

router.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const userId = (req.query["userId"] as string) || "anon";
  const clientId = `${userId}-${Date.now()}`;

  addClient(clientId, res);

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
