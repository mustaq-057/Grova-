import { Request, Response, NextFunction } from "express";
import { randomBytes } from "crypto";
import db from "./db";
import { logger } from "./logger";
import { AuthenticatedRequest } from "../types";

// Session management interface
interface SessionData {
  userId: string;
  username: string;
  createdAt: number;
  expiresAt: number;
  csrfToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: number;
  deviceId: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    lastSeen: number;
  };
}

const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
const REFRESH_TOKEN_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

// Device tracking
interface DeviceInfo {
  id: string;
  userId: string;
  userAgent: string;
  ip: string;
  createdAt: number;
  lastSeen: number;
}

// Generate device ID
function generateDeviceId(): string {
  const randomBytesBuffer = randomBytes(16);
  return randomBytesBuffer.toString('hex');
}

// Generate CSRF token
function generateCSRFToken(): string {
  const randomBytesBuffer = randomBytes(32);
  return randomBytesBuffer.toString('hex');
}

// Generate session token using cryptographically secure random bytes
function generateSessionToken(): string {
  const timestamp = Date.now().toString(36);
  const randomBytesBuffer = randomBytes(32);
  const randomString = randomBytesBuffer.toString('base64');
  return `${timestamp}.${randomString}`;
}

// Create session
export async function createSession(userId: string, username: string, userAgent?: string, ip?: string): Promise<{ token: string; csrfToken: string; refreshToken: string; deviceId: string }> {
  const token = generateSessionToken();
  const csrfToken = generateCSRFToken();
  const refreshToken = generateSessionToken();
  const deviceId = generateDeviceId();
  const now = Date.now();
  
  try {
    // Create device record
    await db.execute(
      `INSERT INTO devices (id, user_id, user_agent, ip, created_at, last_seen) VALUES (?, ?, ?, ?, ?, ?)`,
      [deviceId, userId, userAgent || 'Unknown', ip || 'Unknown', now, now]
    );
    
    // Create session record
    await db.execute(
      `INSERT INTO sessions (token, user_id, username, created_at, expires_at, csrf_token, refresh_token, refresh_token_expires_at, device_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [token, userId, username, now, now + SESSION_DURATION, csrfToken, refreshToken, now + REFRESH_TOKEN_DURATION, deviceId]
    );
    
    return { token, csrfToken, refreshToken, deviceId };
  } catch (err) {
    logger.error({ err, userId }, "Failed to create session");
    throw err;
  }
}

// Validate session
export async function validateSession(token: string): Promise<SessionData | null> {
  try {
    const result = await db.execute(
      "SELECT * FROM sessions WHERE token = ? AND expires_at > ?",
      [token, Date.now()]
    );
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0] as any;
    return {
      userId: row.user_id as string,
      username: row.username as string,
      createdAt: row.created_at as number,
      expiresAt: row.expires_at as number,
      csrfToken: row.csrf_token as string,
      refreshToken: row.refresh_token as string,
      refreshTokenExpiresAt: row.refresh_token_expires_at as number,
      deviceId: row.device_id as string,
      deviceInfo: {
        userAgent: 'Unknown',
        ip: 'Unknown',
        lastSeen: Date.now(),
      },
    };
  } catch (err) {
    logger.error({ err }, "Failed to validate session");
    return null;
  }
}

// Validate refresh token
export async function validateRefreshToken(refreshToken: string): Promise<SessionData | null> {
  try {
    const result = await db.execute(
      "SELECT * FROM sessions WHERE refresh_token = ? AND refresh_token_expires_at > ?",
      [refreshToken, Date.now()]
    );
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0] as any;
    return {
      userId: row.user_id as string,
      username: row.username as string,
      createdAt: row.created_at as number,
      expiresAt: row.expires_at as number,
      csrfToken: row.csrf_token as string,
      refreshToken: row.refresh_token as string,
      refreshTokenExpiresAt: row.refresh_token_expires_at as number,
      deviceId: row.device_id as string,
      deviceInfo: {
        userAgent: 'Unknown',
        ip: 'Unknown',
        lastSeen: Date.now(),
      },
    };
  } catch (err) {
    console.error("Failed to validate refresh token:", err);
    return null;
  }
}

// Refresh session token
export async function refreshSession(refreshToken: string): Promise<{ token: string; csrfToken: string; refreshToken: string } | null> {
  const session = await validateRefreshToken(refreshToken);
  if (!session) return null;
  
  // Generate new tokens
  const newToken = generateSessionToken();
  const newCsrfToken = generateCSRFToken();
  const newRefreshToken = generateSessionToken();
  const now = Date.now();
  
  try {
    // Delete old session
    await db.execute("DELETE FROM sessions WHERE refresh_token = ?", [refreshToken]);
    
    // Create new session
    await db.execute(
      `INSERT INTO sessions (token, user_id, username, created_at, expires_at, csrf_token, refresh_token, refresh_token_expires_at, device_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newToken, session.userId, session.username, now, now + SESSION_DURATION, newCsrfToken, newRefreshToken, now + REFRESH_TOKEN_DURATION, session.deviceId]
    );
    
    return { token: newToken, csrfToken: newCsrfToken, refreshToken: newRefreshToken };
  } catch (err) {
    logger.error({ err }, "Failed to refresh session");
    return null;
  }
}

// Get all devices for a user
export async function getUserDevices(userId: string): Promise<DeviceInfo[]> {
  try {
    const result = await db.execute(
      "SELECT * FROM devices WHERE user_id = ?",
      [userId]
    );
    
    return result.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userAgent: row.user_agent,
      ip: row.ip,
      createdAt: row.created_at,
      lastSeen: row.last_seen,
    }));
  } catch (err) {
    console.error("Failed to get user devices:", err);
    return [];
  }
}

// Revoke device (delete all sessions for that device)
export async function revokeDevice(userId: string, deviceId: string): Promise<boolean> {
  try {
    // Check if device belongs to user
    const deviceResult = await db.execute(
      "SELECT * FROM devices WHERE id = ? AND user_id = ?",
      [deviceId, userId]
    );
    
    if (deviceResult.rows.length === 0) return false;
    
    // Remove device
    await db.execute("DELETE FROM devices WHERE id = ?", [deviceId]);
    
    // Remove all sessions for this device
    await db.execute("DELETE FROM sessions WHERE device_id = ?", [deviceId]);
    
    return true;
  } catch (err) {
    console.error("Failed to revoke device:", err);
    return false;
  }
}

// Update device last seen
export async function updateDeviceLastSeen(deviceId: string): Promise<void> {
  try {
    await db.execute(
      "UPDATE devices SET last_seen = ? WHERE id = ?",
      [Date.now(), deviceId]
    );
  } catch (err) {
    logger.error({ err, deviceId }, "Failed to update device last seen");
  }
}

// Validate CSRF token
export async function validateCSRFToken(token: string, csrfToken: string): Promise<boolean> {
  try {
    const result = await db.execute(
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

// Get CSRF token from session
export async function getCSRFToken(token: string): Promise<string | null> {
  try {
    const result = await db.execute(
      "SELECT csrf_token, expires_at FROM sessions WHERE token = ? AND expires_at > ?",
      [token, Date.now()]
    );
    
    if (result.rows.length === 0) return null;
    
    return result.rows[0].csrf_token as string | null;
  } catch (err) {
    console.error("Failed to get CSRF token:", err);
    return null;
  }
}

// Destroy session
export async function destroySession(token: string): Promise<void> {
  try {
    await db.execute("DELETE FROM sessions WHERE token = ?", [token]);
  } catch (err) {
    logger.error({ err }, "Failed to destroy session");
  }
}

// Authentication middleware
export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const cookieToken =
    req && typeof (req as unknown as { cookies?: Record<string, string> }).cookies?.grova_token === "string"
      ? (req as unknown as { cookies: Record<string, string> }).cookies.grova_token
      : undefined;
  
  if ((!authHeader || !authHeader.startsWith('Bearer ')) && !cookieToken) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }
  
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : cookieToken!;
  const session = await validateSession(token);
  
  if (!session) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    return;
  }
  
  // Update device last seen
  await updateDeviceLastSeen(session.deviceId);
  
  // Attach user info to request
  req.user = {
    id: session.userId,
    username: session.username,
    deviceId: session.deviceId,
  };
  
  next();
}

/** For GET file view links opened in a new tab (Bearer header or ?token= query). */
export async function authenticateBearerOrQuery(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  const queryToken = typeof req.query.token === "string" ? req.query.token : undefined;
  const token =
    authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : queryToken;

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
    deviceId: session.deviceId,
  };
  next();
}

// Optional authentication - doesn't fail if no token
export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const session = await validateSession(token);
    
    if (session) {
      req.user = {
        id: session.userId,
        username: session.username,
        deviceId: session.deviceId,
      };
    }
  }
  
  next();
}

// Clean up expired sessions periodically (database cleanup)
let cleanupInterval: NodeJS.Timeout | null = null;

export function startSessionCleanup(): void {
  if (cleanupInterval) {
    logger.warn("Session cleanup already running");
    return;
  }
  
  cleanupInterval = setInterval(async () => {
    try {
      await db.execute("DELETE FROM sessions WHERE expires_at < ?", [Date.now()]);
    } catch (err) {
      logger.error({ err }, "Failed to clean up expired sessions");
    }
  }, 60 * 60 * 1000); // Clean up every hour
  
  logger.info("Session cleanup started");
}

export function stopSessionCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    logger.info("Session cleanup stopped");
  }
}

// Start cleanup on module load
startSessionCleanup();
