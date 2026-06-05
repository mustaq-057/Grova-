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

function pathnameFromHeader(raw: string): string | null {
  try {
    const pathname = raw.startsWith("http") ? new URL(raw).pathname : raw.split("?")[0];
    if (!pathname.startsWith("/api/") || pathname === "/api/") return null;
    return pathname;
  } catch {
    return null;
  }
}

/**
 * Vercel rewrites /api/foo/bar → /api?__path=foo/bar (see vercel.json).
 * Prefer original-path headers first — query __path often truncates at "/" (e.g. auth only).
 */
function restoreRequestPath(req: import("http").IncomingMessage): void {
  const rawUrl = req.url ?? "/";
  const qIndex = rawUrl.indexOf("?");
  const pathOnly = qIndex >= 0 ? rawUrl.slice(0, qIndex) : rawUrl;
  if (pathOnly.length > "/api".length && pathOnly !== "/api/") return;

  const headers = req.headers;
  const headerCandidates = [
    headers["x-vercel-original-url"],
    headers["x-invoke-path"],
    headers["x-forwarded-uri"],
    headers["x-original-url"],
    headers["x-matched-path"],
    headers["x-vercel-sc-path"],
  ].filter((h): h is string => typeof h === "string" && h.length > 0);

  for (const raw of headerCandidates) {
    const pathname = pathnameFromHeader(raw);
    if (!pathname) continue;
    const qsFromReq = rawUrl.includes("?") ? rawUrl.slice(rawUrl.indexOf("?")) : "";
    const qsFromRaw = raw.includes("?") ? `?${raw.split("?").slice(1).join("?")}` : "";
    req.url = pathname + (qsFromReq || qsFromRaw);
    return;
  }

  try {
    const parsed = new URL(rawUrl, "http://grova.internal");
    const sub = parsed.searchParams.get("__path");
    if (sub) {
      parsed.searchParams.delete("__path");
      const restQs = parsed.search;
      const decoded = decodeURIComponent(sub).replace(/^\//, "");
      req.url = `/api/${decoded}${restQs}`;
    }
  } catch {
    /* leave url as-is */
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
