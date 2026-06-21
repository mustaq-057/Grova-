import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import router from "./routes";
import { logger } from "./lib/logger";
import { setupSecurity, validateEnv, blockSuspiciousBots, csrfProtection, sanitizeInput, rateLimiters } from "./lib/security";
import { authenticate } from "./lib/auth-middleware";
import { handleBinaryMediaUpload } from "./routes/images";
import { setupCompression } from "./lib/compression";

// Validate environment variables on startup (Vercel defers to vercel-entry ensureReady).
if (!process.env.VERCEL) {
  validateEnv();
}

const app: Express = express();
app.disable("x-powered-by");

/** Vercel catch-all may deliver paths without the /api prefix — normalize before routing. */
app.use((req, _res, next) => {
  const url = req.url ?? "";
  const pathOnly = url.split("?")[0];
  const qs = url.includes("?") ? url.slice(url.indexOf("?")) : "";
  if (!pathOnly.startsWith("/api/") && !pathOnly.startsWith("/api")) {
    if (
      pathOnly.startsWith("/auth/") ||
      pathOnly === "/healthz" ||
      pathOnly.startsWith("/messages") ||
      pathOnly.startsWith("/profile")
    ) {
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
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Setup compression
setupCompression(app);

// Setup security headers
setupSecurity(app);

const isDev = process.env.NODE_ENV !== "production";

function buildAllowedOrigins(): string[] {
  const fromEnv = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const vercelHosts = [
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ]
    .filter(Boolean)
    .map((h) => (h!.startsWith("http") ? h! : `https://${h}`));
  const devDefaults = ["http://localhost:5000", "http://127.0.0.1:5000"];
  const merged = [...new Set([...fromEnv, ...vercelHosts, ...(isDev ? devDefaults : [])])];
  return merged.length > 0 ? merged : devDefaults;
}

const allowedOrigins = buildAllowedOrigins();

const corsOptions = {
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-CSRF-Token",
    "X-Primary-Token",
    "X-Client-Id",
    "X-Client-Origin",
    "X-File-Name",
  ],
};

function isOriginAllowed(origin: string | undefined, requestHost: string): boolean {
  if (!origin) return true;
  if (isDev) {
    if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('10.') || origin.includes('192.')) {
      return true;
    }
    logger.warn({ origin, allowedOrigins }, 'CORS request from unexpected origin');
    return true;
  }
  if (allowedOrigins.includes(origin)) return true;
  try {
    const originHost = new URL(origin).host;
    if (originHost && requestHost && originHost === requestHost) return true;
  } catch {
    /* ignore */
  }
  return false;
}

app.use((req, res, next) => {
  const requestHost = String(req.headers.host || "").split(":")[0];
  cors({
    ...corsOptions,
    origin: (origin, callback) => {
      if (isOriginAllowed(origin, requestHost)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  })(req, res, next);
});

app.use(cookieParser());

// Binary uploads must be parsed before express.json consumes the body.
app.post(
  "/api/media/upload-binary",
  rateLimiters.upload,
  csrfProtection,
  authenticate,
  express.raw({ type: () => true, limit: 200 * 1024 * 1024 }),
  handleBinaryMediaUpload,
);

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));
app.use("/api", blockSuspiciousBots);
app.use("/api", sanitizeInput);
app.use("/api", csrfProtection);

// Global rate limiting to prevent abuse (disabled for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 600 : 4000,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => false,
});

app.use("/api", limiter);

app.use("/api", router);

const staticDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../instagram-clone/dist",
);

if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
  logger.info({ staticDir }, "Serving Grova frontend");
} else if (process.env.NODE_ENV === "production") {
  logger.warn(
    { staticDir },
    "Frontend dist not found — run pnpm build:grova before pnpm start:grova",
  );
}

export default app;
