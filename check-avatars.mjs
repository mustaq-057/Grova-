import { config } from 'dotenv';
config({ path: '.env' });
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

try {
  const rows = await sql`SELECT id, name, avatar FROM profiles ORDER BY id`;
  console.log('Profiles in database:');
  rows.forEach(row => {
    console.log(`\nID: ${row.id}`);
    console.log(`Name: ${row.name}`);
    console.log(`Avatar: ${row.avatar.substring(0, 100)}...`);
  });
} catch (err) {
  console.error('Error:', err.message);
}

await sql.end();
