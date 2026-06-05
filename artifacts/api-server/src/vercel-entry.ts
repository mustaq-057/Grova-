import "./lib/load-env";

process.env.VERCEL ??= "1";

import app from "./app";
import { initDb } from "./lib/db";
import { authenticateEncryption } from "./lib/encryption";
import { logger } from "./lib/logger";

const encryptionPassword = process.env.ENCRYPTION_PASSWORD;
if (!encryptionPassword) {
  throw new Error("ENCRYPTION_PASSWORD is required");
}
if (!authenticateEncryption(encryptionPassword)) {
  throw new Error("Invalid ENCRYPTION_PASSWORD");
}

let ready: Promise<void> | null = null;

function ensureDb(): Promise<void> {
  if (!ready) {
    ready = initDb()
      .then(() => logger.info("Vercel handler: database ready"))
      .catch((err) => {
        ready = null;
        throw err;
      });
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

/** Vercel serverless entry — Express handles /api/* */
export default async function handler(req: import("http").IncomingMessage, res: import("http").ServerResponse) {
  restoreRequestPath(req);
  await ensureDb();
  return app(req, res);
}
