#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse .env manually
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match && !line.startsWith('#')) {
    env[match[1]] = match[2];
  }
});

const tests = [];
let passedCount = 0;
let failedCount = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function log(prefix, msg) {
  console.log(`${prefix} ${msg}`);
}

async function runTests() {
  console.log('\n🔍 Verifying all database connections...\n');

  for (const { name, fn } of tests) {
    try {
      await fn();
      log('✅', name);
      passedCount++;
    } catch (err) {
      log('❌', `${name}: ${err.message}`);
      failedCount++;
    }
  }

  console.log(`\n📊 Results: ${passedCount} passed, ${failedCount} failed\n`);
  process.exit(failedCount > 0 ? 1 : 0);
}

// Test 1: PostgreSQL (Neon) Connection
test('PostgreSQL (Neon) Connection', async () => {
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL not set in .env');
  if (!databaseUrl.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL does not start with postgresql://');
  }

  const normalized = databaseUrl.replace(/([?&])channel_binding=[^&]*&?/g, '$1').replace(/[?&]$/, '');
  let pool;
  if (normalized.includes('neon.tech')) {
    const { Pool, neonConfig } = await import('@neondatabase/serverless');
    const ws = (await import('ws')).default;
    neonConfig.webSocketConstructor = ws;
    pool = new Pool({ connectionString: normalized, max: 1 });
  } else {
    const { Pool } = await import('pg');
    pool = new Pool({
      connectionString: normalized,
      connectionTimeoutMillis: 10000,
      max: 1,
      ssl: { rejectUnauthorized: false },
    });
  }

  try {
    const result = await pool.query('SELECT NOW()');
    if (!result.rows || result.rows.length === 0) {
      throw new Error('No rows returned from SELECT NOW()');
    }
    const hostname = new URL(databaseUrl).hostname;
    log('   ', `✓ Connected successfully to: ${hostname}`);
  } finally {
    await pool.end();
  }
});

// Test 2: Cloudinary Configuration
test('Cloudinary Configuration', async () => {
  const cloudinaryUrl = env.CLOUDINARY_URL;
  if (!cloudinaryUrl) throw new Error('CLOUDINARY_URL not set in .env');
  if (!cloudinaryUrl.startsWith('cloudinary://')) {
    throw new Error('CLOUDINARY_URL does not start with cloudinary://');
  }

  const match = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
  if (!match) throw new Error('Invalid CLOUDINARY_URL format');

  const [, apiKey, apiSecret, cloudName] = match;
  log('   ', `✓ Cloud: ${cloudName}, API Key: ${apiKey.slice(0, 8)}...`);
});

// Test 3: Backblaze B2 Configuration
test('Backblaze B2 Storage Configuration', async () => {
  const keyId = env.B2_KEY_ID;
  const appKey = env.B2_APPLICATION_KEY;
  const bucketName = env.B2_BUCKET_NAME;

  if (!keyId) throw new Error('B2_KEY_ID not set in .env');
  if (!appKey) throw new Error('B2_APPLICATION_KEY not set in .env');
  if (!bucketName) throw new Error('B2_BUCKET_NAME not set in .env');

  log('   ', `✓ Bucket: ${bucketName}, Key ID: ${keyId.slice(0, 8)}...`);
});

// Test 4: GIPHY API Key
test('GIPHY API Key Configuration', async () => {
  const giphyKey = env.VITE_GIPHY_API_KEY;
  if (!giphyKey) throw new Error('VITE_GIPHY_API_KEY not set in .env');
  log('   ', `✓ API Key: ${giphyKey.slice(0, 8)}...`);
});

// Test 5: Encryption Key
test('Encryption Key Configuration', async () => {
  const encKey = env.ENCRYPTION_KEY;
  if (!encKey) throw new Error('ENCRYPTION_KEY not set in .env');
  if (encKey.length !== 64) throw new Error(`ENCRYPTION_KEY must be 64 chars, got ${encKey.length}`);
  log('   ', `✓ Key length: ${encKey.length} chars (valid)`);
});

// Test 6: Database URL type
test('Database URL Type Check', async () => {
  const databaseUrl = env.DATABASE_URL;
  if (databaseUrl.startsWith('postgresql://')) {
    log('   ', `✓ Using PostgreSQL (Neon) as primary database`);
  } else if (databaseUrl.startsWith('file:')) {
    log('   ', `⚠ Using SQLite as fallback (cloud database not configured)`);
  } else {
    throw new Error('DATABASE_URL has unsupported format');
  }
});

// Run all tests
await runTests();
