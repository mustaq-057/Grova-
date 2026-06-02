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
import { setupSecurity, validateEnv, blockSuspiciousBots, csrfProtection, sanitizeInput } from "./lib/security";
import { setupCompression } from "./lib/compression";

// Validate environment variables on startup
validateEnv();

const app: Express = express();
app.disable("x-powered-by");
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

// Configure CORS with specific origin (not open)
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5000', 'http://127.0.0.1:5000'];

const isDev = process.env.NODE_ENV !== 'production';

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin requests, mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // For development, allow all localhost and 127.0.0.1 origins, plus network interfaces
    if (isDev) {
      if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('10.') || origin.includes('192.')) {
        callback(null, true);
      } else {
        logger.warn({ origin, allowedOrigins }, 'CORS request from unexpected origin');
        callback(null, true); // Allow anyway in dev mode
      }
    } else if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

app.use(cookieParser());
app.use(express.json({ limit: '40mb' }));
app.use(express.urlencoded({ extended: true, limit: '40mb' }));
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
