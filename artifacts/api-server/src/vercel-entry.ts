import "./lib/load-env";
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

/** Vercel serverless entry — Express handles /api/* */
export default async function handler(req: import("http").IncomingMessage, res: import("http").ServerResponse) {
  await ensureDb();
  return app(req, res);
}
