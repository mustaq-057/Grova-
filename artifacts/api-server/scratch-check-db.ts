import db from "./src/lib/db";
import { config } from "dotenv";
config({ path: "../.env" });

async function check() {
  const result = await db.query("SELECT * FROM stories ORDER BY created_at DESC LIMIT 5");
  console.log("Stories in Database:", JSON.stringify(result.rows, null, 2));
}

check().catch(console.error).finally(() => process.exit(0));
