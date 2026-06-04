/**
 * Vercel build entrypoint — install deps then build Grova (UI + API bundle).
 * Used when dashboard overrides would otherwise skip install or use `pnpm -w run build:grova`.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(label, command, args) {
  console.log(`\n[Vercel] ${label}: ${command} ${args.join(" ")}`);
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
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const pnpmOk = spawnSync("pnpm", ["--version"], {
  cwd: repoRoot,
  stdio: "pipe",
  shell: process.platform === "win32",
}).status === 0;

if (!pnpmOk || process.env.VERCEL === "1") {
  run("corepack", "corepack", ["enable"]);
  run("pnpm", "corepack", ["prepare", "pnpm@9.15.9", "--activate"]);
}

run("install", "pnpm", ["install", "--frozen-lockfile"]);
run("build", "pnpm", ["run", "build:grova"]);
