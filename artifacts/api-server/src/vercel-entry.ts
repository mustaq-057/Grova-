import "./lib/load-env";

process.env.VERCEL ??= "1";

import app from "./app";
import { initDb } from "./lib/db";
import { authenticateEncryption } from "./lib/encryption";
import { validateEnv } from "./lib/security";
import { logger } from "./lib/logger";

let ready: Promise<void> | null = null;
let readyError: string | null = null;

function ensureReady(): Promise<void> {
  if (readyError) return Promise.reject(new Error(readyError));
  if (!ready) {
    ready = (async () => {
      try {
        validateEnv();
        const encryptionPassword = process.env.ENCRYPTION_PASSWORD;
        if (!encryptionPassword) {
          throw new Error("ENCRYPTION_PASSWORD is required");
        }
        if (!authenticateEncryption(encryptionPassword)) {
          throw new Error("Invalid ENCRYPTION_PASSWORD");
        }
        await initDb();
        logger.info("Vercel handler: database ready");
      } catch (err) {
        ready = null;
        readyError = err instanceof Error ? err.message : String(err);
        throw err;
      }
    })();
  }
  return ready;
}

/** Restore full /api/... path when a rewrite collapses the URL to /api only. */
function restoreRequestPath(req: import("http").IncomingMessage): void {
  const current = (req.url ?? "").split("?")[0];
  if (current && current !== "/api" && current !== "/api/") return;

  const raw =
    (typeof req.headers["x-vercel-original-url"] === "string" && req.headers["x-vercel-original-url"]) ||
    (typeof req.headers["x-invoke-path"] === "string" && req.headers["x-invoke-path"]) ||
    "";
  if (!raw) return;

  try {
    const pathname = raw.startsWith("http") ? new URL(raw).pathname : raw.split("?")[0];
    if (pathname.startsWith("/api/") && pathname.length > "/api/".length) {
      const qs = req.url?.includes("?") ? `?${req.url.split("?")[1]}` : "";
      req.url = pathname + qs;
    }
  } catch {
    /* keep req.url */
  }
}

function sendJson(
  res: import("http").ServerResponse,
  status: number,
  body: Record<string, unknown>,
): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

/** Vercel serverless entry — Express handles /api/* */
export default async function handler(req: import("http").IncomingMessage, res: import("http").ServerResponse) {
  restoreRequestPath(req);
  try {
    await ensureReady();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[vercel] startup failed:", message);
    sendJson(res, 503, {
      error: message,
      hint: "Fix Environment Variables on Vercel (Settings → Environment Variables) and redeploy.",
    });
    return;
  }
  return app(req, res);
}
