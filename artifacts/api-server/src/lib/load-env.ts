import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const apiServerRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const repoRoot = path.resolve(apiServerRoot, "../..");

config({ path: path.join(repoRoot, ".env") });

export { apiServerRoot, repoRoot };
