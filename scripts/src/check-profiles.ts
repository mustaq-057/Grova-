import db from "../../artifacts/api-server/src/lib/db";

async function checkProfiles() {
  console.log("📋 Checking database profiles...\n");

  try {
    // Check profiles table
    const profileResult = await db.execute("SELECT id, name, avatar FROM profiles", []);
    console.log("✅ Profiles in database:");
    console.log(JSON.stringify(profileResult.rows, null, 2));
    
    console.log("\n📊 Total profiles:", profileResult.rows.length);
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to check profiles:", err);
    process.exit(1);
  }
}

checkProfiles();
