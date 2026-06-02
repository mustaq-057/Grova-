import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function updateCoupleCode(newCode) {
  try {
    // Update the couple code
    await pool.query("UPDATE couple_code SET code = $1 WHERE id = 1", [newCode]);
    console.log(`Couple code updated successfully to: ${newCode}`);
    
    // Verify the update
    const result = await pool.query("SELECT code FROM couple_code WHERE id = 1");
    console.log(`Current couple code in database: ${result.rows[0]?.code}`);
  } catch (err) {
    console.error("Error updating couple code:", err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Get new code from command line argument or use default
const newCode = process.argv[2] || "love2024";
updateCoupleCode(newCode);
