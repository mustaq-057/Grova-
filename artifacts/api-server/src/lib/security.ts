import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { validateCSRFToken } from "./auth-middleware";

const cspDirectives = {
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
    "https://i.giphy.com",
  ],
  connectSrc: [
    "'self'",
    "https://api.giphy.com",
    "https://images.unsplash.com",
    "https://res.cloudinary.com",
    "https://media.giphy.com",
    "https://i.giphy.com",
  ],
  fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'", "https://media.giphy.com", "https://res.cloudinary.com", "https:"],
  frameSrc: ["'none'"],
};

// Content Security Policy
export function setupSecurity(app: any): void {
  const isProd = process.env.NODE_ENV === "production";

  app.use(
    helmet({
      contentSecurityPolicy: isProd ? { directives: cspDirectives } : false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      hsts: isProd
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
    }),
  );
}

// Rate limiters for different endpoints
export const rateLimiters = {
  // Strict rate limit for auth endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "production" ? 12 : 5,
    message: { error: 'Too many authentication attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => false,
  }),
  
  // Moderate rate limit for message operations (disabled for development)
  messages: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: process.env.NODE_ENV === "production" ? 240 : 2000,
    message: { error: 'Too many message requests, please slow down' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => false,
  }),
  
  // Lenient rate limit for read operations
  read: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: { error: 'Too many requests, please slow down' },
    standardHeaders: true,
    legacyHeaders: false,
  }),
  
  // Strict rate limit for file uploads
  upload: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "production" ? 30 : 60,
    message: { error: 'Too many upload attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  }),
};

// CSRF protection middleware with proper session validation (disabled for development)
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    next();
    return;
  }

  const skipPaths = new Set([
    "/auth/primary-login",
    "/auth/login",
    "/auth/refresh",
  ]);
  if (skipPaths.has(req.path)) {
    next();
    return;
  }

  const token = (req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : (req as unknown as { cookies?: Record<string, string> }).cookies?.grova_token) || "";
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

// Input sanitization with improved XSS protection
export function sanitizeInput(req: Request, res: Response, next: NextFunction): void {
  if (req.body) {
    // Remove potential XSS vectors with improved sanitization
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        // Skip sanitization for base64 data-URIs (images, audio, etc.)
        // and E2E encrypted payloads — these are binary data that must
        // not be character-encoded or they will be corrupted.
        if (obj.startsWith('data:') || obj.startsWith('e2e:') || /^https?:\/\//i.test(obj)) {
          return obj;
        }

        // Strip dangerous markup/protocols; React escapes text on render so avoid entity-encoding
        let sanitized = obj
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/on\w+\s*=\s*["'].*?["']/gi, "")
          .replace(/javascript:/gi, "")
          .replace(/vbscript:/gi, "")
          .replace(/file:/gi, "");
        
        // Limit string length to prevent DoS
        if (sanitized.length > 10000) {
          sanitized = sanitized.substring(0, 10000);
        }
        
        return sanitized;
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }
      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          // Sanitize object keys as well
          const sanitizedKey = key.replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

// Environment variable validation
export function validateEnv(): void {
  const required = ['ENCRYPTION_KEY', 'ENCRYPTION_PASSWORD'];
  const missing: string[] = [];
  
  for (const envVar of required) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate encryption key length
  const encryptionKey = process.env.ENCRYPTION_KEY!;
  if (encryptionKey.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 characters (32 bytes in hex)');
  }
  
  // Validate encryption password exists and is not empty
  const encryptionPassword = process.env.ENCRYPTION_PASSWORD!;
  if (encryptionPassword.length < 8) {
    throw new Error('ENCRYPTION_PASSWORD must be at least 8 characters long');
  }

  const primaryEmails = (process.env.PRIMARY_AUTH_EMAILS || "").trim();
  const primaryPasswords = (process.env.PRIMARY_AUTH_PASSWORDS || "").trim();
  const primaryPasswordDirect = [
    process.env.PRIMARY_AUTH_PASSWORD_1,
    process.env.PRIMARY_AUTH_PASSWORD_2,
    process.env.PRIMARY_AUTH_PASSWORD_3,
    process.env.PRIMARY_AUTH_PASSWORD_4,
  ].some((p) => String(p || "").trim());
  const primaryPasswordHashes = (process.env.PRIMARY_AUTH_PASSWORD_HASHES || "").trim();
  if (!primaryEmails || (!primaryPasswords && !primaryPasswordDirect && !primaryPasswordHashes)) {
    throw new Error("PRIMARY_AUTH_EMAILS and at least one PRIMARY_AUTH_PASSWORD (or hash) are required");
  }

  if (process.env.NODE_ENV === "production") {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").trim();
    if (!allowedOrigins) {
      throw new Error("ALLOWED_ORIGINS is required in production");
    }
  }
}

const suspiciousAgentPattern =
  /(bot|spider|crawler|scrapy|curl|wget|python-requests|httpclient|go-http-client|postmanruntime)/i;

export function blockSuspiciousBots(req: Request, res: Response, next: NextFunction): void {
  const userAgent = String(req.headers["user-agent"] || "");
  if (!userAgent || suspiciousAgentPattern.test(userAgent)) {
    res.status(403).json({ error: "Access denied" });
    return;
  }
  next();
}
