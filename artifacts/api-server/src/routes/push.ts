import { Router } from "express";
import { z } from "zod";
import db from "../lib/db";
import { authenticate } from "../lib/auth-middleware";
import { logger } from "../lib/logger";

const router = Router();

router.post("/push/fcm-token", authenticate, async (req, res) => {
  const schema = z.object({
    token: z.string().min(1),
  });

  try {
    const { token } = schema.parse(req.body);
    const userId = req.user!.id;

    await db.execute(
      `INSERT INTO fcm_tokens (user_id, token) 
       VALUES ($1, $2)
       ON CONFLICT (user_id) 
       DO UPDATE SET token = EXCLUDED.token, created_at = CURRENT_TIMESTAMP`,
      [userId, token]
    );

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Failed to register FCM token");
    res.status(400).json({ error: "Invalid request payload" });
  }
});

export default router;
