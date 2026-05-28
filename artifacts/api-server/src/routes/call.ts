import { Router } from "express";
import { broadcast } from "../lib/sse";

const router = Router();

router.post("/call/signal", (req, res) => {
  const { type, senderId, ...rest } = req.body as {
    type: "offer" | "answer" | "ice" | "end" | "reject";
    senderId: string;
    [k: string]: unknown;
  };

  broadcast(`call-${type}`, { from: senderId, ...rest });
  res.json({ ok: true });
});

export default router;
