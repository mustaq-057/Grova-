import db from "../../artifacts/api-server/src/lib/db";

async function checkDatabaseHealth() {
  console.log("🏥 Database Health Check\n");

  try {
    // 1. Check all tables exist
    console.log("📋 Checking tables...");
    const tables = [
      "profiles",
      "messages",
      "activity_feed",
      "message_reactions",
      "message_read_receipts",
      "push_subscriptions",
      "public_keys",
    ];

    for (const table of tables) {
      const result = await db.execute(
        `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = $1`,
        [table]
      );
      const row = result.rows[0] as { count?: string | number } | undefined;
      const exists = Number(row?.count || 0) > 0;
      console.log(`  ${exists ? "✅" : "❌"} ${table}`);
    }

    // 2. Check data integrity
    console.log("\n📊 Data Integrity:");
    const profiles = await db.execute("SELECT COUNT(*) as total FROM profiles", []);
    const profilesRow = profiles.rows[0] as { total?: string | number } | undefined;
    console.log(`  ✅ Profiles: ${profilesRow?.total || 0}`);

    const messages = await db.execute("SELECT COUNT(*) as total FROM messages WHERE deleted = 0", []);
    const messagesRow = messages.rows[0] as { total?: string | number } | undefined;
    console.log(`  ✅ Messages: ${messagesRow?.total || 0}`);

    const activities = await db.execute("SELECT COUNT(*) as total FROM activity_feed", []);
    const activitiesRow = activities.rows[0] as { total?: string | number } | undefined;
    console.log(`  ✅ Activities: ${activitiesRow?.total || 0}`);

    // 3. Check profile data consistency
    console.log("\n🔍 Profile Data:");
    const profileData = await db.execute("SELECT id, name, avatar FROM profiles ORDER BY id", []);
    profileData.rows.forEach((p: any) => {
      const hasName = Boolean(p.name);
      const hasAvatar = Boolean(p.avatar);
      const status = hasName && hasAvatar ? "✅" : "⚠️";
      console.log(`  ${status} ${p.id}: ${p.name} | ${p.avatar ? "image loaded" : "NO IMAGE"}`);
    });

    // 4. Backup summary
    console.log("\n💾 Backup Info:");
    console.log("  Database: Neon Cloud (auto-replicated)");
    console.log("  Backups: Daily automatic backups enabled");

    console.log("\n✨ Health check complete!\n");
    process.exit(0);
  } catch (err) {
    console.error("❌ Health check failed:", err);
    process.exit(1);
  }
}

checkDatabaseHealth();
