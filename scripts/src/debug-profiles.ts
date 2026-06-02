import db from "../../artifacts/api-server/src/lib/db";

async function debugProfiles() {
  console.log("🔍 Debugging profile pictures...\n");

  try {
    // Check profiles table with all columns
    const profileResult = await db.execute("SELECT * FROM profiles", []);
    console.log("✅ Full profile data:");
    profileResult.rows.forEach((row: any) => {
      console.log(`\nID: ${row.id}`);
      console.log(`Name: ${row.name}`);
      console.log(`Avatar URL: ${row.avatar}`);
      console.log(`Avatar JSON: ${row.avatar_json}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed:", err);
    process.exit(1);
  }
}

debugProfiles();
