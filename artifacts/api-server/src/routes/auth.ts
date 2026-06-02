import { Router } from "express";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import db from "../lib/db";
import {
  createSession,
  destroySession,
  authenticate,
  refreshSession,
  getUserDevices,
  revokeDevice,
  validateSession,
} from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";
import { validators, validateBody } from "../lib/validation";
import { persistAvatarIfNeeded, sanitizeAvatarForClient } from "../lib/avatar-url";

const router = Router();
const PRIMARY_SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const PRIMARY_SESSION_RENEW_MS = 30 * 24 * 60 * 60 * 1000;
const PRIMARY_MAX_FAILED_ATTEMPTS = 2;
const PRIMARY_BLOCK_MS = 30 * 60 * 1000;
const primaryLoginAttempts = new Map<string, { count: number; blockedUntil: number }>();
const CODE_MAX_FAILED_ATTEMPTS = 10;
const CODE_BLOCK_MS = 30 * 60 * 1000;
const coupleCodeAttempts = new Map<string, { count: number; blockedUntil: number }>();

function cookieConfig(maxAge: number) {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict" as const,
    maxAge,
    path: "/",
  };
}

function setAuthCookies(
  res: { cookie: (name: string, value: string, opts: Record<string, unknown>) => void },
  data: { token?: string; csrfToken?: string; refreshToken?: string; primaryToken?: string },
): void {
  if (data.token) res.cookie("grova_token", data.token, cookieConfig(SESSION_MS));
  if (data.csrfToken) res.cookie("grova_csrf", data.csrfToken, cookieConfig(SESSION_MS));
  if (data.refreshToken) res.cookie("grova_refresh", data.refreshToken, cookieConfig(SESSION_MS));
  if (data.primaryToken) res.cookie("grova_primary", data.primaryToken, cookieConfig(PRIMARY_SESSION_MS));
}

function clearAuthCookies(
  res: { clearCookie: (name: string, opts: Record<string, unknown>) => void },
): void {
  const opts = { path: "/" };
  res.clearCookie("grova_token", opts);
  res.clearCookie("grova_csrf", opts);
  res.clearCookie("grova_refresh", opts);
  res.clearCookie("grova_primary", opts);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function listFromEnv(key: string): string[] {
  return (process.env[key] || "")
    .split(",")
    .map((s) => s.trim().replace(/^['"]|['"]$/g, "").toLowerCase())
    .filter(Boolean);
}

function getPrimaryPasswords(): string[] {
  const direct = [
    process.env.PRIMARY_AUTH_PASSWORD_1,
    process.env.PRIMARY_AUTH_PASSWORD_2,
    process.env.PRIMARY_AUTH_PASSWORD_3,
    process.env.PRIMARY_AUTH_PASSWORD_4,
  ]
    .map((s) => String(s || "").trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
  if (direct.length > 0) return direct;
  return (process.env.PRIMARY_AUTH_PASSWORDS || "")
    .split(",")
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
}

function getPrimaryPasswordHashes(): string[] {
  return (process.env.PRIMARY_AUTH_PASSWORD_HASHES || "")
    .split(",")
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
}

function safeEq(a: string, b: string): boolean {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}

function isAllowedPrimaryCredential(email: string, password: string): boolean {
  const allowedEmails = listFromEnv("PRIMARY_AUTH_EMAILS");
  const allowedPasswords = getPrimaryPasswords();
  const allowedPasswordHashes = getPrimaryPasswordHashes();

  const normalizedInput = email.trim().toLowerCase();
  const strictEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!strictEmailPattern.test(normalizedInput)) return false;
  if (!allowedEmails.includes(normalizedInput)) return false;
  if (allowedPasswordHashes.length > 0) {
    return allowedPasswordHashes.some((hash) => bcrypt.compareSync(password, hash));
  }
  return allowedPasswords.some((p) => safeEq(p, password));
}

function primaryAttemptKey(req: { headers: Record<string, unknown>; socket: { remoteAddress?: string | null } }, email: string): string {
  const ip =
    (typeof req.headers["x-forwarded-for"] === "string" ? req.headers["x-forwarded-for"].split(",")[0] : "") ||
    (typeof req.headers["x-real-ip"] === "string" ? req.headers["x-real-ip"] : "") ||
    req.socket.remoteAddress ||
    "unknown";
  return `${ip.trim().toLowerCase()}::${email.trim().toLowerCase()}`;
}

function requestUserAgent(req: { headers: Record<string, unknown> }): string {
  return String(req.headers["user-agent"] || "Unknown");
}

async function validateAndRenewPrimaryToken(
  req: { headers: Record<string, unknown> },
  primaryToken: string,
): Promise<boolean> {
  const tokenHash = sha256(primaryToken);
  const now = Date.now();
  const result = await db.execute(
    "SELECT token_hash FROM primary_access_tokens WHERE token_hash = $1 AND expires_at > $2 AND user_agent = $3",
    [tokenHash, now, requestUserAgent(req)],
  );
  if (result.rows.length === 0) return false;
  await db.execute("UPDATE primary_access_tokens SET expires_at = $1 WHERE token_hash = $2", [
    now + PRIMARY_SESSION_RENEW_MS,
    tokenHash,
  ]);
  return true;
}

async function clearExpiredPrimaryTokens(): Promise<void> {
  await db.execute("DELETE FROM primary_access_tokens WHERE expires_at <= $1", [Date.now()]);
}

function bootstrapCodeFromEnv(): string {
  return String(process.env.DEFAULT_COUPLE_CODE || "").trim();
}

/** Shared encryption secret for chat — separate from per-profile login codes. */
async function getEffectiveCoupleCode(): Promise<string | null> {
  const codeResult = await db.execute("SELECT code FROM couple_code ORDER BY id LIMIT 1", []);
  const fromDb = String((codeResult.rows[0]?.code as string | undefined) ?? "").trim();
  if (fromDb) return fromDb;
  const fromEnv = bootstrapCodeFromEnv();
  return fromEnv || null;
}

/** Per-profile login code (Mustaq and Sara each have their own). */
async function getProfileCode(profileId: string): Promise<string | null> {
  const codeResult = await db.execute("SELECT code FROM profile_codes WHERE profile_id = $1", [profileId]);
  const fromDb = String((codeResult.rows[0]?.code as string | undefined) ?? "").trim();
  if (fromDb) return fromDb;
  return getEffectiveCoupleCode();
}

async function setProfileCode(profileId: string, newCode: string): Promise<void> {
  const trimmed = newCode.trim();
  await db.execute(
    `INSERT INTO profile_codes (profile_id, code) VALUES ($1, $2)
     ON CONFLICT (profile_id) DO UPDATE SET code = $2`,
    [profileId, trimmed],
  );
}

function codeAttemptKey(req: { headers: Record<string, unknown>; socket: { remoteAddress?: string | null } }, userId: string): string {
  const ip =
    (typeof req.headers["x-forwarded-for"] === "string" ? req.headers["x-forwarded-for"].split(",")[0] : "") ||
    (typeof req.headers["x-real-ip"] === "string" ? req.headers["x-real-ip"] : "") ||
    req.socket.remoteAddress ||
    "unknown";
  return `${ip.trim().toLowerCase()}::${userId.trim().toLowerCase()}`;
}

// Public — login screen avatars/names (no auth)
router.get("/auth/profiles", rateLimiters.read, async (_req, res) => {
  try {
    const primaryFromCookie =
      _req && typeof (_req as unknown as { cookies?: Record<string, string> }).cookies?.grova_primary === "string"
        ? (_req as unknown as { cookies: Record<string, string> }).cookies.grova_primary
        : "";
    const primaryToken = String(_req.headers["x-primary-token"] || primaryFromCookie || "");
    if (!(await validateAndRenewPrimaryToken(_req, primaryToken))) {
      res.status(401).json({ error: "Primary authentication required" });
      return;
    }

    const defaults = [
      { id: "me", username: "mustaq", name: "Mustaq", bio: "Just us two ♥", avatar: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=150&h=150&fit=crop" },
      { id: "wife", username: "sara", name: "Sara", bio: "My person ♥", avatar: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&h=150&fit=crop" },
    ];

    // Ensure profiles exist in database
    for (const profile of defaults) {
      try {
        const existsResult = await db.execute(
          "SELECT id FROM profiles WHERE id = $1",
          [profile.id]
        );
        
        if (existsResult.rows.length === 0) {
          // Create profile if it doesn't exist
          await db.execute(
            "INSERT INTO profiles (id, username, name, bio, avatar) VALUES ($1, $2, $3, $4, $5)",
            [profile.id, profile.username, profile.name, profile.bio, profile.avatar]
          );
        }
      } catch {
        // Continue if insert fails (profile might already exist due to race condition)
      }
    }

    // Fetch profiles from database
    const result = await db.execute(
      "SELECT id, name, avatar FROM profiles WHERE id IN ('me', 'wife')",
      []
    );
    const rows = result.rows as { id: string; name: string; avatar: string }[];

    const merged = await Promise.all(
      defaults.map(async (d) => {
        const row = rows.find((r) => r.id === d.id);
        return row
          ? { id: row.id, name: row.name, avatar: sanitizeAvatarForClient(row.id, row.avatar) }
          : d;
      }),
    );
    
    res.json(merged);
  } catch {
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
});

async function profileToUser(row: Record<string, unknown>, userId: string) {
  return {
    id: userId,
    username: String(row.username ?? (userId === "me" ? "mustaq" : "sara")),
    name: String(row.name ?? ""),
    bio: String(row.bio ?? ""),
    avatar: sanitizeAvatarForClient(userId, row.avatar),
  };
}

/** Restore logged-in user from session token (Neon-backed session). */
router.get("/auth/session", rateLimiters.read, async (req, res) => {
  const authHeader = req.headers.authorization;
  const cookieToken =
    req && typeof (req as unknown as { cookies?: Record<string, string> }).cookies?.grova_token === "string"
      ? (req as unknown as { cookies: Record<string, string> }).cookies.grova_token
      : null;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : cookieToken;
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const session = await validateSession(token);
    if (!session) {
      res.status(401).json({ error: "Session expired" });
      return;
    }

    const profileResult = await db.execute("SELECT * FROM profiles WHERE id = $1", [session.userId]);
    const meRow = profileResult.rows[0] as Record<string, unknown> | undefined;
    if (!meRow) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    const partnerId = session.userId === "me" ? "wife" : "me";
    const partnerResult = await db.execute("SELECT * FROM profiles WHERE id = $1", [partnerId]);
    const partnerRow = partnerResult.rows[0] as Record<string, unknown> | undefined;

    res.json({
      user: await profileToUser(meRow, session.userId),
      partner: partnerRow ? await profileToUser(partnerRow, partnerId) : null,
    });
  } catch {
    res.status(500).json({ error: "Failed to restore session" });
  }
});

router.post("/auth/login", validateBody({
  userId: validators.nonEmptyString,
  code: validators.stringOfLength(4, 50),
}), async (req, res) => {
  const { userId, code } = req.body as { userId: string; code: string };
  const primaryFromCookie =
    req && typeof (req as unknown as { cookies?: Record<string, string> }).cookies?.grova_primary === "string"
      ? (req as unknown as { cookies: Record<string, string> }).cookies.grova_primary
      : "";
  const primaryToken = String(req.headers["x-primary-token"] || primaryFromCookie || "");

  try {
    if (!(await validateAndRenewPrimaryToken(req, primaryToken))) {
      res.status(401).json({ error: "Primary authentication required" });
      return;
    }

    const codeKey = codeAttemptKey(req as unknown as { headers: Record<string, unknown>; socket: { remoteAddress?: string | null } }, userId);
    const codeState = coupleCodeAttempts.get(codeKey);
    if (codeState && codeState.blockedUntil > Date.now()) {
      res.status(429).json({
        error: "Too many wrong code attempts. Try again later.",
        retryAfterMs: codeState.blockedUntil - Date.now(),
        attemptsRemaining: 0,
      });
      return;
    }

    const storedCode = await getProfileCode(userId);
    if (!storedCode || code.trim() !== storedCode.trim()) {
      const nextCount = (codeState?.count || 0) + 1;
      if (nextCount >= CODE_MAX_FAILED_ATTEMPTS) {
        coupleCodeAttempts.set(codeKey, { count: nextCount, blockedUntil: Date.now() + CODE_BLOCK_MS });
        res.status(429).json({
          error: "Too many wrong code attempts. Try again later.",
          retryAfterMs: CODE_BLOCK_MS,
          attemptsRemaining: 0,
        });
        return;
      }
      coupleCodeAttempts.set(codeKey, { count: nextCount, blockedUntil: 0 });
      res.status(401).json({ error: "Invalid code", attemptsRemaining: CODE_MAX_FAILED_ATTEMPTS - nextCount });
      return;
    }
    coupleCodeAttempts.delete(codeKey);

    const encryptionKey = (await getEffectiveCoupleCode()) || storedCode;

    const profileResult = await db.execute("SELECT * FROM profiles WHERE id = $1", [userId]);
    const p = profileResult.rows[0];

    if (!p) {
      // If user doesn't exist, create them on the fly with default profile
      const defaultProfile = userId === "me" 
        ? { id: "me", username: "mustaq", name: "Mustaq", bio: "Just us two ♥", avatar: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=150&h=150&fit=crop" }
        : { id: "wife", username: "sara", name: "Sara", bio: "My person ♥", avatar: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&h=150&fit=crop" };
      
      await db.execute(
        `INSERT INTO profiles (id, username, name, bio, avatar) VALUES ($1, $2, $3, $4, $5)`,
        [defaultProfile.id, defaultProfile.username, defaultProfile.name, defaultProfile.bio, defaultProfile.avatar],
      );
      
      // Get the newly created profile
      const newProfileResult = await db.execute("SELECT * FROM profiles WHERE id = $1", [userId]);
      const newP = newProfileResult.rows[0];
      
      if (!newP) { res.status(500).json({ error: "Failed to create user" }); return; }
      
      // Get user agent and IP
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                req.headers['x-real-ip'] as string || 
                req.socket.remoteAddress || 'Unknown';

      // Create session and return token
      const { token, csrfToken, refreshToken, deviceId } = await createSession(userId, userId === "me" ? "mustaq" : "sara", userAgent, ip);
      setAuthCookies(res as unknown as { cookie: (name: string, value: string, opts: Record<string, unknown>) => void }, {
        token,
        csrfToken,
        refreshToken,
      });

      res.json({
        token,
        csrfToken,
        refreshToken,
        deviceId,
        encryptionKey,
        user: {
          id: userId,
          username: userId === "me" ? "mustaq" : "sara",
          name: newP.name,
          bio: newP.bio,
          avatar: await persistAvatarIfNeeded(userId, newP.avatar),
        },
      });
      return;
    }

    // Get user agent and IP
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
              req.headers['x-real-ip'] as string || 
              req.socket.remoteAddress || 'Unknown';

    // Create session and return token
    const { token, csrfToken, refreshToken, deviceId } = await createSession(userId, userId === "me" ? "mustaq" : "sara", userAgent, ip);
    setAuthCookies(res as unknown as { cookie: (name: string, value: string, opts: Record<string, unknown>) => void }, {
      token,
      csrfToken,
      refreshToken,
    });

    res.json({
      token,
      csrfToken,
      refreshToken,
      deviceId,
      encryptionKey,
      user: {
        id: userId,
        username: userId === "me" ? "mustaq" : "sara",
        name: p.name,
        bio: p.bio,
        avatar: await persistAvatarIfNeeded(userId, p.avatar),
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/auth/logout", authenticate, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const tokenFromCookie =
      req && typeof (req as unknown as { cookies?: Record<string, string> }).cookies?.grova_token === "string"
        ? (req as unknown as { cookies: Record<string, string> }).cookies.grova_token
        : undefined;
    const token = authHeader?.substring(7) || tokenFromCookie;
    const primaryFromCookie =
      req && typeof (req as unknown as { cookies?: Record<string, string> }).cookies?.grova_primary === "string"
        ? (req as unknown as { cookies: Record<string, string> }).cookies.grova_primary
        : "";
    const primaryToken = String(req.headers["x-primary-token"] || primaryFromCookie || "");
    if (token) {
      destroySession(token);
    }
    clearAuthCookies(res as unknown as { clearCookie: (name: string, opts: Record<string, unknown>) => void });
    if (primaryToken) {
      setAuthCookies(res as unknown as { cookie: (name: string, value: string, opts: Record<string, unknown>) => void }, {
        primaryToken,
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Logout failed" });
  }
});

router.post("/auth/primary-login", rateLimiters.auth, validateBody({
  email: validators.nonEmptyString,
  password: validators.nonEmptyString,
}), async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  try {
    await clearExpiredPrimaryTokens();
    const attemptKey = primaryAttemptKey(req as unknown as { headers: Record<string, unknown>; socket: { remoteAddress?: string | null } }, email);
    const attemptState = primaryLoginAttempts.get(attemptKey);
    if (attemptState && attemptState.blockedUntil > Date.now()) {
      res.status(429).json({
        error: "Too many failed attempts. Try again later.",
        retryAfterMs: attemptState.blockedUntil - Date.now(),
        attemptsRemaining: 0,
      });
      return;
    }

    if (!isAllowedPrimaryCredential(email, password)) {
      const nextCount = (attemptState?.count || 0) + 1;
      if (nextCount >= PRIMARY_MAX_FAILED_ATTEMPTS) {
        primaryLoginAttempts.set(attemptKey, {
          count: nextCount,
          blockedUntil: Date.now() + PRIMARY_BLOCK_MS,
        });
        res.status(429).json({
          error: "Too many failed attempts. Try again later.",
          retryAfterMs: PRIMARY_BLOCK_MS,
          attemptsRemaining: 0,
        });
        return;
      }
      primaryLoginAttempts.set(attemptKey, { count: nextCount, blockedUntil: 0 });
      res.status(401).json({ error: "Invalid email or password", attemptsRemaining: PRIMARY_MAX_FAILED_ATTEMPTS - nextCount });
      return;
    }

    primaryLoginAttempts.delete(attemptKey);

    const primaryToken = randomBytes(32).toString("hex");
    const tokenHash = sha256(primaryToken);
    const now = Date.now();
    const userAgent = String(req.headers["user-agent"] || "Unknown");
    await db.execute(
      "INSERT INTO primary_access_tokens (token_hash, email, user_agent, created_at, expires_at) VALUES ($1, $2, $3, $4, $5)",
      [tokenHash, email.toLowerCase(), userAgent, now, now + PRIMARY_SESSION_MS],
    );
    setAuthCookies(res as unknown as { cookie: (name: string, value: string, opts: Record<string, unknown>) => void }, {
      primaryToken,
    });
    res.json({ ok: true, expiresAt: now + PRIMARY_SESSION_MS });
  } catch {
    res.status(500).json({ error: "Primary login failed" });
  }
});

/** Revoke trusted-device access on this browser (forces email+password again). */
router.post("/auth/revoke-trust", rateLimiters.auth, async (req, res) => {
  try {
    const primaryFromCookie =
      req && typeof (req as unknown as { cookies?: Record<string, string> }).cookies?.grova_primary === "string"
        ? (req as unknown as { cookies: Record<string, string> }).cookies.grova_primary
        : "";
    const primaryToken = String(req.headers["x-primary-token"] || primaryFromCookie || "");
    if (primaryToken) {
      const tokenHash = sha256(primaryToken);
      await db.execute("DELETE FROM primary_access_tokens WHERE token_hash = $1", [tokenHash]);
    }
    res.clearCookie("grova_primary", { path: "/" });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to revoke trust" });
  }
});

router.get("/auth/primary-session", async (req, res) => {
  try {
    const primaryFromCookie =
      req && typeof (req as unknown as { cookies?: Record<string, string> }).cookies?.grova_primary === "string"
        ? (req as unknown as { cookies: Record<string, string> }).cookies.grova_primary
        : "";
    const primaryToken = String(req.headers["x-primary-token"] || primaryFromCookie || "");
    if (!primaryToken) {
      res.status(401).json({ error: "Primary session missing" });
      return;
    }
    const ok = await validateAndRenewPrimaryToken(req, primaryToken);
    if (!ok) {
      res.status(401).json({ error: "Primary session expired" });
      return;
    }
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to validate primary session" });
  }
});

router.post("/auth/unlock", authenticate, validateBody({
  code: validators.stringOfLength(4, 50),
}), async (req, res) => {
  const { code } = req.body as { code: string };
  try {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    const codeKey = codeAttemptKey(req as unknown as { headers: Record<string, unknown>; socket: { remoteAddress?: string | null } }, userId);
    const codeState = coupleCodeAttempts.get(codeKey);
    if (codeState && codeState.blockedUntil > Date.now()) {
      res.status(429).json({
        error: "Too many wrong code attempts. Try again later.",
        retryAfterMs: codeState.blockedUntil - Date.now(),
        attemptsRemaining: 0,
      });
      return;
    }
    const storedCode = await getProfileCode(userId);
    if (!storedCode || code.trim() !== storedCode.trim()) {
      const nextCount = (codeState?.count || 0) + 1;
      if (nextCount >= CODE_MAX_FAILED_ATTEMPTS) {
        coupleCodeAttempts.set(codeKey, { count: nextCount, blockedUntil: Date.now() + CODE_BLOCK_MS });
        res.status(429).json({
          error: "Too many wrong code attempts. Try again later.",
          retryAfterMs: CODE_BLOCK_MS,
          attemptsRemaining: 0,
        });
        return;
      }
      coupleCodeAttempts.set(codeKey, { count: nextCount, blockedUntil: 0 });
      res.status(401).json({ error: "Invalid code", attemptsRemaining: CODE_MAX_FAILED_ATTEMPTS - nextCount });
      return;
    }
    coupleCodeAttempts.delete(codeKey);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Unlock failed" });
  }
});

router.put("/auth/couple-code", authenticate, validateBody({
  newCode: validators.stringOfLength(4, 50),
  currentCode: validators.stringOfLength(4, 50),
}), async (req, res) => {
  const { newCode, currentCode } = req.body as { newCode: string; currentCode: string };

  try {
    const profileId = (req as unknown as { user: { id: string } }).user.id;
    const profileCode = await getProfileCode(profileId);

    if (!profileCode || currentCode.trim() !== profileCode.trim()) {
      res.status(401).json({ error: "Current code is wrong" });
      return;
    }

    await setProfileCode(profileId, newCode);
    res.json({ success: true, message: "Profile code updated for your account only" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update code" });
  }
});

router.post("/auth/refresh", rateLimiters.auth, async (req, res) => {
  try {
    const refreshFromCookie =
      req && typeof (req as unknown as { cookies?: Record<string, string> }).cookies?.grova_refresh === "string"
        ? (req as unknown as { cookies: Record<string, string> }).cookies.grova_refresh
        : undefined;
    const { refreshToken: refreshFromBody } = req.body as { refreshToken?: string };
    const refreshToken = refreshFromBody || refreshFromCookie || "";

    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token required" });
      return;
    }

    const newTokens = await refreshSession(refreshToken);

    if (!newTokens) {
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }

    setAuthCookies(res as unknown as { cookie: (name: string, value: string, opts: Record<string, unknown>) => void }, {
      token: newTokens.token,
      csrfToken: newTokens.csrfToken,
      refreshToken: newTokens.refreshToken,
    });

    res.json({
      token: newTokens.token,
      csrfToken: newTokens.csrfToken,
      refreshToken: newTokens.refreshToken,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to refresh token" });
  }
});

router.get("/auth/devices", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const devices = await getUserDevices(userId);
    res.json({ devices });
  } catch (err) {
    res.status(500).json({ error: "Failed to get devices" });
  }
});

router.delete("/auth/devices/:deviceId", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const deviceId = Array.isArray(req.params.deviceId) ? req.params.deviceId[0] : req.params.deviceId;
    
    const success = await revokeDevice(userId, deviceId);
    
    if (!success) {
      res.status(404).json({ error: "Device not found or does not belong to user" });
      return;
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to revoke device" });
  }
});

export default router;
