/**
 * Full Grova production build — used when Vercel locks Build Command to:
 *   pnpm -w run build:grova
 * Installs deps, builds UI + API, copies static output to dist/.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(label, command, args) {
  console.log(`\n[grova-build] ${label}: ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      NODE_OPTIONS: ["--max-old-space-size=6144", process.env.NODE_OPTIONS]
        .filter(Boolean)
        .join(" "),
    },
  });
  return result.status === 0;
}

console.log("[grova-build] Vercel-safe build (install + vite + api + dist sync)");

if (process.env.VERCEL === "1") {
  run("corepack enable", "corepack", ["enable"]);
  run("corepack pnpm", "corepack", ["prepare", "pnpm@9.15.9", "--activate"]);
}

if (!run("pnpm install (frozen)", "pnpm", ["install", "--frozen-lockfile"])) {
  console.log("[grova-build] frozen lockfile install failed, retrying without --frozen-lockfile");
  if (!run("pnpm install", "pnpm", ["install"])) {
    process.exit(1);
  }
}

if (!run("frontend", "node", ["scripts/vite-build.mjs"])) {
  process.exit(1);
}

if (!run("api", "pnpm", ["--filter", "@workspace/api-server", "run", "build"])) {
  process.exit(1);
}

if (!run("dist sync", "node", ["scripts/sync-vercel-dist.mjs"])) {
  process.exit(1);
}

console.log("\n[grova-build] Done.");
