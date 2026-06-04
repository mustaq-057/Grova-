import { access, cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(repoRoot, "artifacts/instagram-clone/dist");
const target = path.join(repoRoot, "dist");

async function assertFrontendBuild() {
  try {
    await access(path.join(source, "index.html"));
  } catch {
    console.error(
      "\n[Vercel] Frontend build missing. Expected index.html at:\n  " + source + "\n",
    );
    process.exit(1);
  }
}

await assertFrontendBuild();
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });

const names = await readdir(target);
const bad = names.filter((n) => n.endsWith(".mjs"));
if (bad.length > 0) {
  console.error("\n[Vercel] dist/ must be the Grova UI only, not API bundles. Found:", bad.join(", "));
  process.exit(1);
}

console.log(`[Vercel] Static site ready: ${target} (${names.length} top-level items)`);
