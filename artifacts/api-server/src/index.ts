import "./lib/load-env";
import app from "./app";
import { logger } from "./lib/logger";
import { initDb } from "./lib/db";
import { startScheduleWorker } from "./lib/schedule-worker";
import { authenticateEncryption } from "./lib/encryption";

// Authenticate encryption on startup using password from .env
const encryptionPassword = process.env.ENCRYPTION_PASSWORD;
if (!encryptionPassword) {
  throw new Error("ENCRYPTION_PASSWORD is required but not set");
}

if (!authenticateEncryption(encryptionPassword)) {
  throw new Error("Failed to authenticate encryption - invalid ENCRYPTION_PASSWORD");
}

const port = Number(process.env.PORT ?? 5001);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env.PORT}"`);
}

async function start() {
  // Start HTTP immediately so health checks / dev proxy don't time out while DB connects
  app.listen(port, "0.0.0.0", (err) => {
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
        await new Promise((r) => setTimeout(r, Math.min(3000 * attempt, 15000)));
      }
    }
  }

  logger.error("Database could not be initialized after retries");
  process.exit(1);
}

start();
