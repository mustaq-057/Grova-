/**
 * Copy API serverless bundle next to api/index.mjs so Vercel can load it at runtime.
 * (Importing from ../artifacts/... is unreliable inside deployed functions.)
 */
import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(repoRoot, "artifacts/api-server/dist");
const target = path.join(repoRoot, "api/_dist");

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });
console.log(`[Vercel] API bundle copied to ${target}`);
