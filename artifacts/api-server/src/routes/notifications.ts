import { Router } from "express";
import db from "../lib/db";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";

// Helper to normalize Express params (can be string or string[])
function getParam(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

const router = Router();

// Store push notification subscription
router.post("/notifications/subscribe", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).user.id;
    const { subscription, userId } = req.body;

    if (!subscription || !userId) {
      res.status(400).json({ error: "subscription and userId required" });
      return;
    }

    // Ensure user can only manage their own subscriptions
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only manage your own subscriptions" });
      return;
    }

    // Check if subscription already exists for this user
    const existing = await db.execute(
      "SELECT * FROM push_subscriptions WHERE user_id = $1",
      [userId]
    );

    if (existing.rows.length > 0) {
      // Update existing subscription
      await db.execute(
        "UPDATE push_subscriptions SET subscription = $1 WHERE user_id = $2",
        [JSON.stringify(subscription), userId]
      );
    } else {
      // Insert new subscription
      await db.execute(
        "INSERT INTO push_subscriptions (user_id, subscription) VALUES ($1, $2)",
        [userId, JSON.stringify(subscription)]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to save push subscription:", err);
    res.status(500).json({ error: "Failed to save subscription" });
  }
});

// Get push subscription for a user
router.get("/notifications/subscribe/:userId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).user.id;
    const { userId } = req.params;
    const normalizedUserId = getParam(userId);

    // Ensure user can only read their own subscriptions
    if (normalizedUserId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only read your own subscriptions" });
      return;
    }

    const result = await db.execute(
      "SELECT subscription FROM push_subscriptions WHERE user_id = $1",
      [normalizedUserId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Subscription not found" });
      return;
    }

    const subscription = JSON.parse(String(result.rows[0].subscription));
    res.json(subscription);
  } catch (err) {
    console.error("Failed to get push subscription:", err);
    res.status(500).json({ error: "Failed to get subscription" });
  }
});

// Delete push subscription
router.delete("/notifications/subscribe/:userId", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).user.id;
    const { userId } = req.params;
    const normalizedUserId = getParam(userId);

    // Ensure user can only delete their own subscriptions
    if (normalizedUserId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only delete your own subscriptions" });
      return;
    }

    await db.execute(
      "DELETE FROM push_subscriptions WHERE user_id = $1",
      [normalizedUserId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to delete push subscription:", err);
    res.status(500).json({ error: "Failed to delete subscription" });
  }
});

// Store public key for E2E encryption
router.post("/keys/public", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).user.id;
    const { userId, publicKey } = req.body;

    if (!userId || !publicKey) {
      res.status(400).json({ error: "userId and publicKey required" });
      return;
    }

    // Ensure user can only set their own public key
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only set your own public key" });
      return;
    }

    await db.execute(
      "INSERT INTO public_keys (user_id, public_key) VALUES (?, ?) ON CONFLICT (user_id) DO UPDATE SET public_key = excluded.public_key",
      [userId, publicKey]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to save public key:", err);
    res.status(500).json({ error: "Failed to save public key" });
  }
});

// Get public key for a user
router.get("/keys/public/:userId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const normalizedUserId = getParam(userId);

    const result = await db.execute(
      "SELECT public_key FROM public_keys WHERE user_id = ?",
      [normalizedUserId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Public key not found" });
      return;
    }

    res.json({ publicKey: result.rows[0].public_key });
  } catch (err) {
    console.error("Failed to get public key:", err);
    res.status(500).json({ error: "Failed to get public key" });
  }
});

export default router;
