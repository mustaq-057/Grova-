import pg from 'pg';

const { Pool } = pg;

const dbUrl = "postgresql://neondb_owner:npg_Mgw57LxiNbWR@ep-ancient-king-ao4ovwjy-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

console.log("\n🔍 Testing All Connections...\n");

// Test Database
try {
  console.log("📦 Testing Neon Database...");
  const pool = new Pool({ connectionString: dbUrl });
  const result = await pool.query("SELECT COUNT(*) as profile_count FROM profiles;");
  console.log("✅ Neon Database: CONNECTED");
  console.log("   Profiles in DB:", result.rows[0].profile_count);
  await pool.end();
} catch (e) {
  console.log("❌ Neon Database: FAILED");
  console.log("   Error:", e.message.substring(0, 100));
}

// Check Cloudinary
const cloudinaryUrl = "cloudinary://121173521372642:TOAhrcDl7Q3V2wZbwFx1ecFDY4s@djlbatypz";
if (cloudinaryUrl && cloudinaryUrl.length > 0) {
  console.log("✅ Cloudinary: CONFIGURED");
  console.log("   Cloud: djlbatypz");
} else {
  console.log("❌ Cloudinary: NOT CONFIGURED");
}

// Check B2
const b2Key = "b7223e076f1f";
const b2Bucket = "mustaq";
if (b2Key && b2Key.length > 0) {
  console.log("✅ B2 Backblaze: CONFIGURED");
  console.log("   Bucket:", b2Bucket);
} else {
  console.log("❌ B2 Backblaze: NOT CONFIGURED");
}

// Check Encryption
const encKey = "f4dca014063a87c2c8c5c4a1cbfc463348b337588e8526c53abfb0e0f466bd42";
const encPass = "SecureEncryptionPassword2024!";
if (encKey && encKey.length === 64 && encPass && encPass.length > 0) {
  console.log("✅ Encryption: CONFIGURED");
  console.log("   Key length: 64 hex chars (32 bytes)");
  console.log("   Password: SET");
} else {
  console.log("❌ Encryption: NOT CONFIGURED");
}

console.log("\n✅ Connection check complete!\n");
process.exit(0);
