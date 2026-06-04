/** Run Vite build without relying on PATH (fixes Vercel "vite: command not found"). */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(repoRoot, "artifacts/instagram-clone");
const require = createRequire(path.join(appDir, "package.json"));

let viteBin;
try {
  const vitePkg = require.resolve("vite/package.json");
  viteBin = path.join(path.dirname(vitePkg), "bin/vite.js");
} catch {
  console.error(
    "\n[vite-build] vite is not installed. From repo root run: pnpm install\n",
  );
  process.exit(1);
}

const result = spawnSync(process.execPath, [viteBin, "build"], {
  cwd: appDir,
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_OPTIONS: ["--max-old-space-size=6144", process.env.NODE_OPTIONS]
      .filter(Boolean)
      .join(" "),
  },
});
process.exit(result.status ?? 1);
