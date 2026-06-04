import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const apiServerRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const repoRoot = path.resolve(apiServerRoot, "../..");

/** Local dev: load repo-root .env. Vercel/production inject env via dashboard — no file needed. */
if (!process.env.VERCEL) {
  config({ path: path.join(repoRoot, ".env") });
}

export { apiServerRoot, repoRoot };
