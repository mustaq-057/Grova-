import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundle = path.join(repoRoot, "artifacts/api-server/dist/vercel-entry.mjs");

try {
  await access(bundle);
  console.log(`[Vercel] API bundle OK: ${bundle}`);
} catch {
  console.error(`\n[Vercel] Missing API bundle. Run api build first:\n  ${bundle}\n`);
  process.exit(1);
}
