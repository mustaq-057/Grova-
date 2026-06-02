import { Router } from "express";
import speakeasy from "speakeasy";
import db from "../lib/db";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";

// Helper to normalize Express params (can be string or string[])
function getParam(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

const router = Router();

// Generate 2FA secret for a user
router.post("/2fa/setup", rateLimiters.auth, authenticate, async (req, res) => {
  try {
    const { userId } = req.body;
    const authenticatedUserId = (req as any).user.id;

    // Ensure user can only setup 2FA for themselves
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only setup 2FA for yourself" });
      return;
    }

    if (!userId) {
      res.status(400).json({ error: "userId required" });
      return;
    }

    const secret = speakeasy.generateSecret({
      name: `Grova (${userId})`,
      issuer: "Grova",
    });

    // Store the secret (not enabled yet)
    await db.execute(
      "INSERT INTO two_factor_auth (user_id, secret, enabled) VALUES ($1, $2, 0) ON CONFLICT (user_id) DO UPDATE SET secret = $2",
      [userId, secret.base32]
    );

    res.json({
      secret: secret.base32,
      qrCode: secret.otpauth_url,
    });
  } catch (err) {
    console.error("Failed to setup 2FA:", err);
    res.status(500).json({ error: "Failed to setup 2FA" });
  }
});

// Enable 2FA after verification
router.post("/2fa/enable", rateLimiters.auth, authenticate, async (req, res) => {
  try {
    const { userId, token } = req.body;
    const authenticatedUserId = (req as any).user.id;

    // Ensure user can only enable 2FA for themselves
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only enable 2FA for yourself" });
      return;
    }

    if (!userId || !token) {
      res.status(400).json({ error: "userId and token required" });
      return;
    }

    // Get the secret
    const result = await db.execute(
      "SELECT secret FROM two_factor_auth WHERE user_id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "2FA not setup for this user" });
      return;
    }

    const secret = String(result.rows[0].secret);

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
    });

    if (!verified) {
      res.status(400).json({ error: "Invalid token" });
      return;
    }

    // Enable 2FA
    await db.execute(
      "UPDATE two_factor_auth SET enabled = 1 WHERE user_id = $1",
      [userId]
    );

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      speakeasy.generateSecret({ length: 20 }).base32.substring(0, 8)
    );

    await db.execute(
      "UPDATE two_factor_auth SET backup_codes = $1 WHERE user_id = $2",
      [JSON.stringify(backupCodes), userId]
    );

    res.json({ success: true, backupCodes });
  } catch (err) {
    console.error("Failed to enable 2FA:", err);
    res.status(500).json({ error: "Failed to enable 2FA" });
  }
});

// Verify 2FA token during login
router.post("/2fa/verify", async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      res.status(400).json({ error: "userId and token required" });
      return;
    }

    // Get the secret
    const result = await db.execute(
      "SELECT secret, enabled, backup_codes FROM two_factor_auth WHERE user_id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "2FA not setup for this user" });
      return;
    }

    const row = result.rows[0];
    const secret = String(row.secret);
    const enabled = row.enabled === 1;
    const backupCodes = row.backup_codes ? JSON.parse(String(row.backup_codes)) : [];

    if (!enabled) {
      res.status(400).json({ error: "2FA not enabled for this user" });
      return;
    }

    // Check if token is a backup code
    if (backupCodes.includes(token)) {
      // Remove used backup code
      const remainingCodes = backupCodes.filter((code: string) => code !== token);
      await db.execute(
        "UPDATE two_factor_auth SET backup_codes = $1 WHERE user_id = $2",
        [JSON.stringify(remainingCodes), userId]
      );
      res.json({ success: true, backupCodeUsed: true });
      return;
    }

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 2, // Allow 2 time steps (1 minute) for clock drift
    });

    if (!verified) {
      res.status(400).json({ error: "Invalid token" });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to verify 2FA:", err);
    res.status(500).json({ error: "Failed to verify 2FA" });
  }
});

// Disable 2FA
router.post("/2fa/disable", rateLimiters.auth, authenticate, async (req, res) => {
  try {
    const { userId, token } = req.body;
    const authenticatedUserId = (req as any).user.id;

    // Ensure user can only disable 2FA for themselves
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only disable 2FA for yourself" });
      return;
    }

    if (!userId || !token) {
      res.status(400).json({ error: "userId and token required" });
      return;
    }

    // Get the secret
    const result = await db.execute(
      "SELECT secret FROM two_factor_auth WHERE user_id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "2FA not setup for this user" });
      return;
    }

    const secret = String(result.rows[0].secret);

    // Verify the token before disabling
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
    });

    if (!verified) {
      res.status(400).json({ error: "Invalid token" });
      return;
    }

    // Disable 2FA
    await db.execute(
      "UPDATE two_factor_auth SET enabled = 0 WHERE user_id = $1",
      [userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to disable 2FA:", err);
    res.status(500).json({ error: "Failed to disable 2FA" });
  }
});

// Check 2FA status for a user
router.get("/2fa/status/:userId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const normalizedUserId = getParam(userId);
    const authenticatedUserId = (req as any).user.id;

    // Ensure user can only check their own 2FA status
    if (normalizedUserId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only check your own 2FA status" });
      return;
    }

    const result = await db.execute(
      "SELECT enabled FROM two_factor_auth WHERE user_id = $1",
      [normalizedUserId]
    );

    if (result.rows.length === 0) {
      res.json({ enabled: false });
      return;
    }

    res.json({ enabled: result.rows[0].enabled === 1 });
  } catch (err) {
    console.error("Failed to get 2FA status:", err);
    res.status(500).json({ error: "Failed to get 2FA status" });
  }
});

export default router;
