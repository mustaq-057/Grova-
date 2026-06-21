/**
 * Smoke-test Cloudinary credentials from .env (sign + ping).
 *   pnpm test:cloudinary
 */
import { config } from "dotenv";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: join(repoRoot, ".env") });

const url = process.env.CLOUDINARY_URL?.trim();
if (!url?.startsWith("cloudinary://")) {
  console.error("FAIL: CLOUDINARY_URL not set in .env");
  process.exit(1);
}

const match = url.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
if (!match) {
  console.error("FAIL: Invalid CLOUDINARY_URL format");
  process.exit(1);
}

const [, apiKey, apiSecret, cloudName] = match;
cloudinary.config({ cloud_name: cloudName.trim(), api_key: apiKey.trim(), api_secret: apiSecret.trim(), secure: true });

try {
  await cloudinary.api.ping();
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request({ timestamp, resource_type: "raw" }, apiSecret.trim());
  console.log("OK Cloudinary ping");
  console.log("  cloud:", cloudName.trim());
  console.log("  apiKey:", apiKey.trim());
  console.log("  raw sign:", signature.slice(0, 12) + "…");
} catch (err) {
  console.error("FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
}
