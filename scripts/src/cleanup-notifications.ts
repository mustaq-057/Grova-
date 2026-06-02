import db from "../../artifacts/api-server/src/lib/db";

async function cleanup() {
  console.log("🧹 Starting database cleanup...\n");

  try {
    // Clear all activity_feed entries (notifications)
    console.log("Clearing activity_feed table...");
    await db.execute("DELETE FROM activity_feed", []);
    console.log("✅ Cleared activity_feed\n");

    // Delete all GIF messages
    console.log("Deleting GIF messages...");
    await db.execute("DELETE FROM messages WHERE type = $1", ["gif"]);
    console.log(`✅ Deleted GIF messages\n`);

    // Get remaining message count
    const countResult = await db.execute("SELECT COUNT(*) as total FROM messages WHERE deleted = 0", []);
    const totalRow = countResult.rows[0] as { total?: string | number } | undefined;
    const totalMessages = Number(totalRow?.total || 0);
    console.log(`📊 Remaining messages in database: ${totalMessages}\n`);

    console.log("✨ Cleanup complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Cleanup failed:", err);
    process.exit(1);
  }
}

cleanup();
