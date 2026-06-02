#!/usr/bin/env node
/**
 * Seeds the database with default profiles for "me" and "wife"
 * Run once to initialize stable profile data
 */

import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../../../.env');

// Parse .env file
const env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !line.startsWith('#')) {
      env[match[1]] = match[2];
    }
  });
}

const DATABASE_URL = env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set in .env');
  process.exit(1);
}

if (!DATABASE_URL.startsWith('postgresql://')) {
  console.error('❌ This script only works with PostgreSQL (Neon). SQLite profiles are temporary.');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  connectionTimeoutMillis: 10000,
  ssl: DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
});

const profiles = [
  {
    id: 'me',
    username: 'mustaq',
    name: 'Mustaq',
    bio: 'Just us two ♥',
    avatar: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=150&h=150&fit=crop'
  },
  {
    id: 'wife',
    username: 'sara',
    name: 'Sara',
    bio: 'My person ♥',
    avatar: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&h=150&fit=crop'
  }
];

async function seedProfiles() {
  const client = await pool.connect();
  try {
    console.log('📝 Seeding profiles into database...\n');

    for (const profile of profiles) {
      try {
        // Check if profile exists
        const existingResult = await client.query(
          'SELECT id FROM profiles WHERE id = $1',
          [profile.id]
        );

        if (existingResult.rows.length > 0) {
          console.log(`✅ Profile "${profile.id}" already exists`);
          continue;
        }

        // Insert profile
        await client.query(
          'INSERT INTO profiles (id, username, name, bio, avatar) VALUES ($1, $2, $3, $4, $5)',
          [profile.id, profile.username, profile.name, profile.bio, profile.avatar]
        );

        console.log(`✅ Created profile: ${profile.name} (${profile.id})`);
      } catch (err) {
        console.error(`❌ Error seeding ${profile.id}:`, err.message);
      }
    }

    console.log('\n✨ Profile seeding complete!');
    console.log('📌 Profiles are now permanently stored in the database.');
    console.log('🎯 Profile pictures will remain consistent across page refreshes.');
  } finally {
    await client.release();
    await pool.end();
  }
}

seedProfiles().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
