import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const checks = [
  path.join(repoRoot, "dist/index.html"),
  path.join(repoRoot, "api/_dist/vercel-entry.mjs"),
  path.join(repoRoot, "api/index.mjs"),
  path.join(repoRoot, "api/healthz.mjs"),
];

for (const file of checks) {
  try {
    await access(file);
    console.log(`[Vercel] OK ${path.relative(repoRoot, file)}`);
  } catch {
    console.error(`\n[Vercel] BUILD INCOMPLETE — missing: ${file}\n`);
    process.exit(1);
  }
}
