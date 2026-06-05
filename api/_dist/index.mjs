import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
    

// src/lib/load-env.ts
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
var apiServerRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
var repoRoot = path.resolve(apiServerRoot, "../..");
if (!process.env.VERCEL) {
  config({ path: path.join(repoRoot, ".env") });
}

// src/app.ts
import fs from "node:fs";
import path2 from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import rateLimit2 from "express-rate-limit";

// src/routes/index.ts
import { Router as Router28 } from "express";

// src/lib/security.ts
import rateLimit from "express-rate-limit";
import helmet from "helmet";

// src/lib/auth-middleware.ts
import { randomBytes } from "crypto";

// src/lib/config.ts
function resolveDefaultCoupleCode() {
  const fromEnv = process.env.DEFAULT_COUPLE_CODE?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
    throw new Error("DEFAULT_COUPLE_CODE must be set in production");
  }
  return "change-me-before-hosting";
}
var appConfig = {
  defaultCoupleCode: resolveDefaultCoupleCode(),
  defaultProfiles: [
    {
      id: "me",
      username: process.env.DEFAULT_USER1_USERNAME || "mustaq",
      name: process.env.DEFAULT_USER1_NAME || "Mustaq",
      bio: process.env.DEFAULT_USER1_BIO || "Just us two \u2665",
      avatar: process.env.DEFAULT_USER1_AVATAR || ""
    },
    {
      id: "wife",
      username: process.env.DEFAULT_USER2_USERNAME || "sara",
      name: process.env.DEFAULT_USER2_NAME || "Sara",
      bio: process.env.DEFAULT_USER2_BIO || "My person \u2665",
      avatar: process.env.DEFAULT_USER2_AVATAR || ""
    }
  ],
  partnerMapping: {
    me: "wife",
    wife: "me"
  }
};

// src/lib/postgres-pool.ts
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
function normalizePostgresUrl(raw) {
  const url = new URL(raw);
  url.searchParams.delete("channel_binding");
  return url.toString();
}
function isNeonHost(connectionString) {
  try {
    return new URL(connectionString).hostname.includes("neon.tech");
  } catch {
    return connectionString.includes("neon.tech");
  }
}
async function createPostgresPool(connectionString) {
  const normalized = normalizePostgresUrl(connectionString);
  if (isNeonHost(normalized)) {
    neonConfig.webSocketConstructor = ws;
    return new NeonPool({
      connectionString: normalized,
      max: 10,
      idleTimeoutMillis: 1e4,
      connectionTimeoutMillis: 3e4
    });
  }
  const pg = await import("pg");
  const url = new URL(normalized);
  const sslmode = url.searchParams.get("sslmode");
  const needsSsl = sslmode === "require" || sslmode === "verify-full" || sslmode === "verify-ca";
  return new pg.default.Pool({
    connectionString: normalized,
    idleTimeoutMillis: 1e4,
    connectionTimeoutMillis: 3e4,
    max: 10,
    keepAlive: true,
    keepAliveInitialDelayMillis: 1e4,
    ssl: needsSsl ? { rejectUnauthorized: false } : void 0
  });
}

// src/lib/db.ts
function resolveDatabaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
  }
  const databaseUrl = normalizePostgresUrl(raw);
  const envIsPostgres = databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://");
  if (!envIsPostgres) {
    throw new Error(
      "FATAL: Only PostgreSQL/Neon is supported. Use DATABASE_URL=postgresql://... from https://console.neon.tech"
    );
  }
  return databaseUrl;
}
function prepareSql(sql) {
  let n = 0;
  return sql.replace(/\?/g, () => `$${++n}`);
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
var pgPool = null;
var poolInit = null;
var dbRef = { handle: null };
function setActiveDb(handle) {
  dbRef.handle = handle;
}
function createPostgresDb(pool) {
  return {
    execute: async (sql, params) => {
      const client = await pool.connect();
      try {
        const result = await client.query(prepareSql(sql), params);
        return { rows: result.rows, changes: result.rowCount ?? 0 };
      } finally {
        client.release();
      }
    },
    query: async (sql, params) => {
      const client = await pool.connect();
      try {
        const result = await client.query(prepareSql(sql), params);
        return { rows: result.rows };
      } finally {
        client.release();
      }
    }
  };
}
async function ensurePool() {
  if (pgPool) return pgPool;
  if (!poolInit) {
    poolInit = (async () => {
      const databaseUrl = resolveDatabaseUrl();
      const pool = await createPostgresPool(databaseUrl);
      pgPool = pool;
      setActiveDb(createPostgresDb(pool));
      console.log(
        isNeonHost(databaseUrl) ? "[neon] Using PostgreSQL (Neon cloud, WebSocket)" : "[db] Using PostgreSQL"
      );
      return pool;
    })();
  }
  return poolInit;
}
var db = {
  execute: async (sql, params) => {
    await ensurePool();
    return dbRef.handle.execute(sql, params);
  },
  query: async (sql, params) => {
    await ensurePool();
    return dbRef.handle.query(sql, params);
  }
};
var db_default = db;
var dbReady = false;
function isDbReady() {
  return dbReady;
}
async function pingDatabase() {
  try {
    const pool = await ensurePool();
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
async function verifyPostgresConnection(retries = 5) {
  const pool = await ensurePool();
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query("SELECT 1");
      console.log("[neon] PostgreSQL connected successfully");
      return;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        console.error(`[neon] Connection attempt ${attempt}/${retries} failed:`, err);
        await sleep(2e3 * attempt);
      }
    }
  }
  throw new Error(`FATAL: Cannot connect to PostgreSQL after ${retries} attempts: ${lastErr}`);
}
async function initDb() {
  try {
    await verifyPostgresConnection();
    const tsCol = "BIGINT";
    await db.execute(`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        name TEXT NOT NULL,
        bio TEXT,
        avatar TEXT NOT NULL
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_agent TEXT NOT NULL,
        ip TEXT NOT NULL,
        created_at ${tsCol} NOT NULL,
        last_seen ${tsCol} NOT NULL,
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        created_at ${tsCol} NOT NULL,
        expires_at ${tsCol} NOT NULL,
        csrf_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        refresh_token_expires_at ${tsCol} NOT NULL,
        device_id TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
      )
    `);
    {
      for (const sql of [
        "ALTER TABLE devices ALTER COLUMN created_at TYPE BIGINT",
        "ALTER TABLE devices ALTER COLUMN last_seen TYPE BIGINT",
        "ALTER TABLE sessions ALTER COLUMN created_at TYPE BIGINT",
        "ALTER TABLE sessions ALTER COLUMN expires_at TYPE BIGINT",
        "ALTER TABLE sessions ALTER COLUMN refresh_token_expires_at TYPE BIGINT"
      ]) {
        try {
          await db.execute(sql);
        } catch {
        }
      }
    }
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id)`);
    try {
      await db.execute("ALTER TABLE devices ADD COLUMN typing_until BIGINT NOT NULL DEFAULT 0");
    } catch {
    }
    await db.execute(`
      CREATE TABLE IF NOT EXISTS primary_access_tokens (
        token_hash TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        user_agent TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        expires_at BIGINT NOT NULL
      )
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_primary_access_expires_at ON primary_access_tokens(expires_at)`);
    for (const col of ["client_id TEXT", "origin TEXT"]) {
      try {
        await db.execute(`ALTER TABLE primary_access_tokens ADD COLUMN ${col}`);
      } catch {
      }
    }
    await db.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL,
        text TEXT,
        type TEXT NOT NULL,
        audio_data TEXT,
        gif_url TEXT,
        image_data TEXT,
        timestamp TEXT NOT NULL,
        liked INTEGER DEFAULT 0,
        deleted INTEGER DEFAULT 0,
        deleted_at TEXT,
        variant TEXT,
        companion_sticker TEXT
      )
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages(deleted)`);
    for (const sql of [
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url TEXT",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_data TEXT",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_type TEXT",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_size INTEGER",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS location TEXT",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS thread_id TEXT",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS thread_parent_id TEXT",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS thread_reply_count INTEGER DEFAULT 0"
    ]) {
      try {
        await db.execute(sql);
      } catch {
      }
    }
    await db.execute(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        author_id TEXT NOT NULL,
        media_url TEXT NOT NULL,
        caption TEXT,
        location TEXT,
        aspect_ratio TEXT,
        created_at TEXT NOT NULL
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS stories (
        id TEXT PRIMARY KEY,
        author_id TEXT NOT NULL,
        media_url TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'story',
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS post_reactions (
        post_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        emoji TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (post_id, user_id)
      )
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_stories_author ON stories(author_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_stories_expires ON stories(expires_at)`);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS shared_tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        assigned_to TEXT NOT NULL,
        priority TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        author TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS post_likes (
        post_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (post_id, user_id)
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS post_comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id)`);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS hidden_messages (
        user_id TEXT NOT NULL,
        message_id TEXT NOT NULL,
        hidden_at TEXT NOT NULL,
        PRIMARY KEY (user_id, message_id)
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS chat_clear_state (
        user_id TEXT PRIMARY KEY,
        cleared_at TEXT NOT NULL
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS duas (
        id TEXT PRIMARY KEY,
        arabic TEXT NOT NULL,
        translation TEXT,
        author TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);
    await db.execute(`CREATE TABLE IF NOT EXISTS couple_code (
      id SERIAL PRIMARY KEY,
      code TEXT NOT NULL UNIQUE
    )`);
    await db.execute(
      "INSERT INTO couple_code (code) VALUES ($1) ON CONFLICT (code) DO NOTHING",
      [appConfig.defaultCoupleCode]
    );
    await db.execute(`CREATE TABLE IF NOT EXISTS profile_codes (
      profile_id TEXT PRIMARY KEY,
      code TEXT NOT NULL
    )`);
    const sharedCodeRow = await db.execute("SELECT code FROM couple_code ORDER BY id LIMIT 1", []);
    const seedCode = String(sharedCodeRow.rows[0]?.code ?? "").trim() || appConfig.defaultCoupleCode;
    for (const profileId of ["me", "wife"]) {
      await db.execute(
        `INSERT INTO profile_codes (profile_id, code) VALUES ($1, $2) ON CONFLICT (profile_id) DO NOTHING`,
        [profileId, seedCode]
      );
    }
    for (const profile of appConfig.defaultProfiles) {
      await db.execute(
        `INSERT INTO profiles (id, username, name, bio, avatar) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [profile.id, profile.username, profile.name, profile.bio, profile.avatar]
      );
    }
    for (const profile of appConfig.defaultProfiles) {
      await db.execute(
        `UPDATE profiles SET avatar = $1
         WHERE id = $2 AND (avatar IS NULL OR avatar = '' OR avatar LIKE '%picsum%' OR avatar LIKE '%dicebear%' OR avatar LIKE '%1516035069371%')`,
        [profile.avatar, profile.id]
      );
    }
    await db.execute(`
      CREATE TABLE IF NOT EXISTS couple_prefs (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS activity_feed (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        from_name TEXT NOT NULL,
        text TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        read INTEGER DEFAULT 0
      )
    `);
    for (const sql of ["ALTER TABLE activity_feed ADD COLUMN actor_id TEXT"]) {
      try {
        await db.execute(sql);
      } catch {
      }
    }
    await db.execute(
      `INSERT INTO couple_prefs (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
      ["chat_theme", "default"]
    );
    for (const [key, val] of [
      ["read_receipts", "on"],
      ["show_presence", "on"],
      ["notifications", "on"],
      ["note_me", ""],
      ["note_wife", ""]
    ]) {
      await db.execute(
        `INSERT INTO couple_prefs (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
        [key, val]
      );
    }
    await db.execute(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        user_id TEXT PRIMARY KEY,
        subscription TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS public_keys (
        user_id TEXT PRIMARY KEY,
        public_key TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS two_factor_auth (
        user_id TEXT PRIMARY KEY,
        secret TEXT NOT NULL,
        enabled INTEGER DEFAULT 0,
        backup_codes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS message_reactions (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        emoji TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS message_read_receipts (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        read_at TEXT NOT NULL,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS message_media_opens (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        opened_at TEXT NOT NULL,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      )
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_message_media_opens_message_user ON message_media_opens(message_id, user_id)`);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS forwarded_messages (
        id TEXT PRIMARY KEY,
        original_message_id TEXT NOT NULL,
        from_user_id TEXT NOT NULL,
        to_user_id TEXT NOT NULL,
        forwarded_at TEXT NOT NULL,
        FOREIGN KEY (original_message_id) REFERENCES messages(id) ON DELETE CASCADE
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS message_edits (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        old_text TEXT,
        new_text TEXT,
        edited_at TEXT NOT NULL,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS pinned_messages (
        user_id TEXT NOT NULL,
        message_id TEXT NOT NULL,
        pinned_at TEXT NOT NULL,
        PRIMARY KEY (user_id, message_id),
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT,
        description TEXT,
        type TEXT NOT NULL,
        author TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS daily_checkins (
        id TEXT PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        mood TEXT NOT NULL,
        author TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS relationship_milestones (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        author TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS secret_notes (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        author TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS scheduled_messages (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL,
        text TEXT,
        type TEXT NOT NULL,
        audio_data TEXT,
        gif_url TEXT,
        image_data TEXT,
        variant TEXT,
        companion_sticker TEXT,
        scheduled_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        sent INTEGER DEFAULT 0
      )
    `);
    dbReady = true;
  } catch (err) {
    console.error("Database initialization error:", err);
    throw new Error(`Failed to initialize database: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// src/lib/logger.ts
import pino from "pino";
var isProduction = process.env.NODE_ENV === "production";
var logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']"
  ],
  ...isProduction ? {} : {
    transport: {
      target: "pino-pretty",
      options: { colorize: true }
    }
  }
});

// src/lib/auth-middleware.ts
var SESSION_DURATION = 30 * 24 * 60 * 60 * 1e3;
var REFRESH_TOKEN_DURATION = 30 * 24 * 60 * 60 * 1e3;
function generateDeviceId() {
  const randomBytesBuffer = randomBytes(16);
  return randomBytesBuffer.toString("hex");
}
function generateCSRFToken() {
  const randomBytesBuffer = randomBytes(32);
  return randomBytesBuffer.toString("hex");
}
function generateSessionToken() {
  const timestamp = Date.now().toString(36);
  const randomBytesBuffer = randomBytes(32);
  const randomString = randomBytesBuffer.toString("base64");
  return `${timestamp}.${randomString}`;
}
async function createSession(userId, username, userAgent, ip) {
  const token = generateSessionToken();
  const csrfToken = generateCSRFToken();
  const refreshToken = generateSessionToken();
  const deviceId = generateDeviceId();
  const now = Date.now();
  try {
    await db_default.execute(
      `INSERT INTO devices (id, user_id, user_agent, ip, created_at, last_seen) VALUES (?, ?, ?, ?, ?, ?)`,
      [deviceId, userId, userAgent || "Unknown", ip || "Unknown", now, now]
    );
    await db_default.execute(
      `INSERT INTO sessions (token, user_id, username, created_at, expires_at, csrf_token, refresh_token, refresh_token_expires_at, device_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [token, userId, username, now, now + SESSION_DURATION, csrfToken, refreshToken, now + REFRESH_TOKEN_DURATION, deviceId]
    );
    return { token, csrfToken, refreshToken, deviceId };
  } catch (err) {
    logger.error({ err, userId }, "Failed to create session");
    throw err;
  }
}
async function validateSession(token) {
  try {
    const result = await db_default.execute(
      "SELECT * FROM sessions WHERE token = ? AND expires_at > ?",
      [token, Date.now()]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      userId: row.user_id,
      username: row.username,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      csrfToken: row.csrf_token,
      refreshToken: row.refresh_token,
      refreshTokenExpiresAt: row.refresh_token_expires_at,
      deviceId: row.device_id,
      deviceInfo: {
        userAgent: "Unknown",
        ip: "Unknown",
        lastSeen: Date.now()
      }
    };
  } catch (err) {
    logger.error({ err }, "Failed to validate session");
    return null;
  }
}
async function validateRefreshToken(refreshToken) {
  try {
    const result = await db_default.execute(
      "SELECT * FROM sessions WHERE refresh_token = ? AND refresh_token_expires_at > ?",
      [refreshToken, Date.now()]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      userId: row.user_id,
      username: row.username,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      csrfToken: row.csrf_token,
      refreshToken: row.refresh_token,
      refreshTokenExpiresAt: row.refresh_token_expires_at,
      deviceId: row.device_id,
      deviceInfo: {
        userAgent: "Unknown",
        ip: "Unknown",
        lastSeen: Date.now()
      }
    };
  } catch (err) {
    console.error("Failed to validate refresh token:", err);
    return null;
  }
}
async function refreshSession(refreshToken) {
  const session = await validateRefreshToken(refreshToken);
  if (!session) return null;
  const newToken = generateSessionToken();
  const newCsrfToken = generateCSRFToken();
  const newRefreshToken = generateSessionToken();
  const now = Date.now();
  try {
    await db_default.execute("DELETE FROM sessions WHERE refresh_token = ?", [refreshToken]);
    await db_default.execute(
      `INSERT INTO sessions (token, user_id, username, created_at, expires_at, csrf_token, refresh_token, refresh_token_expires_at, device_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newToken, session.userId, session.username, now, now + SESSION_DURATION, newCsrfToken, newRefreshToken, now + REFRESH_TOKEN_DURATION, session.deviceId]
    );
    return { token: newToken, csrfToken: newCsrfToken, refreshToken: newRefreshToken };
  } catch (err) {
    logger.error({ err }, "Failed to refresh session");
    return null;
  }
}
async function getUserDevices(userId) {
  try {
    const result = await db_default.execute(
      "SELECT * FROM devices WHERE user_id = ?",
      [userId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      userAgent: row.user_agent,
      ip: row.ip,
      createdAt: row.created_at,
      lastSeen: row.last_seen
    }));
  } catch (err) {
    console.error("Failed to get user devices:", err);
    return [];
  }
}
async function revokeDevice(userId, deviceId) {
  try {
    const deviceResult = await db_default.execute(
      "SELECT * FROM devices WHERE id = ? AND user_id = ?",
      [deviceId, userId]
    );
    if (deviceResult.rows.length === 0) return false;
    await db_default.execute("DELETE FROM devices WHERE id = ?", [deviceId]);
    await db_default.execute("DELETE FROM sessions WHERE device_id = ?", [deviceId]);
    return true;
  } catch (err) {
    console.error("Failed to revoke device:", err);
    return false;
  }
}
async function updateDeviceLastSeen(deviceId) {
  try {
    await db_default.execute(
      "UPDATE devices SET last_seen = ? WHERE id = ?",
      [Date.now(), deviceId]
    );
  } catch (err) {
    logger.error({ err, deviceId }, "Failed to update device last seen");
  }
}
async function validateCSRFToken(token, csrfToken) {
  try {
    const result = await db_default.execute(
      "SELECT csrf_token, expires_at FROM sessions WHERE token = ? AND expires_at > ?",
      [token, Date.now()]
    );
    if (result.rows.length === 0) return false;
    return result.rows[0].csrf_token === csrfToken;
  } catch (err) {
    console.error("Failed to validate CSRF token:", err);
    return false;
  }
}
async function destroySession(token) {
  try {
    await db_default.execute("DELETE FROM sessions WHERE token = ?", [token]);
  } catch (err) {
    logger.error({ err }, "Failed to destroy session");
  }
}
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const cookieToken = req && typeof req.cookies?.grova_token === "string" ? req.cookies.grova_token : void 0;
  if ((!authHeader || !authHeader.startsWith("Bearer ")) && !cookieToken) {
    res.status(401).json({ error: "Unauthorized: No token provided" });
    return;
  }
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : cookieToken;
  const session = await validateSession(token);
  if (!session) {
    res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    return;
  }
  await updateDeviceLastSeen(session.deviceId);
  req.user = {
    id: session.userId,
    username: session.username,
    deviceId: session.deviceId
  };
  next();
}
async function authenticateBearerOrQuery(req, res, next) {
  const authHeader = req.headers.authorization;
  const queryToken = typeof req.query.token === "string" ? req.query.token : void 0;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : queryToken;
  if (!token) {
    res.status(401).json({ error: "Unauthorized: No token provided" });
    return;
  }
  const session = await validateSession(token);
  if (!session) {
    res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    return;
  }
  await updateDeviceLastSeen(session.deviceId);
  req.user = {
    id: session.userId,
    username: session.username,
    deviceId: session.deviceId
  };
  next();
}
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const session = await validateSession(token);
    if (session) {
      req.user = {
        id: session.userId,
        username: session.username,
        deviceId: session.deviceId
      };
    }
  }
  next();
}
var cleanupInterval = null;
function startSessionCleanup() {
  if (cleanupInterval) {
    logger.warn("Session cleanup already running");
    return;
  }
  cleanupInterval = setInterval(async () => {
    try {
      await db_default.execute("DELETE FROM sessions WHERE expires_at < ?", [Date.now()]);
    } catch (err) {
      logger.error({ err }, "Failed to clean up expired sessions");
    }
  }, 60 * 60 * 1e3);
  logger.info("Session cleanup started");
}
startSessionCleanup();

// src/lib/security.ts
var cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: [
    "'self'",
    "data:",
    "blob:",
    "https:",
    "https://images.unsplash.com",
    "https://res.cloudinary.com",
    "https://media.giphy.com",
    "https://i.giphy.com"
  ],
  connectSrc: [
    "'self'",
    "https://api.giphy.com",
    "https://images.unsplash.com",
    "https://res.cloudinary.com",
    "https://media.giphy.com",
    "https://i.giphy.com"
  ],
  fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'", "https://media.giphy.com", "https://res.cloudinary.com", "https:"],
  frameSrc: ["'none'"]
};
function setupSecurity(app2) {
  const isProd = process.env.NODE_ENV === "production";
  app2.use(
    helmet({
      contentSecurityPolicy: isProd ? { directives: cspDirectives } : false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      hsts: isProd ? {
        maxAge: 31536e3,
        includeSubDomains: true,
        preload: true
      } : false
    })
  );
}
var rateLimiters = {
  // Strict rate limit for auth endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1e3,
    // 15 minutes
    max: process.env.NODE_ENV === "production" ? 12 : 5,
    message: { error: "Too many authentication attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => false
  }),
  // Moderate rate limit for message operations (disabled for development)
  messages: rateLimit({
    windowMs: 1 * 60 * 1e3,
    // 1 minute
    max: process.env.NODE_ENV === "production" ? 240 : 2e3,
    message: { error: "Too many message requests, please slow down" },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => false
  }),
  // Lenient rate limit for read operations
  read: rateLimit({
    windowMs: 1 * 60 * 1e3,
    // 1 minute
    max: 100,
    // 100 requests per minute
    message: { error: "Too many requests, please slow down" },
    standardHeaders: true,
    legacyHeaders: false
  }),
  // Strict rate limit for file uploads
  upload: rateLimit({
    windowMs: 15 * 60 * 1e3,
    // 15 minutes
    max: process.env.NODE_ENV === "production" ? 30 : 60,
    message: { error: "Too many upload attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false
  })
};
function csrfProtection(req, res, next) {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    next();
    return;
  }
  const path3 = req.path || "";
  const url = (req.originalUrl || "").split("?")[0];
  const publicAuthPaths = ["/auth/primary-login", "/auth/login", "/auth/refresh"];
  const isPublicAuth = publicAuthPaths.some(
    (p) => path3 === p || path3.endsWith(p) || url === p || url.endsWith(p) || url.endsWith(`/api${p}`)
  );
  if (isPublicAuth) {
    next();
    return;
  }
  const token = (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : req.cookies?.grova_token) || "";
  const csrfToken = String(req.headers["x-csrf-token"] || "");
  if (!token) {
    next();
    return;
  }
  if (!csrfToken) {
    res.status(403).json({ error: "CSRF token missing" });
    return;
  }
  void validateCSRFToken(token, csrfToken).then((isValid) => {
    if (!isValid) {
      res.status(403).json({ error: "CSRF token invalid" });
      return;
    }
    next();
  });
}
function sanitizeInput(req, res, next) {
  if (req.body) {
    const sanitize = (obj) => {
      if (typeof obj === "string") {
        if (obj.startsWith("data:") || obj.startsWith("e2e:") || /^https?:\/\//i.test(obj)) {
          return obj;
        }
        let sanitized = obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/on\w+\s*=\s*["'].*?["']/gi, "").replace(/javascript:/gi, "").replace(/vbscript:/gi, "").replace(/file:/gi, "");
        if (sanitized.length > 1e4) {
          sanitized = sanitized.substring(0, 1e4);
        }
        return sanitized;
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }
      if (obj && typeof obj === "object") {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
          const sanitizedKey = key.replace(/</g, "&lt;").replace(/>/g, "&gt;");
          sanitized[sanitizedKey] = sanitize(value);
        }
        return sanitized;
      }
      return obj;
    };
    req.body = sanitize(req.body);
  }
  next();
}
function validateEnv() {
  const required = ["ENCRYPTION_KEY", "ENCRYPTION_PASSWORD"];
  const missing = [];
  for (const envVar of required) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (encryptionKey.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be 64 characters (32 bytes in hex)");
  }
  const encryptionPassword2 = process.env.ENCRYPTION_PASSWORD;
  if (encryptionPassword2.length < 8) {
    throw new Error("ENCRYPTION_PASSWORD must be at least 8 characters long");
  }
  const primaryEmails = (process.env.PRIMARY_AUTH_EMAILS || "").trim();
  const primaryPasswords = (process.env.PRIMARY_AUTH_PASSWORDS || "").trim();
  const primaryPasswordDirect = [
    process.env.PRIMARY_AUTH_PASSWORD_1,
    process.env.PRIMARY_AUTH_PASSWORD_2,
    process.env.PRIMARY_AUTH_PASSWORD_3,
    process.env.PRIMARY_AUTH_PASSWORD_4
  ].some((p) => String(p || "").trim());
  const primaryPasswordHashes = (process.env.PRIMARY_AUTH_PASSWORD_HASHES || "").trim();
  if (!primaryEmails || !primaryPasswords && !primaryPasswordDirect && !primaryPasswordHashes) {
    throw new Error("PRIMARY_AUTH_EMAILS and at least one PRIMARY_AUTH_PASSWORD (or hash) are required");
  }
  if (process.env.NODE_ENV === "production" && !process.env.DEFAULT_COUPLE_CODE?.trim()) {
    throw new Error("DEFAULT_COUPLE_CODE is required in production");
  }
  if (!/^postgres(ql)?:\/\//.test(String(process.env.DATABASE_URL || ""))) {
    throw new Error("DATABASE_URL must be a Neon postgresql:// connection string");
  }
  if (process.env.NODE_ENV === "production") {
    const allowedOrigins2 = (process.env.ALLOWED_ORIGINS || "").trim();
    const vercelHost = (process.env.VERCEL_URL || "").trim();
    if (!allowedOrigins2 && !vercelHost) {
      throw new Error(
        "ALLOWED_ORIGINS is required in production (or deploy on Vercel where VERCEL_URL is set automatically)"
      );
    }
  }
}
var suspiciousAgentPattern = /(bot|spider|crawler|scrapy|curl|wget|python-requests|httpclient|go-http-client|postmanruntime)/i;
function blockSuspiciousBots(req, res, next) {
  if (process.env.NODE_ENV !== "production") {
    next();
    return;
  }
  const userAgent = String(req.headers["user-agent"] || "");
  if (!userAgent || suspiciousAgentPattern.test(userAgent)) {
    res.status(403).json({ error: "Access denied" });
    return;
  }
  next();
}

// src/lib/validation.ts
function validateBody(schema) {
  return (req, res, next) => {
    const errors = [];
    for (const [field, validator] of Object.entries(schema)) {
      const value = req.body[field];
      const result = validator(value);
      if (result !== true) {
        errors.push(result || `${field} is invalid`);
      }
    }
    if (errors.length > 0) {
      res.status(400).json({ error: "Validation failed", details: errors });
      return;
    }
    next();
  };
}
var validators = {
  // String validators
  nonEmptyString: (value) => {
    if (typeof value !== "string") return "must be a string";
    if (value.trim().length === 0) return "cannot be empty";
    return true;
  },
  stringOfLength: (min, max) => (value) => {
    if (typeof value !== "string") return "must be a string";
    if (value.length < min) return `must be at least ${min} characters`;
    if (value.length > max) return `must be at most ${max} characters`;
    return true;
  },
  // Number validators
  positiveNumber: (value) => {
    if (typeof value !== "number") return "must be a number";
    if (value <= 0) return "must be positive";
    return true;
  },
  // Enum validators
  enum: (allowedValues) => (value) => {
    if (!allowedValues.includes(value)) return `must be one of: ${allowedValues.join(", ")}`;
    return true;
  },
  // Email validator
  email: (value) => {
    if (typeof value !== "string") return "must be a string";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "must be a valid email";
    return true;
  },
  // URL validator
  url: (value) => {
    if (typeof value !== "string") return "must be a string";
    try {
      new URL(value);
      return true;
    } catch {
      return "must be a valid URL";
    }
  },
  // UUID validator
  uuid: (value) => {
    if (typeof value !== "string") return "must be a string";
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) return "must be a valid UUID";
    return true;
  },
  // Safe UUID validator for route parameters (allows both UUID and simple IDs like "me", "wife")
  safeId: (value) => {
    if (typeof value !== "string") return "must be a string";
    const simpleIdRegex = /^[a-zA-Z0-9_-]+$/;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!simpleIdRegex.test(value) && !uuidRegex.test(value)) return "must be a valid ID";
    return true;
  }
};
function validateRouteParams(params) {
  return (req, res, next) => {
    const paramsToValidate = Object.keys(params).length > 0 ? params : req.params;
    for (const [paramName, validator] of Object.entries(paramsToValidate)) {
      const paramValue = req.params[paramName];
      if (!paramValue) {
        res.status(400).json({ error: `Missing required parameter: ${paramName}` });
        return;
      }
      const value = Array.isArray(paramValue) ? paramValue[0] : paramValue;
      const validatorType = typeof validator === "string" ? validator : "safeId";
      if (validatorType === "safeId") {
        const safeIdRegex = /^[a-zA-Z0-9_-]+$/;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!safeIdRegex.test(value) && !uuidRegex.test(value)) {
          res.status(400).json({ error: `Invalid parameter format: ${paramName}` });
          return;
        }
      } else if (validatorType === "uuid") {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) {
          res.status(400).json({ error: `Invalid UUID format: ${paramName}` });
          return;
        }
      }
    }
    next();
  };
}

// src/routes/health.ts
import { Router } from "express";
var router = Router();
router.get("/healthz", async (_req, res) => {
  const dbConnected = await pingDatabase();
  const authEmailsConfigured = (process.env.PRIMARY_AUTH_EMAILS || "").split(/[,;]/).map((s) => s.trim()).filter(Boolean).length;
  const hasPassword = [
    process.env.PRIMARY_AUTH_PASSWORD_1,
    process.env.PRIMARY_AUTH_PASSWORD_2,
    process.env.PRIMARY_AUTH_PASSWORD_3,
    process.env.PRIMARY_AUTH_PASSWORD_4
  ].some((p) => String(p || "").trim()) || Boolean((process.env.PRIMARY_AUTH_PASSWORDS || "").trim()) || Boolean((process.env.PRIMARY_AUTH_PASSWORD_HASHES || "").trim());
  const ok = dbConnected && isDbReady() && authEmailsConfigured > 0 && hasPassword;
  res.status(200).json({
    status: ok ? "ok" : "degraded",
    db: dbConnected && isDbReady(),
    authConfigured: authEmailsConfigured > 0 && hasPassword
  });
});
var health_default = router;

// src/routes/auth.ts
import { Router as Router2 } from "express";
import { createHash, randomBytes as randomBytes2, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";

// src/lib/avatar-url.ts
import { randomUUID } from "crypto";

// src/lib/storage.ts
import { Readable } from "node:stream";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v2 as cloudinary } from "cloudinary";
var cloudinaryUrl = process.env.CLOUDINARY_URL;
var b2KeyId = process.env.B2_KEY_ID;
var b2ApplicationKey = process.env.B2_APPLICATION_KEY;
var b2BucketName = process.env.B2_BUCKET_NAME || "grova-images";
var b2Endpoint = process.env.B2_ENDPOINT;
var useCloudinary = Boolean(cloudinaryUrl);
var useB2 = Boolean(b2KeyId && b2ApplicationKey && b2Endpoint);
if (!useCloudinary && !useB2) {
  throw new Error("FATAL: Storage not configured. Set CLOUDINARY_URL or B2_KEY_ID + B2_APPLICATION_KEY + B2_ENDPOINT in .env");
}
if (useCloudinary) {
  const match = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
  if (match) {
    cloudinary.config({
      cloud_name: match[3],
      api_key: match[1],
      api_secret: match[2],
      secure: true
    });
  }
}
if (useCloudinary && useB2) {
  console.info("[storage] Primary: Cloudinary, fallback: Backblaze B2");
} else if (useCloudinary) {
  console.info("[storage] Using Cloudinary for media uploads");
} else {
  console.info("[storage] Using Backblaze B2 for media uploads");
}
var s3Client = b2KeyId && b2ApplicationKey && b2Endpoint ? new S3Client({
  region: "us-east-1",
  endpoint: b2Endpoint,
  credentials: {
    accessKeyId: b2KeyId,
    secretAccessKey: b2ApplicationKey
  }
}) : null;
if (!useCloudinary && !s3Client) {
  throw new Error("FATAL: S3 client failed to initialize. Check B2 credentials in .env");
}
function cloudinaryResourceType(contentType) {
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("image/")) return "image";
  return "raw";
}
async function uploadToCloudinary(key, buffer, contentType) {
  const resourceType = cloudinaryResourceType(contentType);
  const publicId = `grova/${key.replace(/\.[^.]+$/, "")}`;
  const opts = {
    public_id: publicId,
    resource_type: resourceType,
    overwrite: true
  };
  if (resourceType === "video" || resourceType === "raw" || buffer.length > 512 * 1024) {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(opts, (err, result2) => {
        if (err) reject(err);
        else if (!result2?.secure_url) reject(new Error("Cloudinary upload returned no URL"));
        else resolve(result2.secure_url);
      });
      Readable.from(buffer).pipe(upload);
    });
  }
  const result = await cloudinary.uploader.upload(
    `data:${contentType};base64,${buffer.toString("base64")}`,
    opts
  );
  return result.secure_url;
}
async function uploadToB2(key, buffer, contentType) {
  if (!s3Client) {
    throw new Error("Backblaze B2 client not configured");
  }
  await s3Client.send(
    new PutObjectCommand({
      Bucket: b2BucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType
    })
  );
  return `${b2Endpoint}/${b2BucketName}/${key}`;
}
async function uploadMedia(key, buffer, contentType) {
  const attempts = [];
  if (useCloudinary) attempts.push(() => uploadToCloudinary(key, buffer, contentType));
  if (s3Client) attempts.push(() => uploadToB2(key, buffer, contentType));
  let lastError;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      console.warn("[storage] Upload attempt failed, trying fallback if available:", error);
    }
  }
  console.error("Failed to upload media (all backends):", lastError);
  throw new Error("Failed to upload media");
}
async function deleteImage(key) {
  if (useCloudinary) {
    const publicId = `grova/${key.replace(/\.[^.]+$/, "")}`;
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" }).catch(() => {
    });
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" }).catch(() => {
    });
    return;
  }
  if (!s3Client) {
    throw new Error("Backblaze B2 client not configured");
  }
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: b2BucketName,
      Key: key
    })
  );
}

// src/lib/avatar-url.ts
var FALLBACK = {
  me: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=150&h=150&fit=crop",
  wife: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&h=150&fit=crop"
};
async function persistAvatarIfNeeded(userId, avatar) {
  const s = typeof avatar === "string" ? avatar.trim() : "";
  if (!s) return FALLBACK[userId] ?? FALLBACK.me;
  if (s.startsWith("http://") || s.startsWith("https://")) {
    return s;
  }
  if (s.startsWith("data:")) {
    try {
      const base64 = s.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(base64, "base64");
      const key = `avatars/${userId}-${randomUUID()}.jpg`;
      const url = await uploadMedia(key, buffer, "image/jpeg");
      await db_default.execute("UPDATE profiles SET avatar = $1 WHERE id = $2", [url, userId]);
      return url;
    } catch (err) {
      console.error("[avatar] Failed to upload avatar:", err);
      return FALLBACK[userId] ?? FALLBACK.me;
    }
  }
  return s;
}
function sanitizeAvatarForClient(userId, avatar) {
  const fallback = FALLBACK[userId] ?? FALLBACK.me;
  const s = typeof avatar === "string" ? avatar.trim() : "";
  if (!s) return fallback;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return fallback;
}

// src/routes/auth.ts
var router2 = Router2();
router2.use((req, res, next) => {
  const ua = String(req.headers["user-agent"] || "").toLowerCase();
  if (!ua || ua.length < 8) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (/bot|crawler|spider|scrapy|headless|python-requests|curl\/|wget\/|semrush|ahrefs/i.test(ua)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
});
var PRIMARY_SESSION_MS = 30 * 24 * 60 * 60 * 1e3;
var SESSION_MS = 30 * 24 * 60 * 60 * 1e3;
var PRIMARY_SESSION_RENEW_MS = 30 * 24 * 60 * 60 * 1e3;
var PRIMARY_MAX_FAILED_ATTEMPTS = 2;
var PRIMARY_BLOCK_MS = 30 * 60 * 1e3;
var primaryLoginAttempts = /* @__PURE__ */ new Map();
var CODE_MAX_FAILED_ATTEMPTS = 10;
var CODE_BLOCK_MS = 30 * 60 * 1e3;
var coupleCodeAttempts = /* @__PURE__ */ new Map();
function cookieConfig(maxAge) {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "lax" : "strict",
    maxAge,
    path: "/"
  };
}
function setAuthCookies(res, data) {
  if (data.token) res.cookie("grova_token", data.token, cookieConfig(SESSION_MS));
  if (data.csrfToken) res.cookie("grova_csrf", data.csrfToken, cookieConfig(SESSION_MS));
  if (data.refreshToken) res.cookie("grova_refresh", data.refreshToken, cookieConfig(SESSION_MS));
  if (data.primaryToken) res.cookie("grova_primary", data.primaryToken, cookieConfig(PRIMARY_SESSION_MS));
}
function clearAuthCookies(res) {
  const opts = { path: "/" };
  res.clearCookie("grova_token", opts);
  res.clearCookie("grova_csrf", opts);
  res.clearCookie("grova_refresh", opts);
  res.clearCookie("grova_primary", opts);
}
function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
function listFromEnv(key) {
  return (process.env[key] || "").split(/[,;]/).map((s) => s.trim().replace(/^['"]|['"]$/g, "").toLowerCase()).filter(Boolean);
}
function getPrimaryPasswords() {
  const direct = [
    process.env.PRIMARY_AUTH_PASSWORD_1,
    process.env.PRIMARY_AUTH_PASSWORD_2,
    process.env.PRIMARY_AUTH_PASSWORD_3,
    process.env.PRIMARY_AUTH_PASSWORD_4
  ].map((s) => String(s || "").trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
  if (direct.length > 0) return direct;
  return (process.env.PRIMARY_AUTH_PASSWORDS || "").split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
}
function getPrimaryPasswordHashes() {
  return (process.env.PRIMARY_AUTH_PASSWORD_HASHES || "").split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
}
function safeEq(a, b) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}
function isAllowedPrimaryCredential(email, password) {
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
function primaryAttemptKey(req, email) {
  const ip = (typeof req.headers["x-forwarded-for"] === "string" ? req.headers["x-forwarded-for"].split(",")[0] : "") || (typeof req.headers["x-real-ip"] === "string" ? req.headers["x-real-ip"] : "") || req.socket.remoteAddress || "unknown";
  return `${ip.trim().toLowerCase()}::${email.trim().toLowerCase()}`;
}
function requestUserAgent(req) {
  return String(req.headers["user-agent"] || "Unknown");
}
function requestClientId(req) {
  return String(req.headers["x-client-id"] || "").trim();
}
function requestClientOrigin(req) {
  const fromHeader = String(req.headers["x-client-origin"] || "").trim();
  if (fromHeader) return fromHeader;
  const origin = req.headers.origin;
  return typeof origin === "string" ? origin.trim() : "";
}
async function validateAndRenewPrimaryToken(req, primaryToken) {
  const tokenHash = sha256(primaryToken);
  const now = Date.now();
  const clientId = requestClientId(req);
  const origin = requestClientOrigin(req);
  const userAgent = requestUserAgent(req);
  const result = await db_default.execute(
    "SELECT token_hash, client_id, origin, user_agent FROM primary_access_tokens WHERE token_hash = $1 AND expires_at > $2",
    [tokenHash, now]
  );
  if (result.rows.length === 0) return false;
  const row = result.rows[0];
  const storedClientId = String(row.client_id ?? "").trim();
  const storedOrigin = String(row.origin ?? "").trim();
  const storedUa = String(row.user_agent ?? "");
  if (storedClientId) {
    if (!clientId || clientId !== storedClientId) return false;
  } else if (storedUa !== userAgent) {
    return false;
  }
  if (storedOrigin && origin && storedOrigin !== origin) return false;
  await db_default.execute("UPDATE primary_access_tokens SET expires_at = $1 WHERE token_hash = $2", [
    now + PRIMARY_SESSION_RENEW_MS,
    tokenHash
  ]);
  return true;
}
async function clearExpiredPrimaryTokens() {
  await db_default.execute("DELETE FROM primary_access_tokens WHERE expires_at <= $1", [Date.now()]);
}
function bootstrapCodeFromEnv() {
  return String(process.env.DEFAULT_COUPLE_CODE || "").trim();
}
async function getEffectiveCoupleCode() {
  const codeResult = await db_default.execute("SELECT code FROM couple_code ORDER BY id LIMIT 1", []);
  const fromDb = String(codeResult.rows[0]?.code ?? "").trim();
  if (fromDb) return fromDb;
  const fromEnv = bootstrapCodeFromEnv();
  return fromEnv || null;
}
async function getProfileCode(profileId) {
  const codeResult = await db_default.execute("SELECT code FROM profile_codes WHERE profile_id = $1", [profileId]);
  const fromDb = String(codeResult.rows[0]?.code ?? "").trim();
  if (fromDb) return fromDb;
  return getEffectiveCoupleCode();
}
async function setProfileCode(profileId, newCode) {
  const trimmed = newCode.trim();
  await db_default.execute(
    `INSERT INTO profile_codes (profile_id, code) VALUES ($1, $2)
     ON CONFLICT (profile_id) DO UPDATE SET code = $2`,
    [profileId, trimmed]
  );
}
function codeAttemptKey(req, userId) {
  const ip = (typeof req.headers["x-forwarded-for"] === "string" ? req.headers["x-forwarded-for"].split(",")[0] : "") || (typeof req.headers["x-real-ip"] === "string" ? req.headers["x-real-ip"] : "") || req.socket.remoteAddress || "unknown";
  return `${ip.trim().toLowerCase()}::${userId.trim().toLowerCase()}`;
}
router2.get("/auth/profiles", rateLimiters.read, async (_req, res) => {
  try {
    const primaryFromCookie = _req && typeof _req.cookies?.grova_primary === "string" ? _req.cookies.grova_primary : "";
    const primaryToken = String(_req.headers["x-primary-token"] || primaryFromCookie || "");
    if (!await validateAndRenewPrimaryToken(_req, primaryToken)) {
      res.status(401).json({ error: "Primary authentication required" });
      return;
    }
    const defaults = [
      { id: "me", username: "mustaq", name: "Mustaq", bio: "Just us two \u2665", avatar: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=150&h=150&fit=crop" },
      { id: "wife", username: "sara", name: "Sara", bio: "My person \u2665", avatar: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&h=150&fit=crop" }
    ];
    for (const profile of defaults) {
      try {
        const existsResult = await db_default.execute(
          "SELECT id FROM profiles WHERE id = $1",
          [profile.id]
        );
        if (existsResult.rows.length === 0) {
          await db_default.execute(
            "INSERT INTO profiles (id, username, name, bio, avatar) VALUES ($1, $2, $3, $4, $5)",
            [profile.id, profile.username, profile.name, profile.bio, profile.avatar]
          );
        }
      } catch {
      }
    }
    const result = await db_default.execute(
      "SELECT id, name, avatar FROM profiles WHERE id IN ('me', 'wife')",
      []
    );
    const rows = result.rows;
    const merged = await Promise.all(
      defaults.map(async (d) => {
        const row = rows.find((r) => r.id === d.id);
        return row ? { id: row.id, name: row.name, avatar: sanitizeAvatarForClient(row.id, row.avatar) } : d;
      })
    );
    res.json(merged);
  } catch {
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
});
async function profileToUser(row, userId) {
  return {
    id: userId,
    username: String(row.username ?? (userId === "me" ? "mustaq" : "sara")),
    name: String(row.name ?? ""),
    bio: String(row.bio ?? ""),
    avatar: sanitizeAvatarForClient(userId, row.avatar)
  };
}
router2.get("/auth/session", rateLimiters.read, async (req, res) => {
  const authHeader = req.headers.authorization;
  const cookieToken = req && typeof req.cookies?.grova_token === "string" ? req.cookies.grova_token : null;
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
    const profileResult = await db_default.execute("SELECT * FROM profiles WHERE id = $1", [session.userId]);
    const meRow = profileResult.rows[0];
    if (!meRow) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    const partnerId = session.userId === "me" ? "wife" : "me";
    const partnerResult = await db_default.execute("SELECT * FROM profiles WHERE id = $1", [partnerId]);
    const partnerRow = partnerResult.rows[0];
    res.json({
      user: await profileToUser(meRow, session.userId),
      partner: partnerRow ? await profileToUser(partnerRow, partnerId) : null
    });
  } catch {
    res.status(500).json({ error: "Failed to restore session" });
  }
});
router2.post("/auth/login", validateBody({
  userId: validators.nonEmptyString,
  code: validators.stringOfLength(4, 50)
}), async (req, res) => {
  const { userId, code } = req.body;
  const primaryFromCookie = req && typeof req.cookies?.grova_primary === "string" ? req.cookies.grova_primary : "";
  const primaryToken = String(req.headers["x-primary-token"] || primaryFromCookie || "");
  try {
    if (!await validateAndRenewPrimaryToken(req, primaryToken)) {
      res.status(401).json({ error: "Primary authentication required" });
      return;
    }
    const codeKey = codeAttemptKey(req, userId);
    const codeState = coupleCodeAttempts.get(codeKey);
    if (codeState && codeState.blockedUntil > Date.now()) {
      res.status(429).json({
        error: "Too many wrong code attempts. Try again later.",
        retryAfterMs: codeState.blockedUntil - Date.now(),
        attemptsRemaining: 0
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
          attemptsRemaining: 0
        });
        return;
      }
      coupleCodeAttempts.set(codeKey, { count: nextCount, blockedUntil: 0 });
      res.status(401).json({ error: "Invalid code", attemptsRemaining: CODE_MAX_FAILED_ATTEMPTS - nextCount });
      return;
    }
    coupleCodeAttempts.delete(codeKey);
    const encryptionKey = await getEffectiveCoupleCode() || storedCode;
    const profileResult = await db_default.execute("SELECT * FROM profiles WHERE id = $1", [userId]);
    const p = profileResult.rows[0];
    if (!p) {
      const defaultProfile = userId === "me" ? { id: "me", username: "mustaq", name: "Mustaq", bio: "Just us two \u2665", avatar: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=150&h=150&fit=crop" } : { id: "wife", username: "sara", name: "Sara", bio: "My person \u2665", avatar: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&h=150&fit=crop" };
      await db_default.execute(
        `INSERT INTO profiles (id, username, name, bio, avatar) VALUES ($1, $2, $3, $4, $5)`,
        [defaultProfile.id, defaultProfile.username, defaultProfile.name, defaultProfile.bio, defaultProfile.avatar]
      );
      const newProfileResult = await db_default.execute("SELECT * FROM profiles WHERE id = $1", [userId]);
      const newP = newProfileResult.rows[0];
      if (!newP) {
        res.status(500).json({ error: "Failed to create user" });
        return;
      }
      const userAgent2 = req.headers["user-agent"] || "Unknown";
      const ip2 = req.headers["x-forwarded-for"]?.split(",")[0] || req.headers["x-real-ip"] || req.socket.remoteAddress || "Unknown";
      const { token: token2, csrfToken: csrfToken2, refreshToken: refreshToken2, deviceId: deviceId2 } = await createSession(userId, userId === "me" ? "mustaq" : "sara", userAgent2, ip2);
      setAuthCookies(res, {
        token: token2,
        csrfToken: csrfToken2,
        refreshToken: refreshToken2
      });
      res.json({
        token: token2,
        csrfToken: csrfToken2,
        refreshToken: refreshToken2,
        deviceId: deviceId2,
        encryptionKey,
        user: {
          id: userId,
          username: userId === "me" ? "mustaq" : "sara",
          name: newP.name,
          bio: newP.bio,
          avatar: await persistAvatarIfNeeded(userId, newP.avatar)
        }
      });
      return;
    }
    const userAgent = req.headers["user-agent"] || "Unknown";
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.headers["x-real-ip"] || req.socket.remoteAddress || "Unknown";
    const { token, csrfToken, refreshToken, deviceId } = await createSession(userId, userId === "me" ? "mustaq" : "sara", userAgent, ip);
    setAuthCookies(res, {
      token,
      csrfToken,
      refreshToken
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
        avatar: await persistAvatarIfNeeded(userId, p.avatar)
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});
router2.post("/auth/logout", authenticate, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const tokenFromCookie = req && typeof req.cookies?.grova_token === "string" ? req.cookies.grova_token : void 0;
    const token = authHeader?.substring(7) || tokenFromCookie;
    const primaryFromCookie = req && typeof req.cookies?.grova_primary === "string" ? req.cookies.grova_primary : "";
    const primaryToken = String(req.headers["x-primary-token"] || primaryFromCookie || "");
    if (token) {
      destroySession(token);
    }
    clearAuthCookies(res);
    if (primaryToken) {
      setAuthCookies(res, {
        primaryToken
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Logout failed" });
  }
});
router2.post("/auth/primary-login", rateLimiters.auth, validateBody({
  email: validators.nonEmptyString,
  password: validators.nonEmptyString
}), async (req, res) => {
  const { email, password, clientId, origin } = req.body;
  try {
    await clearExpiredPrimaryTokens();
    const attemptKey = primaryAttemptKey(req, email);
    const attemptState = primaryLoginAttempts.get(attemptKey);
    if (attemptState && attemptState.blockedUntil > Date.now()) {
      res.status(429).json({
        error: "Too many failed attempts. Try again later.",
        retryAfterMs: attemptState.blockedUntil - Date.now(),
        attemptsRemaining: 0
      });
      return;
    }
    if (!isAllowedPrimaryCredential(email, password)) {
      const nextCount = (attemptState?.count || 0) + 1;
      if (nextCount >= PRIMARY_MAX_FAILED_ATTEMPTS) {
        primaryLoginAttempts.set(attemptKey, {
          count: nextCount,
          blockedUntil: Date.now() + PRIMARY_BLOCK_MS
        });
        res.status(429).json({
          error: "Too many failed attempts. Try again later.",
          retryAfterMs: PRIMARY_BLOCK_MS,
          attemptsRemaining: 0
        });
        return;
      }
      primaryLoginAttempts.set(attemptKey, { count: nextCount, blockedUntil: 0 });
      res.status(401).json({ error: "Invalid email or password", attemptsRemaining: PRIMARY_MAX_FAILED_ATTEMPTS - nextCount });
      return;
    }
    primaryLoginAttempts.delete(attemptKey);
    const primaryToken = randomBytes2(32).toString("hex");
    const tokenHash = sha256(primaryToken);
    const now = Date.now();
    const userAgent = String(req.headers["user-agent"] || "Unknown");
    const trustedClientId = String(clientId || requestClientId(req)).trim();
    const trustedOrigin = String(origin || requestClientOrigin(req)).trim();
    await db_default.execute(
      "INSERT INTO primary_access_tokens (token_hash, email, user_agent, client_id, origin, created_at, expires_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [tokenHash, email.toLowerCase(), userAgent, trustedClientId, trustedOrigin, now, now + PRIMARY_SESSION_MS]
    );
    setAuthCookies(res, {
      primaryToken
    });
    res.json({ ok: true, expiresAt: now + PRIMARY_SESSION_MS });
  } catch (err) {
    console.error("[auth] primary-login failed:", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (/connect|database|postgres|neon|timeout|ECONNREFUSED/i.test(msg)) {
      res.status(503).json({ error: "Database unavailable. Check DATABASE_URL on Vercel and redeploy." });
      return;
    }
    res.status(500).json({ error: "Primary login failed" });
  }
});
router2.post("/auth/revoke-trust", rateLimiters.auth, async (req, res) => {
  try {
    const primaryFromCookie = req && typeof req.cookies?.grova_primary === "string" ? req.cookies.grova_primary : "";
    const primaryToken = String(req.headers["x-primary-token"] || primaryFromCookie || "");
    if (primaryToken) {
      const tokenHash = sha256(primaryToken);
      await db_default.execute("DELETE FROM primary_access_tokens WHERE token_hash = $1", [tokenHash]);
    }
    res.clearCookie("grova_primary", { path: "/" });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to revoke trust" });
  }
});
router2.get("/auth/primary-session", async (req, res) => {
  try {
    const primaryFromCookie = req && typeof req.cookies?.grova_primary === "string" ? req.cookies.grova_primary : "";
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
    res.json({ ok: true, expiresInDays: 30, sessionMs: PRIMARY_SESSION_MS });
  } catch {
    res.status(500).json({ error: "Failed to validate primary session" });
  }
});
router2.post("/auth/unlock", authenticate, validateBody({
  code: validators.stringOfLength(4, 50)
}), async (req, res) => {
  const { code } = req.body;
  try {
    const userId = req.user.id;
    const codeKey = codeAttemptKey(req, userId);
    const codeState = coupleCodeAttempts.get(codeKey);
    if (codeState && codeState.blockedUntil > Date.now()) {
      res.status(429).json({
        error: "Too many wrong code attempts. Try again later.",
        retryAfterMs: codeState.blockedUntil - Date.now(),
        attemptsRemaining: 0
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
          attemptsRemaining: 0
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
router2.put("/auth/couple-code", authenticate, validateBody({
  newCode: validators.stringOfLength(4, 50),
  currentCode: validators.stringOfLength(4, 50)
}), async (req, res) => {
  const { newCode, currentCode } = req.body;
  try {
    const profileId = req.user.id;
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
router2.post("/auth/refresh", rateLimiters.auth, async (req, res) => {
  try {
    const refreshFromCookie = req && typeof req.cookies?.grova_refresh === "string" ? req.cookies.grova_refresh : void 0;
    const { refreshToken: refreshFromBody } = req.body;
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
    setAuthCookies(res, {
      token: newTokens.token,
      csrfToken: newTokens.csrfToken,
      refreshToken: newTokens.refreshToken
    });
    res.json({
      token: newTokens.token,
      csrfToken: newTokens.csrfToken,
      refreshToken: newTokens.refreshToken
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to refresh token" });
  }
});
router2.get("/auth/devices", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const devices = await getUserDevices(userId);
    res.json({ devices });
  } catch (err) {
    res.status(500).json({ error: "Failed to get devices" });
  }
});
router2.delete("/auth/devices/:deviceId", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
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
var auth_default = router2;

// src/routes/messages.ts
import { Router as Router3 } from "express";
import { randomUUID as randomUUID3 } from "crypto";

// src/lib/sse.ts
var clients = /* @__PURE__ */ new Map();
function addClient(id, res, userId) {
  clients.set(id, { res, userId });
  res.on("close", () => {
    removeClient(id);
  });
}
function removeClient(id) {
  clients.delete(id);
}
function broadcast(event, data, targetUserId) {
  const chunk = `event: ${event}
data: ${JSON.stringify(data)}

`;
  for (const [id, client] of clients.entries()) {
    try {
      if (targetUserId && client.userId !== targetUserId) {
        continue;
      }
      client.res.write(chunk);
    } catch {
      clients.delete(id);
    }
  }
}

// src/lib/activity-feed.ts
import { randomUUID as randomUUID2 } from "crypto";
async function postCoupleActivity(type, actorId, fromName, text) {
  const id = randomUUID2();
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  await db_default.execute(
    "INSERT INTO activity_feed (id, type, actor_id, from_name, text, timestamp, read) VALUES ($1, $2, $3, $4, $5, $6, 0)",
    [id, type, actorId, fromName, text, timestamp]
  );
  broadcast("activity-added", { id, type, actorId, fromName, text, timestamp, read: false });
}
async function profileDisplayName(userId) {
  const result = await db_default.execute("SELECT name FROM profiles WHERE id = $1", [userId]);
  const row = result.rows[0];
  return row?.name || userId;
}

// src/lib/encryption.ts
import crypto from "crypto";
var ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
var ENCRYPTION_PASSWORD = process.env.ENCRYPTION_PASSWORD;
var ALGORITHM = "aes-256-gcm";
var currentKeyVersion = 1;
var keyVersions = /* @__PURE__ */ new Map();
var isAuthenticated = false;
if (ENCRYPTION_KEY) {
  keyVersions.set(1, {
    version: 1,
    key: ENCRYPTION_KEY,
    createdAt: /* @__PURE__ */ new Date()
  });
}
if (!ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY environment variable is required");
}
if (ENCRYPTION_KEY.length !== 64) {
  throw new Error("ENCRYPTION_KEY must be 64 characters (32 bytes in hex)");
}
if (!ENCRYPTION_PASSWORD) {
  throw new Error("ENCRYPTION_PASSWORD environment variable is required to access encryption key");
}
var REQUIRED_ENCRYPTION_PASSWORD = ENCRYPTION_PASSWORD;
function getKey(version) {
  const keyVersion = version || currentKeyVersion;
  const keyData = keyVersions.get(keyVersion);
  if (!keyData) {
    throw new Error(`Key version ${keyVersion} not found`);
  }
  return Buffer.from(keyData.key, "hex");
}
function authenticateEncryption(password) {
  const passwordHash = crypto.createHash("sha256").update(password).digest("hex");
  const storedPasswordHash = crypto.createHash("sha256").update(REQUIRED_ENCRYPTION_PASSWORD).digest("hex");
  if (passwordHash === storedPasswordHash) {
    isAuthenticated = true;
    console.log("[encryption] \u2705 Encryption access granted");
    return true;
  }
  isAuthenticated = false;
  console.error("[encryption] \u274C Authentication failed - incorrect password");
  return false;
}
function checkAuthentication() {
  if (!isAuthenticated) {
    throw new Error("\u{1F512} Encryption access denied. Must authenticate with password first. Call authenticateEncryption(password)");
  }
}
function encrypt(text, version) {
  checkAuthentication();
  const key = getKey(version);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  const keyVersion = version || currentKeyVersion;
  return `${keyVersion}:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}
function decrypt(encryptedText) {
  checkAuthentication();
  if (!encryptedText) {
    return "";
  }
  const parts = encryptedText.split(":");
  if (parts.length === 3) {
    const key = getKey();
    try {
      const iv = Buffer.from(parts[0], "hex");
      const authTag = Buffer.from(parts[1], "hex");
      const encrypted = parts[2];
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (err) {
      console.error("Decryption failed, returning original text:", err);
      return encryptedText;
    }
  }
  if (parts.length === 4) {
    const version = parseInt(parts[0], 10);
    try {
      const key = getKey(version);
      const iv = Buffer.from(parts[1], "hex");
      const authTag = Buffer.from(parts[2], "hex");
      const encrypted = parts[3];
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (err) {
      console.error("Decryption failed, returning original text:", err);
      return encryptedText;
    }
  }
  return encryptedText;
}

// src/lib/message-storage.ts
var CIPHER_RE = /^(?:\d+:)?[0-9a-f]{16,}:[0-9a-f]{16,}:[0-9a-f]+$/i;
function isEncryptedPayload(value) {
  return CIPHER_RE.test(value);
}
function encryptStoredField(value) {
  if (!value) return null;
  if (isEncryptedPayload(value)) return value;
  return encrypt(value);
}
function decryptStoredField(value) {
  if (value == null || value === "") return void 0;
  const s = String(value);
  if (!isEncryptedPayload(s)) return s;
  return decrypt(s);
}

// src/lib/chat-clear.ts
async function getChatClearedAtForUser(userId) {
  const result = await db_default.execute("SELECT cleared_at FROM chat_clear_state WHERE user_id = $1", [userId]);
  const row = result.rows[0];
  return row?.cleared_at ? String(row.cleared_at) : null;
}
async function setChatClearedForUser(userId, clearedAt) {
  await db_default.execute(
    `INSERT INTO chat_clear_state (user_id, cleared_at) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET cleared_at = EXCLUDED.cleared_at`,
    [userId, clearedAt]
  );
}

// src/routes/messages.ts
var router3 = Router3();
function parseMediaViewMode(companionSticker) {
  if (companionSticker === "__vm:once") return "once";
  if (companionSticker === "__vm:twice") return "twice";
  return "keep";
}
function rowToMessage(row) {
  const partnerRead = row.partner_read_at ? String(row.partner_read_at) : void 0;
  let location;
  if (row.location) {
    try {
      location = JSON.parse(String(row.location));
    } catch {
      location = void 0;
    }
  }
  const mediaViewMode = parseMediaViewMode(row.companion_sticker ? String(row.companion_sticker) : void 0);
  const mediaOpenCount = Number(row.viewer_media_open_count || 0);
  const mediaOpenedAt = row.partner_media_opened_at ? String(row.partner_media_opened_at) : void 0;
  return {
    id: String(row.id),
    senderId: String(row.sender_id),
    text: row.text ? decryptStoredField(row.text) : void 0,
    type: row.type,
    audioData: decryptStoredField(row.audio_data),
    gifUrl: row.gif_url ? String(row.gif_url) : void 0,
    imageData: decryptStoredField(row.image_data),
    imageUrl: row.image_url ? String(row.image_url) : void 0,
    fileData: decryptStoredField(row.file_data),
    fileType: row.file_type ? String(row.file_type) : void 0,
    fileSize: row.file_size ? Number(row.file_size) : void 0,
    location,
    timestamp: String(row.timestamp),
    liked: row.liked === 1 || row.liked === true,
    deleted: row.deleted === 1 || row.deleted === true,
    deletedAt: row.deleted_at ? String(row.deleted_at) : void 0,
    variant: row.variant === "cute" || row.variant === "default" ? row.variant : void 0,
    companionSticker: row.companion_sticker ? String(row.companion_sticker) : void 0,
    reaction: row.reaction ? String(row.reaction) : void 0,
    threadId: row.thread_id ? String(row.thread_id) : void 0,
    threadParentId: row.thread_parent_id ? String(row.thread_parent_id) : void 0,
    threadReplyCount: row.thread_reply_count ? Number(row.thread_reply_count) : void 0,
    mediaViewMode,
    mediaOpenCount,
    mediaOpenedAt,
    readAt: partnerRead,
    seenByPartner: Boolean(partnerRead)
  };
}
router3.get("/messages", optionalAuth, async (req, res) => {
  try {
    const authenticatedUserId = req.user?.id ?? "me";
    const partnerId = authenticatedUserId === "me" ? "wife" : "me";
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;
    const cursor = req.query.cursor;
    const chatClearedAt = await getChatClearedAtForUser(authenticatedUserId);
    let query = `
      SELECT m.*,
             (SELECT emoji FROM message_reactions WHERE message_id = m.id ORDER BY timestamp DESC LIMIT 1) as reaction,
             (SELECT read_at FROM message_read_receipts WHERE message_id = m.id AND user_id = ? LIMIT 1) as partner_read_at,
             (SELECT COUNT(*) FROM message_media_opens WHERE message_id = m.id AND user_id = ?) as viewer_media_open_count,
             (SELECT MAX(opened_at) FROM message_media_opens WHERE message_id = m.id AND user_id = ?) as partner_media_opened_at
      FROM messages m
      WHERE m.deleted = 0 AND (m.sender_id = ? OR m.sender_id = ?)
    `;
    const params = [partnerId, authenticatedUserId, partnerId, authenticatedUserId, partnerId];
    if (chatClearedAt) {
      query += " AND m.timestamp > ?";
      params.push(chatClearedAt);
    }
    if (cursor) {
      query += " AND m.timestamp < ?";
      params.push(cursor);
    }
    query += " ORDER BY m.timestamp DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);
    const result = await db_default.query(query, params);
    console.log("Database query result:", result.rows.length, "messages found");
    const messages = result.rows.map(rowToMessage).reverse();
    let countSql = "SELECT COUNT(*) as total FROM messages WHERE deleted = 0 AND (sender_id = ? OR sender_id = ?)";
    const countParams = [authenticatedUserId, partnerId];
    if (chatClearedAt) {
      countSql += " AND timestamp > ?";
      countParams.push(chatClearedAt);
    }
    const countResult = await db_default.query(countSql, countParams);
    const total = Number(countResult.rows[0]?.total || 0);
    res.json({
      messages,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
        nextCursor: messages.length > 0 ? messages[messages.length - 1].timestamp : null
      }
    });
  } catch (err) {
    console.error("Failed to fetch messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});
router3.get("/messages/unread-count", authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const partnerId = authenticatedUserId === "me" ? "wife" : "me";
    const chatClearedAt = await getChatClearedAtForUser(authenticatedUserId);
    const sinceRaw = typeof req.query.since === "string" ? req.query.since : void 0;
    const sinceOpened = sinceRaw && !Number.isNaN(new Date(sinceRaw).getTime()) ? sinceRaw : void 0;
    let effectiveSince = chatClearedAt;
    if (sinceOpened) {
      if (!effectiveSince || sinceOpened > effectiveSince) {
        effectiveSince = sinceOpened;
      }
    }
    let sql = `
      SELECT COUNT(*) AS count
      FROM messages m
      WHERE m.deleted = 0
        AND m.sender_id = ?
        AND NOT EXISTS (
          SELECT 1 FROM message_read_receipts r
          WHERE r.message_id = m.id AND r.user_id = ?
        )
    `;
    const params = [partnerId, authenticatedUserId];
    if (effectiveSince) {
      sql += " AND m.timestamp > ?";
      params.push(effectiveSince);
    }
    const result = await db_default.query(sql, params);
    const row = result.rows[0];
    const count = Number(row?.count ?? 0);
    res.json({ count: Number.isFinite(count) ? count : 0 });
  } catch (err) {
    console.error("Failed to fetch unread chat count:", err);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
});
router3.post("/messages", authenticate, validateBody({
  senderId: validators.nonEmptyString,
  type: validators.enum(["text", "audio", "heart", "sticker", "gif", "image", "video", "file", "location"])
}), async (req, res) => {
  const body = req.body;
  const authenticatedUserId = req.user.id;
  let { senderId, text, type, audioData, gifUrl, imageData, imageUrl, fileData, fileType, fileSize, location, variant, companionSticker } = body;
  if (senderId !== authenticatedUserId) {
    senderId = authenticatedUserId;
  }
  if (text && text.length > 1e4) {
    res.status(400).json({ error: "text is too long (max 10000 characters)" });
    return;
  }
  if (audioData && audioData.length > 1e7) {
    res.status(400).json({ error: "audio data is too large (max 10MB)" });
    return;
  }
  if (imageData && imageData.length > 1e7) {
    res.status(400).json({ error: "image data is too large (max 10MB)" });
    return;
  }
  if (fileData && fileData.length > 28e6) {
    res.status(400).json({ error: "file data is too large (max 20MB)" });
    return;
  }
  const id = randomUUID3();
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const encryptedText = encryptStoredField(text ?? void 0);
  const encryptedAudio = encryptStoredField(audioData);
  const encryptedImage = encryptStoredField(imageData);
  const encryptedFile = encryptStoredField(fileData);
  const locationJson = location ? JSON.stringify(location) : null;
  try {
    await db_default.execute(
      `INSERT INTO messages (id, sender_id, text, type, audio_data, gif_url, image_data, image_url, file_data, file_type, file_size, location, timestamp, liked, deleted, variant, companion_sticker)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        senderId,
        encryptedText ?? null,
        type || "text",
        encryptedAudio ?? null,
        gifUrl ?? null,
        encryptedImage ?? null,
        imageUrl ?? null,
        encryptedFile ?? null,
        fileType ?? null,
        fileSize ?? null,
        locationJson,
        timestamp,
        0,
        0,
        variant ?? "default",
        companionSticker ?? null
      ]
    );
    const msg = {
      id,
      senderId,
      text,
      type: type || "text",
      audioData,
      gifUrl,
      imageData,
      imageUrl,
      fileData,
      fileType,
      fileSize,
      location,
      timestamp,
      liked: false,
      variant: variant ?? "default",
      companionSticker
    };
    const partnerId = senderId === "me" ? "wife" : "me";
    broadcast("new-message", msg, partnerId);
    const fromName = await profileDisplayName(senderId);
    if (companionSticker === "\u{1F932}") {
      await postCoupleActivity("dua", senderId, fromName, "shared a dua with you \u{1F932}").catch(() => {
      });
    } else if (type === "location") {
      await postCoupleActivity("location", senderId, fromName, "shared their location").catch(() => {
      });
    } else if (type === "text" && text && /^📞 (Audio|Video) call (started|ended)/.test(text)) {
      const snippet = text.includes("ended") ? "ended a call" : "started a call";
      await postCoupleActivity("call", senderId, fromName, snippet).catch(() => {
      });
    }
    res.json(msg);
  } catch (err) {
    console.error("Failed to create message:", err);
    res.status(500).json({ error: "Failed to create message" });
  }
});
router3.post("/messages/:id/open-media", authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const partnerId = authenticatedUserId === "me" ? "wife" : "me";
    const messageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await db_default.query(
      `SELECT m.*,
              (SELECT COUNT(*) FROM message_media_opens WHERE message_id = m.id AND user_id = ?) as viewer_media_open_count
       FROM messages m
       WHERE m.id = ?`,
      [authenticatedUserId, messageId]
    );
    const row = result.rows[0];
    if (!row || row.deleted === 1 || row.deleted === true) {
      res.status(404).json({ error: "Message not found" });
      return;
    }
    const senderId = String(row.sender_id);
    if (senderId !== authenticatedUserId && senderId !== partnerId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const viewMode = parseMediaViewMode(row.companion_sticker ? String(row.companion_sticker) : void 0);
    const limit = viewMode === "once" ? 1 : viewMode === "twice" ? 2 : 0;
    const currentCount = Number(row.viewer_media_open_count || 0);
    const mediaUrl = (row.type === "image" ? row.image_url ? String(row.image_url) : decryptStoredField(row.image_data) : void 0) || (row.type === "video" ? decryptStoredField(row.file_data) : void 0);
    if (!mediaUrl || row.type !== "image" && row.type !== "video") {
      res.status(400).json({ error: "Message does not contain viewable media" });
      return;
    }
    let newCount = currentCount;
    let openedAt;
    if (limit > 0 && senderId !== authenticatedUserId) {
      if (currentCount >= limit) {
        res.status(410).json({ error: "Media no longer available" });
        return;
      }
      openedAt = (/* @__PURE__ */ new Date()).toISOString();
      await db_default.execute(
        "INSERT INTO message_media_opens (id, message_id, user_id, opened_at) VALUES (?, ?, ?, ?)",
        [randomUUID3(), messageId, authenticatedUserId, openedAt]
      );
      newCount = currentCount + 1;
      broadcast("message-media-opened", { messageId, userId: authenticatedUserId, mediaOpenCount: newCount, mediaOpenedAt: openedAt });
    }
    res.json({ ok: true, url: mediaUrl, kind: row.type === "video" ? "video" : "image", mediaOpenCount: newCount, mediaOpenedAt: openedAt });
  } catch (err) {
    console.error("Failed to open media message:", err);
    res.status(500).json({ error: "Failed to open media" });
  }
});
router3.patch("/messages/:id/like", authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const partnerId = authenticatedUserId === "me" ? "wife" : "me";
    const messageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await db_default.query(`
      SELECT m.*,
             (SELECT emoji FROM message_reactions WHERE message_id = m.id ORDER BY timestamp DESC LIMIT 1) as reaction
      FROM messages m
      WHERE m.id = ?
    `, [messageId]);
    const row = result.rows[0];
    if (!row || row.deleted === 1) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (row.sender_id !== authenticatedUserId && row.sender_id !== partnerId) {
      res.status(403).json({ error: "Forbidden: Can only like messages from you or your partner" });
      return;
    }
    const newLiked = row.liked === 1 || row.liked === true ? 0 : 1;
    await db_default.execute("UPDATE messages SET liked = ? WHERE id = ?", [newLiked, messageId]);
    const msg = rowToMessage(row);
    msg.liked = newLiked === 1;
    broadcast("message-liked", { ...msg, likedBy: authenticatedUserId }, String(row.sender_id));
    res.json({ ...msg, likedBy: authenticatedUserId });
  } catch (err) {
    res.status(500).json({ error: "Failed to like message" });
  }
});
router3.patch("/messages/:id/edit", authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user?.id;
    if (!authenticatedUserId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { text, userId } = req.body;
    if (!text || text.trim().length === 0) {
      res.status(400).json({ error: "Text is required" });
      return;
    }
    const messageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await db_default.query(`
      SELECT m.*,
             (SELECT emoji FROM message_reactions WHERE message_id = m.id ORDER BY timestamp DESC LIMIT 1) as reaction
      FROM messages m
      WHERE m.id = ?
    `, [messageId]);
    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (row.sender_id !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only edit your own messages" });
      return;
    }
    if (row.type !== "text") {
      res.status(400).json({ error: "Can only edit text messages" });
      return;
    }
    const encryptedText = encryptStoredField(text.trim());
    await db_default.execute(
      "UPDATE messages SET text = ? WHERE id = ?",
      [encryptedText, messageId]
    );
    const msg = rowToMessage(row);
    msg.text = text.trim();
    broadcast("message-edited", msg);
    res.json({ success: true, text: text.trim() });
  } catch (err) {
    console.error("Failed to edit message:", err);
    res.status(500).json({ error: "Failed to edit message" });
  }
});
router3.delete("/messages/:id", authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const messageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await db_default.query(`
      SELECT m.*,
             (SELECT emoji FROM message_reactions WHERE message_id = m.id ORDER BY timestamp DESC LIMIT 1) as reaction
      FROM messages m
      WHERE m.id = ?
    `, [messageId]);
    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: "Message not found" });
      return;
    }
    if (String(row.sender_id) !== authenticatedUserId) {
      res.status(403).json({ error: "You can only unsend your own messages" });
      return;
    }
    const alreadyDeleted = row.deleted === 1 || row.deleted === true;
    const deletedAt = row.deleted_at ? String(row.deleted_at) : (/* @__PURE__ */ new Date()).toISOString();
    if (!alreadyDeleted) {
      try {
        await db_default.execute(
          "UPDATE messages SET deleted = 1, deleted_at = ?, text = NULL, audio_data = NULL, gif_url = NULL, image_data = NULL, image_url = NULL, file_data = NULL, location = NULL WHERE id = ?",
          [deletedAt, messageId]
        );
      } catch (updateErr) {
        console.error("Full message delete update failed, retrying minimal:", updateErr);
        await db_default.execute(
          "UPDATE messages SET deleted = 1, deleted_at = ? WHERE id = ?",
          [deletedAt, messageId]
        );
      }
    }
    const msg = rowToMessage(row);
    msg.text = void 0;
    msg.audioData = void 0;
    msg.gifUrl = void 0;
    msg.imageData = void 0;
    msg.imageUrl = void 0;
    msg.fileData = void 0;
    msg.location = void 0;
    msg.deleted = true;
    msg.deletedAt = deletedAt;
    broadcast("message-deleted", msg);
    res.json(msg);
  } catch (err) {
    console.error("Failed to delete message:", err);
    res.status(500).json({ error: "Failed to delete message" });
  }
});
var messages_default = router3;

// src/routes/duas.ts
import { Router as Router4 } from "express";
import { randomUUID as randomUUID4 } from "crypto";
var router4 = Router4();
router4.get("/duas", rateLimiters.read, authenticate, async (_req, res) => {
  try {
    const result = await db_default.execute("SELECT * FROM duas ORDER BY timestamp DESC");
    const duas = result.rows.map((row) => ({
      id: row.id,
      arabic: row.arabic,
      translation: row.translation,
      author: row.author,
      timestamp: row.timestamp
    }));
    res.json(duas);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch duas" });
  }
});
router4.post("/duas", rateLimiters.messages, authenticate, async (req, res) => {
  const { arabic, translation, author } = req.body;
  if (!arabic || !author) {
    res.status(400).json({ error: "arabic and author required" });
    return;
  }
  const id = randomUUID4();
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  try {
    await db_default.execute(
      "INSERT INTO duas (id, arabic, translation, author, timestamp) VALUES ($1, $2, $3, $4, $5)",
      [id, arabic, translation || "", author, timestamp]
    );
    const dua = {
      id,
      arabic,
      translation: translation || "",
      author,
      timestamp
    };
    broadcast("dua-added", dua);
    await postCoupleActivity("dua", author, await profileDisplayName(author), "added a new dua").catch(() => {
    });
    res.json(dua);
  } catch (err) {
    res.status(500).json({ error: "Failed to create dua" });
  }
});
router4.delete("/duas/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const authenticatedUserId = req.user?.id;
  const id = String(req.params.id);
  try {
    const existing = await db_default.execute("SELECT author FROM duas WHERE id = $1", [id]);
    const row = existing.rows[0];
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (row.author !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only delete your own duas" });
      return;
    }
    await db_default.execute("DELETE FROM duas WHERE id = $1", [id]);
    broadcast("dua-deleted", { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete dua" });
  }
});
var duas_default = router4;

// src/routes/events.ts
import { Router as Router5 } from "express";
var router5 = Router5();
router5.get("/sse", (req, res) => {
  if (process.env.VERCEL) {
    res.status(200).json({ mode: "poll", pollIntervalMs: 12e3 });
    return;
  }
  const q = req.query.userId;
  const fromQuery = typeof q === "string" ? q : Array.isArray(q) ? q[0] : void 0;
  const userId = fromQuery === "wife" || fromQuery === "me" ? fromQuery : "anon";
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  const clientId = `${userId}-${Date.now()}`;
  addClient(clientId, res, userId);
  const hb = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {
      clearInterval(hb);
    }
  }, 2e4);
  req.on("close", () => {
    clearInterval(hb);
    removeClient(clientId);
  });
  res.write("event: connected\ndata: {}\n\n");
});
var events_default = router5;

// src/routes/calendar-events.ts
import { Router as Router6 } from "express";
import { randomUUID as randomUUID5 } from "crypto";
var router6 = Router6();
router6.get("/calendar/events", rateLimiters.read, authenticate, async (_req, res) => {
  try {
    const result = await db_default.execute("SELECT * FROM calendar_events ORDER BY date ASC");
    const events = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      date: row.date,
      time: row.time,
      description: row.description,
      type: row.type,
      author: row.author,
      timestamp: row.timestamp
    }));
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch events" });
  }
});
router6.post("/calendar/events", rateLimiters.messages, authenticate, async (req, res) => {
  const { title, date, time, description, type, author } = req.body;
  if (!title || !date || !type || !author) {
    res.status(400).json({ error: "title, date, type, and author required" });
    return;
  }
  const id = randomUUID5();
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  try {
    await db_default.execute(
      "INSERT INTO calendar_events (id, title, date, time, description, type, author, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [id, title, date, time || null, description || null, type, author, timestamp]
    );
    const event = {
      id,
      title,
      date,
      time,
      description,
      type,
      author,
      timestamp
    };
    broadcast("event-added", event);
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: "Failed to create event" });
  }
});
router6.put("/calendar/events/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const { id } = req.params;
  const { title, date, time, description, type } = req.body;
  try {
    const updateParts = [];
    const values = [];
    let paramIndex = 1;
    if (title !== void 0) {
      updateParts.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (date !== void 0) {
      updateParts.push(`date = $${paramIndex++}`);
      values.push(date);
    }
    if (time !== void 0) {
      updateParts.push(`time = $${paramIndex++}`);
      values.push(time);
    }
    if (description !== void 0) {
      updateParts.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (type !== void 0) {
      updateParts.push(`type = $${paramIndex++}`);
      values.push(type);
    }
    if (updateParts.length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }
    values.push(id);
    await db_default.execute(
      `UPDATE calendar_events SET ${updateParts.join(", ")} WHERE id = $${paramIndex}`,
      values
    );
    const result = await db_default.execute("SELECT * FROM calendar_events WHERE id = $1", [id]);
    const event = result.rows[0];
    broadcast("event-updated", event);
    res.json({
      id: event.id,
      title: event.title,
      date: event.date,
      time: event.time,
      description: event.description,
      type: event.type,
      author: event.author,
      timestamp: event.timestamp
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update event" });
  }
});
router6.delete("/calendar/events/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    await db_default.execute("DELETE FROM calendar_events WHERE id = $1", [id]);
    broadcast("event-deleted", { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete event" });
  }
});
var calendar_events_default = router6;

// src/routes/checkins.ts
import { Router as Router7 } from "express";
import { randomUUID as randomUUID6 } from "crypto";
var router7 = Router7();
router7.get("/checkins", rateLimiters.read, authenticate, async (_req, res) => {
  try {
    const result = await db_default.execute("SELECT * FROM daily_checkins ORDER BY timestamp DESC");
    const checkins = result.rows.map((row) => ({
      id: row.id,
      question: row.question,
      answer: row.answer,
      mood: row.mood,
      author: row.author,
      timestamp: row.timestamp
    }));
    res.json(checkins);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch checkins" });
  }
});
router7.post("/checkins", rateLimiters.messages, authenticate, async (req, res) => {
  const { question, answer, mood, author } = req.body;
  if (!question || !answer || !mood || !author) {
    res.status(400).json({ error: "question, answer, mood, and author required" });
    return;
  }
  const id = randomUUID6();
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  try {
    await db_default.execute(
      "INSERT INTO daily_checkins (id, question, answer, mood, author, timestamp) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, question, answer, mood, author, timestamp]
    );
    const checkin = {
      id,
      question,
      answer,
      mood,
      author,
      timestamp
    };
    broadcast("checkin-added", checkin);
    res.json(checkin);
  } catch (err) {
    res.status(500).json({ error: "Failed to create checkin" });
  }
});
router7.delete("/checkins/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    await db_default.execute("DELETE FROM daily_checkins WHERE id = $1", [id]);
    broadcast("checkin-deleted", { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete checkin" });
  }
});
var checkins_default = router7;

// src/routes/tasks.ts
import { Router as Router8 } from "express";
import { randomUUID as randomUUID7 } from "crypto";
var router8 = Router8();
router8.get("/tasks", rateLimiters.read, authenticate, async (_req, res) => {
  try {
    const result = await db_default.execute("SELECT * FROM shared_tasks ORDER BY completed ASC, priority DESC, timestamp DESC");
    const tasks = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      assignedTo: row.assigned_to,
      priority: row.priority,
      completed: Boolean(row.completed),
      author: row.author,
      timestamp: row.timestamp
    }));
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});
router8.post("/tasks", rateLimiters.messages, authenticate, async (req, res) => {
  const { title, assignedTo, priority, author } = req.body;
  if (!title || !assignedTo || !priority || !author) {
    res.status(400).json({ error: "title, assignedTo, priority, and author required" });
    return;
  }
  const id = randomUUID7();
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  try {
    await db_default.execute(
      "INSERT INTO shared_tasks (id, title, assigned_to, priority, completed, author, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [id, title, assignedTo, priority, 0, author, timestamp]
    );
    const task = {
      id,
      title,
      assignedTo,
      priority,
      completed: false,
      author,
      timestamp
    };
    broadcast("task-added", task);
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: "Failed to create task" });
  }
});
router8.put("/tasks/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  if (completed === void 0) {
    res.status(400).json({ error: "completed field required" });
    return;
  }
  try {
    await db_default.execute("UPDATE shared_tasks SET completed = $1 WHERE id = $2", [completed ? 1 : 0, id]);
    const result = await db_default.execute("SELECT * FROM shared_tasks WHERE id = $1", [id]);
    const task = result.rows[0];
    broadcast("task-updated", {
      id: task.id,
      title: task.title,
      assignedTo: task.assigned_to,
      priority: task.priority,
      completed: task.completed,
      author: task.author,
      timestamp: task.timestamp
    });
    res.json({
      id: task.id,
      title: task.title,
      assignedTo: task.assigned_to,
      priority: task.priority,
      completed: task.completed,
      author: task.author,
      timestamp: task.timestamp
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update task" });
  }
});
router8.delete("/tasks/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    await db_default.execute("DELETE FROM shared_tasks WHERE id = $1", [id]);
    broadcast("task-deleted", { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete task" });
  }
});
var tasks_default = router8;

// src/routes/milestones.ts
import { Router as Router9 } from "express";
import { randomUUID as randomUUID8 } from "crypto";
var router9 = Router9();
router9.get("/milestones", rateLimiters.read, authenticate, async (_req, res) => {
  try {
    const result = await db_default.execute("SELECT * FROM relationship_milestones ORDER BY date DESC");
    const milestones = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      date: row.date,
      description: row.description,
      type: row.type,
      author: row.author,
      timestamp: row.timestamp
    }));
    res.json(milestones);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch milestones" });
  }
});
router9.post("/milestones", rateLimiters.messages, authenticate, async (req, res) => {
  const { title, date, description, type, author } = req.body;
  if (!title || !date || !type || !author) {
    res.status(400).json({ error: "title, date, type, and author required" });
    return;
  }
  const id = randomUUID8();
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  try {
    await db_default.execute(
      "INSERT INTO relationship_milestones (id, title, date, description, type, author, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [id, title, date, description || null, type, author, timestamp]
    );
    const milestone = {
      id,
      title,
      date,
      description,
      type,
      author,
      timestamp
    };
    broadcast("milestone-added", milestone);
    res.json(milestone);
  } catch (err) {
    res.status(500).json({ error: "Failed to create milestone" });
  }
});
router9.delete("/milestones/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    await db_default.execute("DELETE FROM relationship_milestones WHERE id = $1", [id]);
    broadcast("milestone-deleted", { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete milestone" });
  }
});
var milestones_default = router9;

// src/routes/secret-notes.ts
import { Router as Router10 } from "express";
import { randomUUID as randomUUID9 } from "crypto";
var router10 = Router10();
router10.get("/secret-notes", rateLimiters.read, authenticate, async (_req, res) => {
  try {
    const result = await db_default.execute("SELECT * FROM secret_notes ORDER BY timestamp DESC");
    const notes = result.rows.map((row) => ({
      id: row.id,
      content: row.content,
      author: row.author,
      timestamp: row.timestamp
    }));
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch secret notes" });
  }
});
router10.post("/secret-notes", rateLimiters.messages, authenticate, async (req, res) => {
  const authId = req.user.id;
  const { content } = req.body;
  if (!content?.trim()) {
    res.status(400).json({ error: "content required" });
    return;
  }
  const id = randomUUID9();
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const author = authId;
  try {
    await db_default.execute(
      "INSERT INTO secret_notes (id, content, author, timestamp) VALUES ($1, $2, $3, $4)",
      [id, content.trim(), author, timestamp]
    );
    const note = {
      id,
      content,
      author,
      timestamp
    };
    broadcast("secret-note-added", note);
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: "Failed to create secret note" });
  }
});
router10.delete("/secret-notes/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const authId = req.user.id;
  const id = String(req.params.id);
  try {
    const existing = await db_default.execute("SELECT author FROM secret_notes WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (String(existing.rows[0].author) !== authId) {
      res.status(403).json({ error: "Only the creator can delete this note" });
      return;
    }
    await db_default.execute("DELETE FROM secret_notes WHERE id = $1", [id]);
    broadcast("secret-note-deleted", { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete secret note" });
  }
});
var secret_notes_default = router10;

// src/routes/call.ts
import { Router as Router11 } from "express";

// src/lib/webrtc.ts
function getWebRTCConfiguration() {
  const turnServers = getTurnServers();
  const stunServers = getStunServers();
  return {
    iceServers: [
      ...stunServers,
      ...turnServers
    ]
  };
}
function getStunServers() {
  const defaultStunServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" }
  ];
  const customStunUrls = process.env.STUN_SERVERS?.split(",").filter(Boolean) || [];
  if (customStunUrls.length > 0) {
    return customStunUrls.map((url) => ({ urls: url.trim() }));
  }
  return defaultStunServers;
}
function getTurnServers() {
  const turnUrls = process.env.TURN_SERVERS?.split(",").filter(Boolean) || [];
  const turnUsername = process.env.TURN_USERNAME;
  const turnCredential = process.env.TURN_CREDENTIAL;
  if (turnUrls.length === 0 || !turnUsername || !turnCredential) {
    console.warn("TURN server not configured. WebRTC may not work in restrictive network environments.");
    console.warn("Set TURN_SERVERS, TURN_USERNAME, and TURN_CREDENTIAL environment variables.");
    return [];
  }
  return turnUrls.map((url) => ({
    urls: url.trim(),
    username: turnUsername,
    credential: turnCredential,
    credentialType: "password"
  }));
}

// src/routes/call.ts
var router11 = Router11();
function partnerIdFor(userId) {
  return userId === "me" ? "wife" : "me";
}
router11.get("/call/rtc-config", authenticate, (_req, res) => {
  res.json(getWebRTCConfiguration());
});
router11.post("/call/signal", rateLimiters.messages, authenticate, (req, res) => {
  const authenticatedUserId = req.user.id;
  const { type, senderId, ...rest } = req.body;
  if (senderId !== authenticatedUserId) {
    res.status(403).json({ error: "Forbidden: Can only send signals as yourself" });
    return;
  }
  const partnerId = partnerIdFor(authenticatedUserId);
  broadcast(`call-${type}`, { from: senderId, ...rest }, partnerId);
  res.json({ ok: true });
});
router11.post("/call/notify", rateLimiters.messages, authenticate, (req, res) => {
  const authenticatedUserId = req.user.id;
  const { from, callType } = req.body;
  if (from !== authenticatedUserId) {
    res.status(403).json({ error: "Forbidden: Can only send notifications as yourself" });
    return;
  }
  const partnerId = partnerIdFor(authenticatedUserId);
  broadcast("call-ring", { from, callType }, partnerId);
  res.json({ ok: true });
});
var call_default = router11;

// src/routes/profile.ts
import { Router as Router12 } from "express";

// src/services/profile-service.ts
function usernameFromDisplayName(name) {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  return slug.slice(0, 30) || "user";
}
var ProfileService = class {
  /**
   * Get profiles for authenticated user and their partner
   */
  async getUserProfiles(userId) {
    const partnerId = appConfig.partnerMapping[userId] || userId;
    const result = await db_default.execute(
      "SELECT * FROM profiles WHERE id = $1 OR id = $2",
      [userId, partnerId]
    );
    const rows = [];
    for (const row of result.rows) {
      const r = row;
      const id = String(r.id);
      const avatar = sanitizeAvatarForClient(id, r.avatar);
      rows.push({
        id,
        username: r.username,
        name: r.name,
        bio: r.bio,
        avatar
      });
    }
    return rows;
  }
  /**
   * Update a user's profile
   */
  async updateProfile(userId, updates) {
    const { name, bio, avatar } = updates;
    const updateFields = [];
    const params = [];
    let n = 1;
    let previousName;
    if (name !== void 0) {
      const existing = await db_default.execute("SELECT name FROM profiles WHERE id = $1", [userId]);
      previousName = existing.rows[0]?.name;
      updateFields.push(`name = $${n++}`);
      params.push(name);
      updateFields.push(`username = $${n++}`);
      params.push(usernameFromDisplayName(name));
    }
    if (bio !== void 0) {
      updateFields.push(`bio = $${n++}`);
      params.push(bio);
    }
    if (avatar !== void 0) {
      if (typeof avatar === "string" && avatar.length > 3e6) {
        throw new Error("Avatar image is too large");
      }
      const storedAvatar = await persistAvatarIfNeeded(userId, avatar);
      updateFields.push(`avatar = $${n++}`);
      params.push(storedAvatar);
    }
    if (updateFields.length === 0) {
      throw new Error("No fields to update");
    }
    params.push(userId);
    await db_default.execute(
      `UPDATE profiles SET ${updateFields.join(", ")} WHERE id = $${n}`,
      params
    );
    const result = await db_default.execute("SELECT * FROM profiles WHERE id = $1", [userId]);
    const profile = result.rows[0];
    const publicAvatar = sanitizeAvatarForClient(userId, profile.avatar);
    broadcast("profile-updated", {
      userId,
      id: profile.id,
      username: profile.username,
      name: profile.name,
      bio: profile.bio,
      avatar: publicAvatar
    });
    if (name !== void 0) {
      await db_default.execute(
        `UPDATE activity_feed SET from_name = $1
         WHERE actor_id = $2 OR ($3::text IS NOT NULL AND from_name = $3)`,
        [profile.name, userId, previousName ?? null]
      );
    }
    const displayName = profile.name || userId;
    if (name !== void 0) {
      await postCoupleActivity("story", userId, displayName, `changed their name to ${name}`).catch(() => {
      });
    } else if (bio !== void 0) {
      await postCoupleActivity("story", userId, displayName, "updated their bio").catch(() => {
      });
    } else if (avatar !== void 0) {
      await postCoupleActivity("story", userId, displayName, "changed their profile photo").catch(() => {
      });
    }
    return {
      id: String(profile.id),
      username: profile.username,
      name: profile.name,
      bio: profile.bio,
      avatar: publicAvatar
    };
  }
  /**
   * Validate profile update payload
   */
  validateProfileUpdate(payload) {
    const errors = [];
    if (payload.name !== void 0) {
      if (typeof payload.name !== "string") {
        errors.push("Name must be a string");
      } else if (payload.name.length < 1 || payload.name.length > 100) {
        errors.push("Name must be between 1 and 100 characters");
      }
    }
    if (payload.bio !== void 0) {
      if (typeof payload.bio !== "string") {
        errors.push("Bio must be a string");
      } else if (payload.bio.length > 500) {
        errors.push("Bio must not exceed 500 characters");
      }
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
};
var profileService = new ProfileService();

// src/routes/profile.ts
function getParam(param) {
  return Array.isArray(param) ? param[0] : param;
}
var router12 = Router12();
router12.get("/users", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const profiles = await profileService.getUserProfiles(userId);
    res.json(profiles);
  } catch (err) {
    logger.error({ err }, "Failed to fetch users");
    res.status(500).json({ error: "Failed to fetch users" });
  }
});
router12.put("/users/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const { id } = req.params;
  const normalizedId = getParam(id);
  const authId = req.user.id;
  if (normalizedId !== "me" && normalizedId !== "wife") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (normalizedId !== authId) {
    res.status(403).json({ error: "Can only update your own profile" });
    return;
  }
  const { name, bio, avatar } = req.body;
  const validation = profileService.validateProfileUpdate({ name, bio });
  if (!validation.valid) {
    res.status(400).json({ error: "Validation failed", details: validation.errors });
    return;
  }
  try {
    const profile = await profileService.updateProfile(normalizedId, { name, bio, avatar });
    res.json(profile);
  } catch (err) {
    logger.error({ err, userId: normalizedId }, "Failed to update profile");
    if (err instanceof Error && err.message === "No fields to update") {
      res.status(400).json({ error: "No fields to update" });
    } else {
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
});
var profile_default = router12;

// src/routes/presence.ts
import { Router as Router13 } from "express";
var lastSeen = {};
var router13 = Router13();
router13.post("/presence/heartbeat", rateLimiters.messages, authenticate, async (req, res) => {
  const authenticatedUserId = req.user?.id;
  if (!authenticatedUserId || authenticatedUserId !== "me" && authenticatedUserId !== "wife") {
    res.status(400).json({ error: "Invalid userId" });
    return;
  }
  const now = Date.now();
  lastSeen[authenticatedUserId] = now;
  const partnerId = authenticatedUserId === "me" ? "wife" : "me";
  try {
    await db_default.execute("UPDATE devices SET last_seen = ? WHERE user_id = ?", [now, authenticatedUserId]);
  } catch {
  }
  broadcast("presence", { userId: authenticatedUserId, lastSeen: now }, partnerId);
  res.json({ userId: authenticatedUserId, lastSeen: now });
});
router13.get("/presence", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user?.id;
    if (!authenticatedUserId || authenticatedUserId !== "me" && authenticatedUserId !== "wife") {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const partnerId = authenticatedUserId === "me" ? "wife" : "me";
    const lastSeenMap = { ...lastSeen };
    const typing = {};
    const now = Date.now();
    let result;
    try {
      result = await db_default.execute(
        `
        SELECT user_id, MAX(last_seen) AS last_seen, MAX(typing_until) AS typing_until
        FROM devices
        WHERE user_id = ? OR user_id = ?
        GROUP BY user_id
        `,
        [authenticatedUserId, partnerId]
      );
    } catch {
      result = await db_default.execute(
        `
        SELECT user_id, MAX(last_seen) AS last_seen
        FROM devices
        WHERE user_id = ? OR user_id = ?
        GROUP BY user_id
        `,
        [authenticatedUserId, partnerId]
      );
    }
    for (const row of result.rows) {
      const id = row.user_id ? String(row.user_id) : "";
      if (!id) continue;
      const persisted = Number(row.last_seen ?? 0);
      if (Number.isFinite(persisted) && persisted > 0) {
        lastSeenMap[id] = Math.max(lastSeenMap[id] ?? 0, persisted);
      }
      const typingUntil = Number(row.typing_until ?? 0);
      typing[id] = Number.isFinite(typingUntil) && typingUntil > now;
    }
    res.json({ lastSeen: lastSeenMap, typing });
  } catch (err) {
    console.error("Failed to fetch presence:", err);
    res.status(500).json({ error: "Failed to fetch presence" });
  }
});
var presence_default = router13;

// src/routes/images.ts
import { Router as Router14 } from "express";
import { randomUUID as randomUUID10 } from "crypto";

// src/lib/file-mime.ts
var EXT_TO_MIME = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  rtf: "application/rtf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mkv: "video/x-matroska",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
  zip: "application/zip",
  rar: "application/vnd.rar",
  "7z": "application/x-7z-compressed",
  json: "application/json",
  xml: "application/xml",
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8"
};
var MIME_TO_EXT = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain": "txt",
  "text/csv": "csv",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "audio/mpeg": "mp3",
  "application/zip": "zip"
};
function extFromName(fileName) {
  const m = fileName.toLowerCase().match(/\.([a-z0-9]{2,5})$/);
  return m?.[1] ?? null;
}
function extensionForMime(mime) {
  if (!mime) return null;
  const base = mime.split(";")[0]?.trim().toLowerCase() ?? "";
  if (MIME_TO_EXT[base]) return MIME_TO_EXT[base];
  if (base.startsWith("image/")) return base.slice(6) === "jpeg" ? "jpg" : base.slice(6);
  if (base.startsWith("video/")) return base.slice(6);
  if (base.startsWith("audio/")) return base.slice(6) === "mpeg" ? "mp3" : base.slice(6);
  return null;
}
function ensureFileNameWithExtension(fileName, mimeHint) {
  const trimmed = fileName.trim() || "file";
  if (extFromName(trimmed)) return trimmed;
  const ext = extensionForMime(mimeHint);
  return ext ? `${trimmed}.${ext}` : trimmed;
}
function resolveContentType(fileName, mimeHint, upstreamType) {
  const ext = extFromName(fileName);
  if (ext && EXT_TO_MIME[ext]) return EXT_TO_MIME[ext];
  const hint = mimeHint?.split(";")[0]?.trim().toLowerCase();
  if (hint && hint !== "application/octet-stream") return hint;
  const up = upstreamType?.split(";")[0]?.trim().toLowerCase();
  if (up && up !== "application/octet-stream") return up;
  return "application/octet-stream";
}
function extForContentType(contentType) {
  const c = contentType.toLowerCase();
  for (const [mime, ext] of Object.entries(MIME_TO_EXT)) {
    if (c.includes(mime.split("/")[1]) || c === mime) return ext;
  }
  if (c.includes("png")) return "png";
  if (c.includes("webp")) return "webp";
  if (c.includes("gif")) return "gif";
  if (c.includes("jpeg") || c.includes("jpg")) return "jpg";
  if (c.includes("pdf")) return "pdf";
  if (c.includes("mp4")) return "mp4";
  if (c.includes("quicktime")) return "mov";
  if (c.includes("webm")) return "webm";
  if (c.includes("mpeg") || c.includes("mp3")) return "mp3";
  if (c.includes("wav")) return "wav";
  if (c.includes("zip")) return "zip";
  if (c.includes("word") || c.includes("document")) return "docx";
  if (c.includes("sheet") || c.includes("excel")) return "xlsx";
  if (c.includes("presentation") || c.includes("powerpoint")) return "pptx";
  if (c.includes("text/plain")) return "txt";
  if (c.includes("json")) return "json";
  return "bin";
}

// src/routes/images.ts
function getParam2(param) {
  return Array.isArray(param) ? param[0] : param;
}
var router14 = Router14();
function allowedMediaHostname(hostname) {
  const host = hostname.toLowerCase();
  if (host === "res.cloudinary.com" || host.endsWith(".cloudinary.com")) return true;
  try {
    const b2 = process.env.B2_ENDPOINT ? new URL(process.env.B2_ENDPOINT).hostname : "";
    if (b2 && (host === b2 || host.endsWith(b2))) return true;
  } catch {
  }
  return false;
}
router14.get("/media/inline", rateLimiters.read, authenticateBearerOrQuery, async (req, res) => {
  const rawUrl = typeof req.query.url === "string" ? req.query.url : "";
  const fileNameRaw = typeof req.query.name === "string" ? req.query.name : "file";
  const mimeHint = typeof req.query.type === "string" ? req.query.type : void 0;
  const asDownload = req.query.download === "1";
  if (!rawUrl) {
    res.status(400).json({ error: "url required" });
    return;
  }
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    res.status(400).json({ error: "Invalid url" });
    return;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    res.status(400).json({ error: "Invalid url scheme" });
    return;
  }
  if (!allowedMediaHostname(parsed.hostname)) {
    res.status(403).json({ error: "URL not allowed" });
    return;
  }
  try {
    const upstream = await fetch(rawUrl);
    if (!upstream.ok) {
      res.status(502).json({ error: "Failed to fetch file" });
      return;
    }
    const safeName = ensureFileNameWithExtension(
      fileNameRaw.replace(/[^\w.\-() ]+/g, "_").slice(0, 120) || "file",
      mimeHint
    );
    const contentType = resolveContentType(
      safeName,
      mimeHint,
      upstream.headers.get("content-type")
    );
    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `${asDownload ? "attachment" : "inline"}; filename="${safeName}"`
    );
    res.setHeader("Cache-Control", "private, max-age=3600");
    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.send(buffer);
  } catch (error) {
    console.error("Media inline proxy error:", error);
    res.status(500).json({ error: "Failed to open file" });
  }
});
async function handleMediaUpload(req, res) {
  try {
    if (!req.body?.data) {
      res.status(400).json({ error: "No media data provided" });
      return;
    }
    const { data, contentType } = req.body;
    const mime = contentType || "image/jpeg";
    const base64Data = data.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    if (buffer.length > 60 * 1024 * 1024) {
      res.status(400).json({ error: "File too large (max 60MB)" });
      return;
    }
    const key = `${randomUUID10()}.${extForContentType(mime)}`;
    const url = await uploadMedia(key, buffer, mime);
    res.json({ url, key });
  } catch (error) {
    console.error("Media upload error:", error);
    const msg = error instanceof Error ? error.message : "Failed to upload media";
    res.status(500).json({ error: msg });
  }
}
router14.post("/images/upload", rateLimiters.upload, authenticate, async (req, res) => {
  if (req.body?.image && !req.body?.data) {
    req.body.data = req.body.image;
  }
  await handleMediaUpload(req, res);
});
router14.post("/media/upload", rateLimiters.upload, authenticate, async (req, res) => {
  await handleMediaUpload(req, res);
});
async function handleBinaryMediaUpload(req, res) {
  try {
    const raw = req.body;
    if (!raw || typeof raw !== "object" && typeof raw !== "string") {
      res.status(400).json({ error: "No media data provided" });
      return;
    }
    const buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
    if (buffer.length === 0) {
      res.status(400).json({ error: "Empty upload" });
      return;
    }
    if (buffer.length > 60 * 1024 * 1024) {
      res.status(400).json({ error: "File too large (max 60MB)" });
      return;
    }
    const headerMime = String(req.headers["content-type"] || "application/octet-stream").split(";")[0].trim();
    const mime = headerMime || "application/octet-stream";
    const key = `${randomUUID10()}.${extForContentType(mime)}`;
    const url = await uploadMedia(key, buffer, mime);
    res.json({ url, key });
  } catch (error) {
    console.error("Binary media upload error:", error);
    const msg = error instanceof Error ? error.message : "Failed to upload media";
    res.status(500).json({ error: msg });
  }
}
router14.delete("/images/:key", rateLimiters.upload, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const key = getParam2(req.params["key"]);
    const result = await db_default.execute(
      "SELECT sender_id FROM messages WHERE image_url LIKE $1 OR image_data LIKE $2 OR gif_url LIKE $3 LIMIT 1",
      [`%${key}%`, `%${key}%`, `%${key}%`]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Image not found" });
      return;
    }
    const messageSenderId = result.rows[0].sender_id;
    if (messageSenderId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only delete your own images" });
      return;
    }
    await deleteImage(key);
    res.json({ success: true });
  } catch (error) {
    console.error("Image deletion error:", error);
    res.status(500).json({ error: "Failed to delete image" });
  }
});
var images_default = router14;

// src/routes/notifications.ts
import { Router as Router15 } from "express";
function getParam3(param) {
  return Array.isArray(param) ? param[0] : param;
}
var router15 = Router15();
router15.post("/notifications/subscribe", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { subscription, userId } = req.body;
    if (!subscription || !userId) {
      res.status(400).json({ error: "subscription and userId required" });
      return;
    }
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only manage your own subscriptions" });
      return;
    }
    const existing = await db_default.execute(
      "SELECT * FROM push_subscriptions WHERE user_id = $1",
      [userId]
    );
    if (existing.rows.length > 0) {
      await db_default.execute(
        "UPDATE push_subscriptions SET subscription = $1 WHERE user_id = $2",
        [JSON.stringify(subscription), userId]
      );
    } else {
      await db_default.execute(
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
router15.get("/notifications/subscribe/:userId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { userId } = req.params;
    const normalizedUserId = getParam3(userId);
    if (normalizedUserId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only read your own subscriptions" });
      return;
    }
    const result = await db_default.execute(
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
router15.delete("/notifications/subscribe/:userId", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { userId } = req.params;
    const normalizedUserId = getParam3(userId);
    if (normalizedUserId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only delete your own subscriptions" });
      return;
    }
    await db_default.execute(
      "DELETE FROM push_subscriptions WHERE user_id = $1",
      [normalizedUserId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to delete push subscription:", err);
    res.status(500).json({ error: "Failed to delete subscription" });
  }
});
router15.post("/keys/public", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { userId, publicKey } = req.body;
    if (!userId || !publicKey) {
      res.status(400).json({ error: "userId and publicKey required" });
      return;
    }
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only set your own public key" });
      return;
    }
    await db_default.execute(
      "INSERT INTO public_keys (user_id, public_key) VALUES (?, ?) ON CONFLICT (user_id) DO UPDATE SET public_key = excluded.public_key",
      [userId, publicKey]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to save public key:", err);
    res.status(500).json({ error: "Failed to save public key" });
  }
});
router15.get("/keys/public/:userId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const normalizedUserId = getParam3(userId);
    const result = await db_default.execute(
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
var notifications_default = router15;

// src/routes/twoFactor.ts
import { Router as Router16 } from "express";
import speakeasy from "speakeasy";
function getParam4(param) {
  return Array.isArray(param) ? param[0] : param;
}
var router16 = Router16();
router16.post("/2fa/setup", rateLimiters.auth, authenticate, async (req, res) => {
  try {
    const { userId } = req.body;
    const authenticatedUserId = req.user.id;
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
      issuer: "Grova"
    });
    await db_default.execute(
      "INSERT INTO two_factor_auth (user_id, secret, enabled) VALUES ($1, $2, 0) ON CONFLICT (user_id) DO UPDATE SET secret = $2",
      [userId, secret.base32]
    );
    res.json({
      secret: secret.base32,
      qrCode: secret.otpauth_url
    });
  } catch (err) {
    console.error("Failed to setup 2FA:", err);
    res.status(500).json({ error: "Failed to setup 2FA" });
  }
});
router16.post("/2fa/enable", rateLimiters.auth, authenticate, async (req, res) => {
  try {
    const { userId, token } = req.body;
    const authenticatedUserId = req.user.id;
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only enable 2FA for yourself" });
      return;
    }
    if (!userId || !token) {
      res.status(400).json({ error: "userId and token required" });
      return;
    }
    const result = await db_default.execute(
      "SELECT secret FROM two_factor_auth WHERE user_id = $1",
      [userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "2FA not setup for this user" });
      return;
    }
    const secret = String(result.rows[0].secret);
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token
    });
    if (!verified) {
      res.status(400).json({ error: "Invalid token" });
      return;
    }
    await db_default.execute(
      "UPDATE two_factor_auth SET enabled = 1 WHERE user_id = $1",
      [userId]
    );
    const backupCodes = Array.from(
      { length: 10 },
      () => speakeasy.generateSecret({ length: 20 }).base32.substring(0, 8)
    );
    await db_default.execute(
      "UPDATE two_factor_auth SET backup_codes = $1 WHERE user_id = $2",
      [JSON.stringify(backupCodes), userId]
    );
    res.json({ success: true, backupCodes });
  } catch (err) {
    console.error("Failed to enable 2FA:", err);
    res.status(500).json({ error: "Failed to enable 2FA" });
  }
});
router16.post("/2fa/verify", async (req, res) => {
  try {
    const { userId, token } = req.body;
    if (!userId || !token) {
      res.status(400).json({ error: "userId and token required" });
      return;
    }
    const result = await db_default.execute(
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
    if (backupCodes.includes(token)) {
      const remainingCodes = backupCodes.filter((code) => code !== token);
      await db_default.execute(
        "UPDATE two_factor_auth SET backup_codes = $1 WHERE user_id = $2",
        [JSON.stringify(remainingCodes), userId]
      );
      res.json({ success: true, backupCodeUsed: true });
      return;
    }
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 2
      // Allow 2 time steps (1 minute) for clock drift
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
router16.post("/2fa/disable", rateLimiters.auth, authenticate, async (req, res) => {
  try {
    const { userId, token } = req.body;
    const authenticatedUserId = req.user.id;
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only disable 2FA for yourself" });
      return;
    }
    if (!userId || !token) {
      res.status(400).json({ error: "userId and token required" });
      return;
    }
    const result = await db_default.execute(
      "SELECT secret FROM two_factor_auth WHERE user_id = $1",
      [userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "2FA not setup for this user" });
      return;
    }
    const secret = String(result.rows[0].secret);
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token
    });
    if (!verified) {
      res.status(400).json({ error: "Invalid token" });
      return;
    }
    await db_default.execute(
      "UPDATE two_factor_auth SET enabled = 0 WHERE user_id = $1",
      [userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to disable 2FA:", err);
    res.status(500).json({ error: "Failed to disable 2FA" });
  }
});
router16.get("/2fa/status/:userId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const normalizedUserId = getParam4(userId);
    const authenticatedUserId = req.user.id;
    if (normalizedUserId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only check your own 2FA status" });
      return;
    }
    const result = await db_default.execute(
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
var twoFactor_default = router16;

// src/routes/reactions.ts
import { Router as Router17 } from "express";
import { randomUUID as randomUUID11 } from "crypto";
function getParam5(param) {
  return Array.isArray(param) ? param[0] : param;
}
var router17 = Router17();
router17.post("/reactions", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { messageId, userId, emoji } = req.body;
    if (!messageId || !userId || !emoji) {
      res.status(400).json({ error: "messageId, userId, and emoji required" });
      return;
    }
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only react as yourself" });
      return;
    }
    const existing = await db_default.execute(
      "SELECT * FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3",
      [messageId, userId, emoji]
    );
    if (existing.rows.length > 0) {
      await db_default.execute(
        "DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3",
        [messageId, userId, emoji]
      );
    } else {
      const id = randomUUID11();
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      await db_default.execute(
        "INSERT INTO message_reactions (id, message_id, user_id, emoji, timestamp) VALUES ($1, $2, $3, $4, $5)",
        [id, messageId, userId, emoji, timestamp]
      );
    }
    const reactionsResult = await db_default.execute(
      "SELECT emoji, user_id FROM message_reactions WHERE message_id = $1",
      [messageId]
    );
    const reactions = reactionsResult.rows.map((row) => ({
      emoji: row.emoji,
      userId: row.user_id
    }));
    broadcast("message-reaction", { messageId, reactions, byUserId: userId });
    res.json({ success: true, reactions });
  } catch (err) {
    console.error("Failed to add reaction:", err);
    res.status(500).json({ error: "Failed to add reaction" });
  }
});
router17.get("/reactions/:messageId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const normalizedMessageId = getParam5(messageId);
    const result = await db_default.execute(
      "SELECT emoji, user_id FROM message_reactions WHERE message_id = $1",
      [normalizedMessageId]
    );
    const reactions = result.rows.map((row) => ({
      emoji: row.emoji,
      userId: row.user_id
    }));
    res.json(reactions);
  } catch (err) {
    console.error("Failed to get reactions:", err);
    res.status(500).json({ error: "Failed to get reactions" });
  }
});
router17.delete("/reactions", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { messageId, userId, emoji } = req.body;
    if (!messageId || !userId || !emoji) {
      res.status(400).json({ error: "messageId, userId, and emoji required" });
      return;
    }
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only delete your own reactions" });
      return;
    }
    await db_default.execute(
      "DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3",
      [messageId, userId, emoji]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to delete reaction:", err);
    res.status(500).json({ error: "Failed to delete reaction" });
  }
});
var reactions_default = router17;

// src/routes/typing.ts
import { Router as Router18 } from "express";
var router18 = Router18();
router18.post("/typing", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const { userId, partnerId, typing } = req.body;
    const authenticatedUserId = req.user?.id;
    if (!userId || !partnerId || typeof typing !== "boolean") {
      res.status(400).json({ error: "userId, partnerId, and typing required" });
      return;
    }
    if (authenticatedUserId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const until = typing ? Date.now() + 5e3 : 0;
    try {
      await db_default.execute("UPDATE devices SET typing_until = ? WHERE user_id = ?", [until, userId]);
    } catch {
    }
    broadcast("typing-indicator", { userId, typing }, partnerId);
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to send typing indicator:", err);
    res.status(500).json({ error: "Failed to send typing indicator" });
  }
});
var typing_default = router18;

// src/routes/readReceipts.ts
import { Router as Router19 } from "express";
import { randomUUID as randomUUID12 } from "crypto";
function getParam6(param) {
  return Array.isArray(param) ? param[0] : param;
}
var router19 = Router19();
router19.post("/read-receipts", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { messageId, userId } = req.body;
    if (!messageId || !userId) {
      res.status(400).json({ error: "messageId and userId required" });
      return;
    }
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only mark messages as read for yourself" });
      return;
    }
    const existing = await db_default.execute(
      "SELECT * FROM message_read_receipts WHERE message_id = $1 AND user_id = $2",
      [messageId, userId]
    );
    if (existing.rows.length === 0) {
      const id = randomUUID12();
      const readAt = (/* @__PURE__ */ new Date()).toISOString();
      await db_default.execute(
        "INSERT INTO message_read_receipts (id, message_id, user_id, read_at) VALUES ($1, $2, $3, $4)",
        [id, messageId, userId, readAt]
      );
      broadcast("message-read", { messageId, userId, readAt });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to mark message as read:", err);
    res.status(500).json({ error: "Failed to mark message as read" });
  }
});
router19.post("/read-receipts/batch", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { messageIds, userId } = req.body;
    if (!userId || userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only mark messages as read for yourself" });
      return;
    }
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      res.status(400).json({ error: "messageIds array required" });
      return;
    }
    const readAt = (/* @__PURE__ */ new Date()).toISOString();
    const marked = [];
    for (const messageId of messageIds.slice(0, 100)) {
      const existing = await db_default.execute(
        "SELECT * FROM message_read_receipts WHERE message_id = $1 AND user_id = $2",
        [messageId, userId]
      );
      if (existing.rows.length === 0) {
        const id = randomUUID12();
        await db_default.execute(
          "INSERT INTO message_read_receipts (id, message_id, user_id, read_at) VALUES ($1, $2, $3, $4)",
          [id, messageId, userId, readAt]
        );
        marked.push(messageId);
      }
    }
    for (const messageId of marked) {
      broadcast("message-read", { messageId, userId, readAt });
    }
    res.json({ success: true, marked: marked.length, readAt });
  } catch (err) {
    console.error("Failed to batch mark messages as read:", err);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
});
router19.get("/read-receipts/:messageId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const normalizedMessageId = getParam6(messageId);
    const result = await db_default.execute(
      "SELECT user_id, read_at FROM message_read_receipts WHERE message_id = $1",
      [normalizedMessageId]
    );
    const receipts = result.rows.map((row) => ({
      userId: row.user_id,
      readAt: row.read_at
    }));
    res.json(receipts);
  } catch (err) {
    console.error("Failed to get read receipts:", err);
    res.status(500).json({ error: "Failed to get read receipts" });
  }
});
var readReceipts_default = router19;

// src/routes/forward.ts
import { Router as Router20 } from "express";
import { randomUUID as randomUUID13 } from "crypto";
function getParam7(param) {
  return Array.isArray(param) ? param[0] : param;
}
var router20 = Router20();
router20.post("/forward", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { messageId, fromUserId, toUserId } = req.body;
    if (!messageId || !fromUserId || !toUserId) {
      res.status(400).json({ error: "messageId, fromUserId, and toUserId required" });
      return;
    }
    if (fromUserId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only forward messages as yourself" });
      return;
    }
    const originalMsg = await db_default.execute(
      "SELECT * FROM messages WHERE id = $1",
      [messageId]
    );
    if (originalMsg.rows.length === 0) {
      res.status(404).json({ error: "Message not found" });
      return;
    }
    const msg = originalMsg.rows[0];
    const newId = randomUUID13();
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    await db_default.execute(
      `INSERT INTO messages (id, sender_id, text, type, audio_data, gif_url, image_data, timestamp, liked, deleted, variant, companion_sticker)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        newId,
        fromUserId,
        msg.text,
        msg.type,
        msg.audio_data,
        msg.gif_url,
        msg.image_data,
        timestamp,
        0,
        0,
        msg.variant,
        msg.companion_sticker
      ]
    );
    const forwardId = randomUUID13();
    await db_default.execute(
      "INSERT INTO forwarded_messages (id, original_message_id, from_user_id, to_user_id, forwarded_at) VALUES ($1, $2, $3, $4, $5)",
      [forwardId, messageId, fromUserId, toUserId, timestamp]
    );
    res.json({ success: true, messageId: newId });
  } catch (err) {
    console.error("Failed to forward message:", err);
    res.status(500).json({ error: "Failed to forward message" });
  }
});
router20.get("/forward/:messageId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const normalizedMessageId = getParam7(messageId);
    const result = await db_default.execute(
      "SELECT * FROM forwarded_messages WHERE original_message_id = $1",
      [normalizedMessageId]
    );
    const forwards = result.rows.map((row) => ({
      id: row.id,
      fromUserId: row.from_user_id,
      toUserId: row.to_user_id,
      forwardedAt: row.forwarded_at
    }));
    res.json(forwards);
  } catch (err) {
    console.error("Failed to get forwarded messages:", err);
    res.status(500).json({ error: "Failed to get forwarded messages" });
  }
});
var forward_default = router20;

// src/routes/edit.ts
import { Router as Router21 } from "express";
import { randomUUID as randomUUID14 } from "crypto";
function getParam8(param) {
  return Array.isArray(param) ? param[0] : param;
}
var router21 = Router21();
router21.patch("/messages/:id/edit", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { id } = req.params;
    const messageId = getParam8(id);
    const { text, userId } = req.body;
    if (!text || !userId) {
      res.status(400).json({ error: "text and userId required" });
      return;
    }
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only edit your own messages" });
      return;
    }
    const currentMsg = await db_default.execute(
      "SELECT * FROM messages WHERE id = $1",
      [messageId]
    );
    if (currentMsg.rows.length === 0) {
      res.status(404).json({ error: "Message not found" });
      return;
    }
    const msg = currentMsg.rows[0];
    if (msg.sender_id !== userId) {
      res.status(403).json({ error: "You can only edit your own messages" });
      return;
    }
    const ageMs = Date.now() - new Date(String(msg.timestamp)).getTime();
    if (ageMs > 60 * 60 * 1e3) {
      res.status(400).json({ error: "Messages can only be edited within 1 hour" });
      return;
    }
    const editId = randomUUID14();
    const editedAt = (/* @__PURE__ */ new Date()).toISOString();
    await db_default.execute(
      "INSERT INTO message_edits (id, message_id, old_text, new_text, edited_at) VALUES ($1, $2, $3, $4, $5)",
      [editId, messageId, msg.text, text, editedAt]
    );
    await db_default.execute("UPDATE messages SET text = $1 WHERE id = $2", [
      encryptStoredField(text),
      messageId
    ]);
    broadcast("message-edited", { messageId, newText: text, editedAt });
    res.json({ success: true, text, editedAt });
  } catch (err) {
    console.error("Failed to edit message:", err);
    res.status(500).json({ error: "Failed to edit message" });
  }
});
router21.get("/messages/:id/edits", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const messageId = getParam8(id);
    const result = await db_default.execute(
      "SELECT * FROM message_edits WHERE message_id = $1 ORDER BY edited_at ASC",
      [messageId]
    );
    const edits = result.rows.map((row) => ({
      id: row.id,
      oldText: row.old_text,
      newText: row.new_text,
      editedAt: row.edited_at
    }));
    res.json(edits);
  } catch (err) {
    console.error("Failed to get edit history:", err);
    res.status(500).json({ error: "Failed to get edit history" });
  }
});
var edit_default = router21;

// src/routes/pin.ts
import { Router as Router22 } from "express";
function getParam9(param) {
  return Array.isArray(param) ? param[0] : param;
}
var router22 = Router22();
router22.post("/pin", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { userId, messageId } = req.body;
    if (!userId || !messageId) {
      res.status(400).json({ error: "userId and messageId required" });
      return;
    }
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only pin messages for yourself" });
      return;
    }
    const pinnedAt = (/* @__PURE__ */ new Date()).toISOString();
    await db_default.execute(
      "INSERT INTO pinned_messages (user_id, message_id, pinned_at) VALUES ($1, $2, $3) ON CONFLICT (user_id, message_id) DO UPDATE SET pinned_at = $3",
      [userId, messageId, pinnedAt]
    );
    res.json({ success: true, pinnedAt });
  } catch (err) {
    console.error("Failed to pin message:", err);
    res.status(500).json({ error: "Failed to pin message" });
  }
});
router22.delete("/pin", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { userId, messageId } = req.body;
    if (!userId || !messageId) {
      res.status(400).json({ error: "userId and messageId required" });
      return;
    }
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only unpin messages for yourself" });
      return;
    }
    await db_default.execute(
      "DELETE FROM pinned_messages WHERE user_id = $1 AND message_id = $2",
      [userId, messageId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to unpin message:", err);
    res.status(500).json({ error: "Failed to unpin message" });
  }
});
router22.get("/pin/:userId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { userId } = req.params;
    const normalizedUserId = getParam9(userId);
    if (normalizedUserId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only read your own pinned messages" });
      return;
    }
    const result = await db_default.execute(
      `SELECT m.* FROM messages m
       INNER JOIN pinned_messages p ON m.id = p.message_id
       WHERE p.user_id = $1
       ORDER BY p.pinned_at DESC`,
      [normalizedUserId]
    );
    const pinnedMessages = result.rows.map((row) => ({
      id: row.id,
      senderId: row.sender_id,
      text: decryptStoredField(row.text),
      type: row.type,
      audioData: decryptStoredField(row.audio_data),
      gifUrl: row.gif_url,
      imageData: decryptStoredField(row.image_data),
      timestamp: row.timestamp,
      liked: row.liked === 1,
      deleted: row.deleted === 1,
      deletedAt: row.deleted_at,
      variant: row.variant,
      companionSticker: row.companion_sticker
    }));
    res.json(pinnedMessages);
  } catch (err) {
    console.error("Failed to get pinned messages:", err);
    res.status(500).json({ error: "Failed to get pinned messages" });
  }
});
router22.get("/pin/:userId/:messageId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { userId, messageId } = req.params;
    const normalizedUserId = getParam9(userId);
    const normalizedMessageId = getParam9(messageId);
    if (normalizedUserId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only check your own pin status" });
      return;
    }
    const result = await db_default.execute(
      "SELECT pinned_at FROM pinned_messages WHERE user_id = $1 AND message_id = $2",
      [normalizedUserId, normalizedMessageId]
    );
    if (result.rows.length === 0) {
      res.json({ pinned: false });
      return;
    }
    res.json({ pinned: true, pinnedAt: result.rows[0].pinned_at });
  } catch (err) {
    console.error("Failed to check pin status:", err);
    res.status(500).json({ error: "Failed to check pin status" });
  }
});
var pin_default = router22;

// src/routes/schedule.ts
import { Router as Router23 } from "express";
import { randomUUID as randomUUID15 } from "crypto";
function getParam10(param) {
  return Array.isArray(param) ? param[0] : param;
}
var router23 = Router23();
router23.post("/schedule", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { senderId, text, type, audioData, gifUrl, imageData, variant, companionSticker, scheduledAt } = req.body;
    if (!senderId || !type || !scheduledAt) {
      res.status(400).json({ error: "senderId, type, and scheduledAt required" });
      return;
    }
    if (senderId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only schedule messages for yourself" });
      return;
    }
    const id = randomUUID15();
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    await db_default.execute(
      `INSERT INTO scheduled_messages (id, sender_id, text, type, audio_data, gif_url, image_data, variant, companion_sticker, scheduled_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [id, senderId, encryptStoredField(text), type, encryptStoredField(audioData), gifUrl || null, encryptStoredField(imageData), variant || null, companionSticker || null, scheduledAt, createdAt]
    );
    res.json({ success: true, id, scheduledAt });
  } catch (err) {
    console.error("Failed to schedule message:", err);
    res.status(500).json({ error: "Failed to schedule message" });
  }
});
router23.get("/schedule/:userId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { userId } = req.params;
    const normalizedUserId = getParam10(userId);
    if (normalizedUserId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only read your own scheduled messages" });
      return;
    }
    const result = await db_default.execute(
      "SELECT * FROM scheduled_messages WHERE sender_id = $1 AND sent = 0 ORDER BY scheduled_at ASC",
      [normalizedUserId]
    );
    const scheduledMessages = result.rows.map((row) => ({
      id: row.id,
      senderId: row.sender_id,
      text: decryptStoredField(row.text),
      type: row.type,
      audioData: decryptStoredField(row.audio_data),
      gifUrl: row.gif_url,
      imageData: decryptStoredField(row.image_data),
      variant: row.variant,
      companionSticker: row.companion_sticker,
      scheduledAt: row.scheduled_at,
      createdAt: row.created_at
    }));
    res.json(scheduledMessages);
  } catch (err) {
    console.error("Failed to get scheduled messages:", err);
    res.status(500).json({ error: "Failed to get scheduled messages" });
  }
});
router23.delete("/schedule/:id", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const normalizedId = getParam10(req.params.id);
    const existing = await db_default.execute(
      "SELECT sender_id FROM scheduled_messages WHERE id = $1",
      [normalizedId]
    );
    const row = existing.rows[0];
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (row.sender_id !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    await db_default.execute("DELETE FROM scheduled_messages WHERE id = $1", [normalizedId]);
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to delete scheduled message:", err);
    res.status(500).json({ error: "Failed to delete scheduled message" });
  }
});
var schedule_default = router23;

// src/routes/media.ts
import { Router as Router24 } from "express";
import { randomUUID as randomUUID16 } from "crypto";
var STORY_TTL_MS = 24 * 60 * 60 * 1e3;
var MAX_POSTS_PER_USER = 20;
var router24 = Router24();
async function enrichSinglePost(postId, userId) {
  const result = await db_default.execute("SELECT * FROM posts WHERE id = $1", [postId]);
  const row = result.rows[0];
  if (!row) return null;
  const [likes, comments, reactionsResult] = await Promise.all([
    db_default.execute("SELECT user_id FROM post_likes WHERE post_id = $1", [postId]),
    db_default.execute("SELECT COUNT(*)::int AS cnt FROM post_comments WHERE post_id = $1", [postId]),
    db_default.execute("SELECT emoji, user_id FROM post_reactions WHERE post_id = $1", [postId])
  ]);
  const likeRows = likes.rows;
  const commentCount = Number(comments.rows[0]?.cnt ?? 0);
  const reactionRows = reactionsResult.rows;
  const reactionCounts = {};
  for (const r of reactionRows) {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] ?? 0) + 1;
  }
  const myReaction = reactionRows.find((r) => r.user_id === userId)?.emoji;
  return {
    id: postId,
    authorId: String(row.author_id),
    mediaUrl: String(row.media_url),
    caption: String(row.caption ?? ""),
    location: String(row.location ?? ""),
    aspectRatio: String(row.aspect_ratio ?? "4:5"),
    createdAt: String(row.created_at),
    likeCount: likeRows.length,
    likedByMe: likeRows.some((l) => l.user_id === userId),
    commentCount,
    myReaction,
    reactionCounts
  };
}
async function enrichPosts(userId) {
  const result = await db_default.execute(
    "SELECT * FROM posts ORDER BY created_at DESC LIMIT 50",
    []
  );
  const posts = result.rows;
  const enriched = await Promise.all(
    posts.map(async (row) => {
      const id = String(row.id);
      const likes = await db_default.execute(
        "SELECT user_id FROM post_likes WHERE post_id = $1",
        [id]
      );
      const comments = await db_default.execute(
        "SELECT COUNT(*) as cnt FROM post_comments WHERE post_id = $1",
        [id]
      );
      const likeRows = likes.rows;
      const commentCount = Number(comments.rows[0]?.cnt ?? 0);
      const reactionsResult = await db_default.execute(
        "SELECT emoji, user_id FROM post_reactions WHERE post_id = $1",
        [id]
      );
      const reactionRows = reactionsResult.rows;
      const reactionCounts = {};
      for (const r of reactionRows) {
        reactionCounts[r.emoji] = (reactionCounts[r.emoji] ?? 0) + 1;
      }
      const myReaction = reactionRows.find((r) => r.user_id === userId)?.emoji;
      return {
        id,
        authorId: String(row.author_id),
        mediaUrl: String(row.media_url),
        caption: String(row.caption ?? ""),
        location: String(row.location ?? ""),
        aspectRatio: String(row.aspect_ratio ?? "4:5"),
        createdAt: String(row.created_at),
        likeCount: likeRows.length,
        likedByMe: likeRows.some((l) => l.user_id === userId),
        commentCount,
        myReaction,
        reactionCounts
      };
    })
  );
  return enriched;
}
router24.get("/posts", rateLimiters.read, authenticate, async (req, res) => {
  const userId = req.user.id;
  try {
    res.json(await enrichPosts(userId));
  } catch (err) {
    console.error("Failed to fetch posts:", err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});
router24.post("/posts", rateLimiters.messages, authenticate, async (req, res) => {
  const userId = req.user.id;
  const { mediaUrl, caption, location, aspectRatio } = req.body;
  if (!mediaUrl) {
    res.status(400).json({ error: "mediaUrl required" });
    return;
  }
  const countResult = await db_default.execute(
    "SELECT COUNT(*)::int AS cnt FROM posts WHERE author_id = $1",
    [userId]
  );
  const postCount = Number(countResult.rows[0]?.cnt ?? 0);
  if (postCount >= MAX_POSTS_PER_USER) {
    res.status(400).json({
      error: `Maximum ${MAX_POSTS_PER_USER} photos allowed. Delete one from your grid to add more.`
    });
    return;
  }
  const id = randomUUID16();
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  try {
    await db_default.execute(
      "INSERT INTO posts (id, author_id, media_url, caption, location, aspect_ratio, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [id, userId, mediaUrl, caption ?? "", location ?? "", aspectRatio ?? "4:5", createdAt]
    );
    const post = {
      id,
      authorId: userId,
      mediaUrl,
      caption: caption ?? "",
      location: location ?? "",
      aspectRatio: aspectRatio ?? "4:5",
      createdAt,
      likeCount: 0,
      likedByMe: false,
      commentCount: 0
    };
    broadcast("post-added", post);
    const fromName = await profileDisplayName(userId);
    await postCoupleActivity("story", userId, fromName, "shared a new post").catch(() => {
    });
    res.json(post);
  } catch (err) {
    console.error("Failed to create post:", err);
    res.status(500).json({ error: "Failed to create post" });
  }
});
router24.post("/posts/:id/react", rateLimiters.messages, authenticate, async (req, res) => {
  const userId = req.user.id;
  const postId = String(req.params.id);
  const { emoji } = req.body;
  if (!emoji?.trim()) {
    res.status(400).json({ error: "emoji required" });
    return;
  }
  try {
    const existing = await db_default.execute(
      "SELECT emoji FROM post_reactions WHERE post_id = $1 AND user_id = $2",
      [postId, userId]
    );
    const row = existing.rows[0];
    if (row?.emoji === emoji) {
      await db_default.execute("DELETE FROM post_reactions WHERE post_id = $1 AND user_id = $2", [postId, userId]);
    } else {
      await db_default.execute(
        `INSERT INTO post_reactions (post_id, user_id, emoji, created_at) VALUES ($1, $2, $3, $4)
         ON CONFLICT (post_id, user_id) DO UPDATE SET emoji = EXCLUDED.emoji, created_at = EXCLUDED.created_at`,
        [postId, userId, emoji, (/* @__PURE__ */ new Date()).toISOString()]
      );
    }
    const post = await enrichSinglePost(postId, userId);
    if (post) broadcast("post-reacted", post);
    res.json(post ?? { success: true });
  } catch {
    res.status(500).json({ error: "Failed to react" });
  }
});
router24.post("/posts/:id/like", rateLimiters.messages, authenticate, async (req, res) => {
  const userId = req.user.id;
  const postId = String(req.params.id);
  try {
    const existing = await db_default.execute(
      "SELECT user_id FROM post_likes WHERE post_id = $1 AND user_id = $2",
      [postId, userId]
    );
    if (existing.rows.length > 0) {
      await db_default.execute("DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2", [postId, userId]);
    } else {
      await db_default.execute(
        "INSERT INTO post_likes (post_id, user_id, created_at) VALUES ($1, $2, $3)",
        [postId, userId, (/* @__PURE__ */ new Date()).toISOString()]
      );
    }
    const post = await enrichSinglePost(postId, userId);
    if (post) broadcast("post-liked", post);
    res.json(post ?? { success: true });
  } catch {
    res.status(500).json({ error: "Failed to toggle like" });
  }
});
router24.get("/posts/:id/comments", rateLimiters.read, authenticate, async (req, res) => {
  const postId = String(req.params.id);
  try {
    const result = await db_default.execute(
      "SELECT * FROM post_comments WHERE post_id = $1 ORDER BY created_at ASC",
      [postId]
    );
    res.json(
      result.rows.map((row) => ({
        id: String(row.id),
        postId: String(row.post_id),
        authorId: String(row.author_id),
        text: String(row.text),
        createdAt: String(row.created_at)
      }))
    );
  } catch {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});
router24.post("/posts/:id/comments", rateLimiters.messages, authenticate, async (req, res) => {
  const userId = req.user.id;
  const postId = String(req.params.id);
  const { text } = req.body;
  if (!text?.trim()) {
    res.status(400).json({ error: "text required" });
    return;
  }
  const id = randomUUID16();
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  try {
    await db_default.execute(
      "INSERT INTO post_comments (id, post_id, author_id, text, created_at) VALUES ($1, $2, $3, $4, $5)",
      [id, postId, userId, text.trim(), createdAt]
    );
    const comment = { id, postId, authorId: userId, text: text.trim(), createdAt };
    broadcast("post-commented", comment);
    const fromName = await profileDisplayName(userId);
    await postCoupleActivity("comment", userId, fromName, text.trim().slice(0, 80)).catch(() => {
    });
    res.json(comment);
  } catch {
    res.status(500).json({ error: "Failed to add comment" });
  }
});
router24.delete("/posts/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const userId = req.user.id;
  const id = String(req.params.id);
  try {
    const existing = await db_default.execute("SELECT author_id FROM posts WHERE id = $1", [id]);
    const row = existing.rows[0];
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (row.author_id !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    await db_default.execute("DELETE FROM post_likes WHERE post_id = $1", [id]);
    await db_default.execute("DELETE FROM post_comments WHERE post_id = $1", [id]);
    await db_default.execute("DELETE FROM post_reactions WHERE post_id = $1", [id]);
    await db_default.execute("DELETE FROM posts WHERE id = $1", [id]);
    broadcast("post-deleted", { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete post" });
  }
});
router24.get("/stories", rateLimiters.read, authenticate, async (_req, res) => {
  try {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await db_default.execute("DELETE FROM stories WHERE expires_at <= $1", [now]);
    const result = await db_default.execute(
      "SELECT * FROM stories WHERE expires_at > $1 ORDER BY created_at ASC",
      [now]
    );
    res.json(
      result.rows.map((row) => ({
        id: row.id,
        authorId: row.author_id,
        mediaUrl: row.media_url,
        kind: row.kind,
        createdAt: row.created_at,
        expiresAt: row.expires_at
      }))
    );
  } catch (err) {
    console.error("Failed to fetch stories:", err);
    res.status(500).json({ error: "Failed to fetch stories" });
  }
});
router24.post("/stories", rateLimiters.messages, authenticate, async (req, res) => {
  const userId = req.user.id;
  const { mediaUrl, kind } = req.body;
  if (!mediaUrl) {
    res.status(400).json({ error: "mediaUrl required" });
    return;
  }
  const id = randomUUID16();
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  const expiresAt = new Date(Date.now() + STORY_TTL_MS).toISOString();
  const storyKind = kind === "reel" ? "reel" : "story";
  try {
    await db_default.execute(
      "INSERT INTO stories (id, author_id, media_url, kind, created_at, expires_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, userId, mediaUrl, storyKind, createdAt, expiresAt]
    );
    const story = { id, authorId: userId, mediaUrl, kind: storyKind, createdAt, expiresAt };
    broadcast("story-added", story);
    res.json(story);
  } catch (err) {
    console.error("Failed to create story:", err);
    res.status(500).json({ error: "Failed to create story" });
  }
});
router24.delete("/stories/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const userId = req.user.id;
  const id = String(req.params.id);
  try {
    const existing = await db_default.execute("SELECT author_id FROM stories WHERE id = $1", [id]);
    const row = existing.rows[0];
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (row.author_id !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    await db_default.execute("DELETE FROM stories WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete story" });
  }
});
var media_default = router24;

// src/routes/hidden-messages.ts
import { Router as Router25 } from "express";
var router25 = Router25();
router25.post("/hidden-messages/clear-chat", rateLimiters.messages, authenticate, async (req, res) => {
  const authId = req.user.id;
  const clearedAt = (/* @__PURE__ */ new Date()).toISOString();
  try {
    await setChatClearedForUser(authId, clearedAt);
    res.json({ success: true, clearedAt });
  } catch (err) {
    console.error("clear-chat failed:", err);
    res.status(500).json({ error: "Failed to clear chat" });
  }
});
router25.get("/hidden-messages/:userId", rateLimiters.read, authenticate, async (req, res) => {
  const authId = req.user.id;
  const userId = String(req.params.userId);
  if (userId !== authId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const result = await db_default.execute(
      "SELECT message_id FROM hidden_messages WHERE user_id = $1",
      [userId]
    );
    const clearedAt = await getChatClearedAtForUser(userId);
    res.json({
      messageIds: result.rows.map((r) => String(r.message_id)),
      clearedAt
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch hidden messages" });
  }
});
router25.post("/hidden-messages", rateLimiters.messages, authenticate, async (req, res) => {
  const authId = req.user.id;
  const { userId, messageId } = req.body;
  if (!userId || !messageId || userId !== authId) {
    res.status(400).json({ error: "userId and messageId required" });
    return;
  }
  try {
    await db_default.execute(
      "INSERT INTO hidden_messages (user_id, message_id, hidden_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
      [userId, messageId, (/* @__PURE__ */ new Date()).toISOString()]
    );
    broadcast("message-hidden", { userId, messageId }, userId);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to hide message" });
  }
});
var hidden_messages_default = router25;

// src/routes/export.ts
import { Router as Router26 } from "express";
function getParam11(param) {
  return Array.isArray(param) ? param[0] : param;
}
var router26 = Router26();
router26.get("/export/:userId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const normalizedUserId = getParam11(userId);
    const authenticatedUserId = req.user.id;
    if (normalizedUserId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only export your own data" });
      return;
    }
    const profileResult = await db_default.execute(
      "SELECT * FROM profiles WHERE id = $1",
      [normalizedUserId]
    );
    const messagesResult = await db_default.execute(
      "SELECT * FROM messages WHERE deleted = 0 AND sender_id = $1 ORDER BY timestamp ASC",
      [normalizedUserId]
    );
    const duasResult = await db_default.execute(
      "SELECT * FROM duas WHERE user_id = $1 ORDER BY timestamp DESC",
      [normalizedUserId]
    );
    const exportData = {
      exportDate: (/* @__PURE__ */ new Date()).toISOString(),
      user: profileResult.rows[0] || null,
      messages: messagesResult.rows.map((row) => ({
        id: row.id,
        senderId: row.sender_id,
        text: decryptStoredField(row.text),
        type: row.type,
        audioData: decryptStoredField(row.audio_data),
        gifUrl: row.gif_url,
        imageData: decryptStoredField(row.image_data),
        timestamp: row.timestamp,
        liked: row.liked === 1,
        variant: row.variant,
        companionSticker: row.companion_sticker
      })),
      duas: duasResult.rows.map((row) => ({
        id: row.id,
        arabic: row.arabic,
        translation: row.translation,
        author: row.author,
        timestamp: row.timestamp
      }))
    };
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="grova-export-${normalizedUserId}-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json"`);
    res.json(exportData);
  } catch (err) {
    console.error("Failed to export data:", err);
    res.status(500).json({ error: "Failed to export data" });
  }
});
router26.get("/export/:userId/messages", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const normalizedUserId = getParam11(userId);
    const authenticatedUserId = req.user.id;
    if (normalizedUserId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only export your own data" });
      return;
    }
    const result = await db_default.execute(
      "SELECT * FROM messages WHERE deleted = 0 AND sender_id = $1 ORDER BY timestamp ASC",
      [normalizedUserId]
    );
    const messages = result.rows.map((row) => ({
      id: row.id,
      senderId: row.sender_id,
      text: decryptStoredField(row.text),
      type: row.type,
      audioData: decryptStoredField(row.audio_data),
      gifUrl: row.gif_url,
      imageData: decryptStoredField(row.image_data),
      timestamp: row.timestamp,
      liked: row.liked === 1,
      variant: row.variant,
      companionSticker: row.companion_sticker
    }));
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="grova-messages-${normalizedUserId}-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json"`);
    res.json(messages);
  } catch (err) {
    console.error("Failed to export messages:", err);
    res.status(500).json({ error: "Failed to export messages" });
  }
});
var export_default = router26;

// src/routes/couple-sync.ts
import { Router as Router27 } from "express";
var router27 = Router27();
function parseStoredNote(raw) {
  if (!raw) return { text: "", at: "" };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.text === "string") {
      return { text: parsed.text, at: parsed.at || "" };
    }
  } catch {
  }
  return { text: raw, at: (/* @__PURE__ */ new Date()).toISOString() };
}
function noteIfFresh(raw) {
  const { text, at } = parseStoredNote(raw);
  if (!text) return "";
  if (!at) return text;
  const age = Date.now() - new Date(at).getTime();
  if (age > 24 * 60 * 60 * 1e3) return "";
  return text;
}
function prefsFromRows(rows) {
  const prefs = {};
  for (const row of rows) prefs[row.key] = row.value;
  let quickEmojis = [];
  try {
    if (prefs.quick_emojis) {
      const parsed = JSON.parse(prefs.quick_emojis);
      if (Array.isArray(parsed)) {
        quickEmojis = parsed.filter((e) => typeof e === "string").slice(0, 5);
      }
    }
  } catch {
  }
  return {
    chatTheme: prefs.chat_theme || "default",
    appTheme: prefs.app_theme || "grova",
    readReceipts: prefs.read_receipts !== "off",
    showPresence: prefs.show_presence !== "off",
    notifications: prefs.notifications !== "off",
    noteMe: noteIfFresh(prefs.note_me || ""),
    noteWife: noteIfFresh(prefs.note_wife || ""),
    quickEmojis
  };
}
async function loadPrefsPayload() {
  const result = await db_default.execute("SELECT key, value FROM couple_prefs", []);
  return prefsFromRows(result.rows);
}
router27.get("/couple/prefs", rateLimiters.read, authenticate, async (_req, res) => {
  try {
    res.json(await loadPrefsPayload());
  } catch (err) {
    logger.error({ err }, "Failed to fetch couple prefs");
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
});
router27.put("/couple/prefs", rateLimiters.messages, authenticate, async (req, res) => {
  const { chatTheme, appTheme, readReceipts, showPresence, notifications, quickEmojis } = req.body;
  try {
    const upsert = async (key, value) => {
      await db_default.execute(
        `INSERT INTO couple_prefs (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, value]
      );
    };
    if (chatTheme !== void 0) await upsert("chat_theme", chatTheme);
    if (appTheme !== void 0) await upsert("app_theme", appTheme);
    if (readReceipts !== void 0) await upsert("read_receipts", readReceipts ? "on" : "off");
    if (showPresence !== void 0) await upsert("show_presence", showPresence ? "on" : "off");
    if (notifications !== void 0) await upsert("notifications", notifications ? "on" : "off");
    if (quickEmojis !== void 0) {
      await upsert("quick_emojis", JSON.stringify(quickEmojis.slice(0, 5)));
    }
    const payload = await loadPrefsPayload();
    broadcast("prefs-updated", payload);
    res.json(payload);
  } catch (err) {
    logger.error({ err }, "Failed to update couple prefs");
    res.status(500).json({ error: "Failed to update preferences" });
  }
});
router27.get("/couple/notes", rateLimiters.read, authenticate, async (_req, res) => {
  try {
    const payload = await loadPrefsPayload();
    res.json({ me: payload.noteMe, wife: payload.noteWife });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});
router27.put("/couple/notes", rateLimiters.messages, authenticate, async (req, res) => {
  const userId = req.user.id;
  const { text } = req.body;
  if (text === void 0) {
    res.status(400).json({ error: "text required" });
    return;
  }
  const key = userId === "wife" ? "note_wife" : "note_me";
  const trimmed = text.slice(0, 60);
  const payload = JSON.stringify({ text: trimmed, at: (/* @__PURE__ */ new Date()).toISOString() });
  try {
    await db_default.execute(
      `INSERT INTO couple_prefs (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [key, payload]
    );
    broadcast("note-updated", { userId, text: trimmed });
    const notes = await loadPrefsPayload();
    res.json({ me: notes.noteMe, wife: notes.noteWife });
  } catch (err) {
    res.status(500).json({ error: "Failed to save note" });
  }
});
router27.get("/couple/activity", rateLimiters.read, authenticate, async (_req, res) => {
  try {
    const [result, profilesResult] = await Promise.all([
      db_default.execute(
        "SELECT id, type, actor_id, from_name, text, timestamp, read FROM activity_feed ORDER BY timestamp DESC LIMIT 50",
        []
      ),
      db_default.execute("SELECT id, name FROM profiles WHERE id IN ('me', 'wife')", [])
    ]);
    const nameByActor = new Map(
      profilesResult.rows.map((row) => {
        const r = row;
        return [r.id, r.name];
      })
    );
    res.json({
      notifications: result.rows.map((r) => {
        const actorId = r.actor_id ? String(r.actor_id) : void 0;
        const currentName = actorId ? nameByActor.get(actorId) : void 0;
        return {
          id: r.id,
          type: r.type,
          actorId,
          fromName: currentName || r.from_name,
          text: r.text,
          timestamp: r.timestamp,
          read: r.read === 1 || r.read === true
        };
      })
    });
  } catch (err) {
    logger.error({ err }, "Failed to fetch activity");
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});
router27.post("/couple/activity", rateLimiters.messages, authenticate, async (req, res) => {
  const userId = req.user.id;
  const { type, text } = req.body;
  if (!type || !text) {
    res.status(400).json({ error: "type and text required" });
    return;
  }
  try {
    const fromName = await profileDisplayName(userId);
    await postCoupleActivity(type, userId, fromName, text);
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Failed to add activity");
    res.status(500).json({ error: "Failed to add notification" });
  }
});
router27.put("/couple/activity/read-all", rateLimiters.messages, authenticate, async (_req, res) => {
  try {
    await db_default.execute("UPDATE activity_feed SET read = 1", []);
    broadcast("activity-read-all", {});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark read" });
  }
});
router27.delete("/couple/activity", rateLimiters.messages, authenticate, async (_req, res) => {
  try {
    await db_default.execute("DELETE FROM activity_feed", []);
    broadcast("activity-read-all", {});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear notifications" });
  }
});
var couple_sync_default = router27;

// src/routes/index.ts
var router28 = Router28();
router28.use(sanitizeInput);
router28.use(csrfProtection);
router28.use(validateRouteParams({}));
router28.use(health_default);
router28.use(events_default);
router28.use(calendar_events_default);
router28.use(checkins_default);
router28.use(tasks_default);
router28.use(milestones_default);
router28.use(secret_notes_default);
router28.use(presence_default);
router28.use(profile_default);
router28.use(auth_default);
router28.use(messages_default);
router28.use(duas_default);
router28.use(call_default);
router28.use(images_default);
router28.use(notifications_default);
router28.use(twoFactor_default);
router28.use(reactions_default);
router28.use(typing_default);
router28.use(readReceipts_default);
router28.use(forward_default);
router28.use(edit_default);
router28.use(pin_default);
router28.use(schedule_default);
router28.use(media_default);
router28.use(hidden_messages_default);
router28.use(export_default);
router28.use(couple_sync_default);
var routes_default = router28;

// src/lib/compression.ts
import compression from "compression";
function setupCompression(app2) {
  app2.use(compression({
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
    threshold: 1024,
    // Only compress responses larger than 1KB
    level: 6
    // Compression level (1-9)
  }));
}

// src/app.ts
if (!process.env.VERCEL) {
  validateEnv();
}
var app = express();
app.disable("x-powered-by");
app.use((req, _res, next) => {
  const url = req.url ?? "";
  const pathOnly = url.split("?")[0];
  const qs = url.includes("?") ? url.slice(url.indexOf("?")) : "";
  if (!pathOnly.startsWith("/api/") && !pathOnly.startsWith("/api")) {
    if (pathOnly.startsWith("/auth/") || pathOnly === "/healthz" || pathOnly.startsWith("/messages") || pathOnly.startsWith("/profile")) {
      req.url = `/api${pathOnly}${qs}`;
    }
  }
  next();
});
app.set("trust proxy", process.env.TRUSTED_PROXIES || (process.env.NODE_ENV === "production" ? "loopback, linklocal, uniquelocal" : false));
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0]
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode
        };
      }
    }
  })
);
setupCompression(app);
setupSecurity(app);
var isDev = process.env.NODE_ENV !== "production";
function buildAllowedOrigins() {
  const fromEnv = (process.env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean);
  const vercelHosts = [
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
  ].filter(Boolean).map((h) => h.startsWith("http") ? h : `https://${h}`);
  const devDefaults = ["http://localhost:5000", "http://127.0.0.1:5000"];
  const merged = [.../* @__PURE__ */ new Set([...fromEnv, ...vercelHosts, ...isDev ? devDefaults : []])];
  return merged.length > 0 ? merged : devDefaults;
}
var allowedOrigins = buildAllowedOrigins();
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (isDev) {
      if (origin.includes("localhost") || origin.includes("127.0.0.1") || origin.includes("10.") || origin.includes("192.")) {
        callback(null, true);
      } else {
        logger.warn({ origin, allowedOrigins }, "CORS request from unexpected origin");
        callback(null, true);
      }
    } else if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-CSRF-Token",
    "X-Primary-Token",
    "X-Client-Id",
    "X-Client-Origin"
  ]
}));
app.use(cookieParser());
app.post(
  "/api/media/upload-binary",
  rateLimiters.upload,
  csrfProtection,
  authenticate,
  express.raw({ type: () => true, limit: 60 * 1024 * 1024 }),
  handleBinaryMediaUpload
);
app.use(express.json({ limit: "40mb" }));
app.use(express.urlencoded({ extended: true, limit: "40mb" }));
app.use("/api", blockSuspiciousBots);
app.use("/api", sanitizeInput);
app.use("/api", csrfProtection);
var limiter = rateLimit2({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: process.env.NODE_ENV === "production" ? 600 : 4e3,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => false
});
app.use("/api", limiter);
app.use("/api", routes_default);
var staticDir = path2.resolve(
  path2.dirname(fileURLToPath2(import.meta.url)),
  "../../instagram-clone/dist"
);
if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path2.join(staticDir, "index.html"));
  });
  logger.info({ staticDir }, "Serving Grova frontend");
} else if (process.env.NODE_ENV === "production") {
  logger.warn(
    { staticDir },
    "Frontend dist not found \u2014 run pnpm build:grova before pnpm start:grova"
  );
}
var app_default = app;

// src/lib/schedule-worker.ts
import { randomUUID as randomUUID17 } from "crypto";
async function deliverScheduledRow(row) {
  const id = randomUUID17();
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const senderId = String(row.sender_id);
  const type = String(row.type || "text");
  const text = row.text ? decryptStoredField(row.text) : void 0;
  const audioData = decryptStoredField(row.audio_data);
  const gifUrl = row.gif_url ? String(row.gif_url) : void 0;
  const imageData = decryptStoredField(row.image_data);
  const variant = row.variant ? String(row.variant) : "default";
  const companionSticker = row.companion_sticker ? String(row.companion_sticker) : void 0;
  await db_default.execute(
    `INSERT INTO messages (id, sender_id, text, type, audio_data, gif_url, image_data, image_url, timestamp, liked, deleted, variant, companion_sticker)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
      id,
      senderId,
      encryptStoredField(text) ?? null,
      type,
      encryptStoredField(audioData) ?? null,
      gifUrl ?? null,
      encryptStoredField(imageData) ?? null,
      null,
      timestamp,
      0,
      0,
      variant,
      companionSticker ?? null
    ]
  );
  await db_default.execute("UPDATE scheduled_messages SET sent = 1 WHERE id = $1", [String(row.id)]);
  broadcast("new-message", {
    id,
    senderId,
    text,
    type,
    audioData,
    gifUrl,
    imageData,
    timestamp,
    liked: false,
    variant,
    companionSticker
  });
}
function startScheduleWorker() {
  const tick = async () => {
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const result = await db_default.execute(
        "SELECT * FROM scheduled_messages WHERE sent = 0 AND scheduled_at <= $1 ORDER BY scheduled_at ASC LIMIT 20",
        [now]
      );
      for (const row of result.rows) {
        try {
          await deliverScheduledRow(row);
        } catch (err) {
          logger.error({ err, id: row.id }, "Failed to deliver scheduled message");
        }
      }
    } catch (err) {
      logger.error({ err }, "Schedule worker tick failed");
    }
  };
  void tick();
  setInterval(tick, 3e4);
  logger.info("Schedule message worker started");
}

// src/index.ts
var encryptionPassword = process.env.ENCRYPTION_PASSWORD;
if (!encryptionPassword) {
  throw new Error("ENCRYPTION_PASSWORD is required but not set");
}
if (!authenticateEncryption(encryptionPassword)) {
  throw new Error("Failed to authenticate encryption - invalid ENCRYPTION_PASSWORD");
}
var port = Number(process.env.PORT ?? 5001);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env.PORT}"`);
}
async function start() {
  app_default.listen(port, "0.0.0.0", (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port, host: "0.0.0.0" }, "Server listening");
  });
  for (let attempt = 1; attempt <= 8; attempt++) {
    try {
      await initDb();
      logger.info("Database initialized");
      startScheduleWorker();
      return;
    } catch (err) {
      logger.error({ err, attempt }, "Database init failed");
      if (attempt < 8) {
        await new Promise((r) => setTimeout(r, Math.min(3e3 * attempt, 15e3)));
      }
    }
  }
  logger.error("Database could not be initialized after retries");
  process.exit(1);
}
if (!process.env.VERCEL) {
  start();
}
//# sourceMappingURL=index.mjs.map
