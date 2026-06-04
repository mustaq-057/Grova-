import { initDb } from "../src/lib/db.ts";

await initDb();
console.log("Schema initialized on Neon DB");
