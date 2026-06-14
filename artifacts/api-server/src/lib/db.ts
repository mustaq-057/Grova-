import "./load-env";
import { appConfig } from "./config";
import {
  createPostgresPool,
  isNeonHost,
  normalizePostgresUrl,
  type PgPoolLike,
} from "./postgres-pool";

function resolveDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
  }
  const databaseUrl = normalizePostgresUrl(raw);
  const envIsPostgres =
    databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://");
  if (!envIsPostgres) {
    throw new Error(
      "FATAL: Only PostgreSQL/Neon is supported. Use DATABASE_URL=postgresql://... from https://console.neon.tech",
    );
  }
  return databaseUrl;
}

function prepareSql(sql: string): string {
  let n = 0;
  return sql.replace(/\?/g, () => `$${++n}`);
}

type DbHandle = {
  execute: (sql: string, params?: unknown[]) => Promise<{ rows: any[]; changes?: number; lastID?: unknown }>;
  query: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }>;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}



let pgPool: Awaited<ReturnType<typeof createPostgresPool>> | null = null;
let poolInit: Promise<PgPoolLike> | null = null;

const dbRef: { handle: DbHandle } = { handle: null! };

function setActiveDb(handle: DbHandle) {
  dbRef.handle = handle;
}



function createPostgresDb(pool: PgPoolLike): DbHandle {
  return {
    execute: async (sql: string, params?: unknown[]) => {
      const client = await pool.connect();
      try {
        const result = await client.query(prepareSql(sql), params);
        return { rows: result.rows, changes: result.rowCount ?? 0 };
      } finally {
        client.release();
      }
    },
    query: async (sql: string, params?: unknown[]) => {
      const client = await pool.connect();
      try {
        const result = await client.query(prepareSql(sql), params);
        return { rows: result.rows };
      } finally {
        client.release();
      }
    },
  };
}

async function ensurePool(): Promise<PgPoolLike> {
  if (pgPool) return pgPool;
  if (!poolInit) {
    poolInit = (async () => {
      const databaseUrl = resolveDatabaseUrl();
      const pool = await createPostgresPool(databaseUrl);
      pgPool = pool;
      setActiveDb(createPostgresDb(pool));
      console.log(
        isNeonHost(databaseUrl)
          ? "[neon] Using PostgreSQL (Neon cloud, WebSocket)"
          : "[db] Using PostgreSQL",
      );
      return pool;
    })();
  }
  return poolInit;
}

const db: DbHandle = {
  execute: async (sql, params) => {
    await ensurePool();
    return dbRef.handle.execute(sql, params);
  },
  query: async (sql, params) => {
    await ensurePool();
    return dbRef.handle.query(sql, params);
  },
};

export default db;

let dbReady = false;

export function isDbReady(): boolean {
  return dbReady;
}

/** Lightweight ping for health checks (does not run schema migrations). */
export async function pingDatabase(): Promise<boolean> {
  try {
    const pool = await ensurePool();
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

async function verifyPostgresConnection(retries = 5): Promise<void> {
  const pool = await ensurePool();
  let lastErr: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query("SELECT 1");
      console.log("[neon] PostgreSQL connected successfully");
      return;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        console.error(`[neon] Connection attempt ${attempt}/${retries} failed:`, err);
        await sleep(2000 * attempt);
      }
    }
  }
  throw new Error(`FATAL: Cannot connect to PostgreSQL after ${retries} attempts: ${lastErr}`);
}

// Initialize database schema
export async function initDb() {
  try {
    await verifyPostgresConnection();

    const tsCol = "BIGINT";

    await db.execute(`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        name TEXT NOT NULL,
        bio TEXT,
        avatar TEXT NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_agent TEXT NOT NULL,
        ip TEXT NOT NULL,
        created_at ${tsCol} NOT NULL,
        last_seen ${tsCol} NOT NULL,
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        created_at ${tsCol} NOT NULL,
        expires_at ${tsCol} NOT NULL,
        csrf_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        refresh_token_expires_at ${tsCol} NOT NULL,
        device_id TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
      )
    `);

    {
      for (const sql of [
        "ALTER TABLE devices ALTER COLUMN created_at TYPE BIGINT",
        "ALTER TABLE devices ALTER COLUMN last_seen TYPE BIGINT",
        "ALTER TABLE sessions ALTER COLUMN created_at TYPE BIGINT",
        "ALTER TABLE sessions ALTER COLUMN expires_at TYPE BIGINT",
        "ALTER TABLE sessions ALTER COLUMN refresh_token_expires_at TYPE BIGINT",
      ]) {
        try {
          await db.execute(sql);
        } catch {
          /* column may already be BIGINT on fresh installs */
        }
      }
    }

    await db.execute(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id)`);
    try {
      await db.execute("ALTER TABLE devices ADD COLUMN typing_until BIGINT NOT NULL DEFAULT 0");
    } catch {
      /* column may already exist */
    }
    await db.execute(`
      CREATE TABLE IF NOT EXISTS primary_access_tokens (
        token_hash TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        user_agent TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        expires_at BIGINT NOT NULL
      )
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_primary_access_expires_at ON primary_access_tokens(expires_at)`);
    for (const col of ["client_id TEXT", "origin TEXT"]) {
      try {
        await db.execute(`ALTER TABLE primary_access_tokens ADD COLUMN ${col}`);
      } catch {
        /* column may already exist */
      }
    }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL,
        text TEXT,
        type TEXT NOT NULL,
        audio_data TEXT,
        gif_url TEXT,
        image_data TEXT,
        timestamp TEXT NOT NULL,
        liked INTEGER DEFAULT 0,
        deleted INTEGER DEFAULT 0,
        deleted_at TEXT,
        variant TEXT,
        companion_sticker TEXT
      )
    `);

    await db.execute(`CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages(deleted)`);

    for (const sql of [
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url TEXT",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_data TEXT",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_type TEXT",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_size INTEGER",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS location TEXT",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS thread_id TEXT",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS thread_parent_id TEXT",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS thread_reply_count INTEGER DEFAULT 0",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id TEXT",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_text TEXT",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_sender_id TEXT",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS font_style TEXT",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_font_style TEXT",
      "ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_image_url TEXT",
    ]) {
      try {
        await db.execute(sql);
      } catch {
        /* column may exist */
      }
    }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        author_id TEXT NOT NULL,
        media_url TEXT NOT NULL,
        caption TEXT,
        location TEXT,
        aspect_ratio TEXT,
        created_at TEXT NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS stories (
        id TEXT PRIMARY KEY,
        author_id TEXT NOT NULL,
        media_url TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'story',
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS post_reactions (
        post_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        emoji TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (post_id, user_id)
      )
    `);

    await db.execute(`CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_stories_author ON stories(author_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_stories_expires ON stories(expires_at)`);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS shared_tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        assigned_to TEXT NOT NULL,
        priority TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        author TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS post_likes (
        post_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (post_id, user_id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS post_comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    await db.execute(`CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id)`);

    for (const sql of ["ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_urls TEXT"]) {
      try {
        await db.execute(sql);
      } catch {
        /* column may exist */
      }
    }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS hidden_messages (
        user_id TEXT NOT NULL,
        message_id TEXT NOT NULL,
        hidden_at TEXT NOT NULL,
        PRIMARY KEY (user_id, message_id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS chat_clear_state (
        user_id TEXT PRIMARY KEY,
        cleared_at TEXT NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS duas (
        id TEXT PRIMARY KEY,
        arabic TEXT NOT NULL,
        translation TEXT,
        author TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);

    await db.execute(`CREATE TABLE IF NOT EXISTS couple_code (
      id SERIAL PRIMARY KEY,
      code TEXT NOT NULL UNIQUE
    )`);

    await db.execute(
      "INSERT INTO couple_code (code) VALUES ($1) ON CONFLICT (code) DO NOTHING",
      [appConfig.defaultCoupleCode],
    );

    await db.execute(`CREATE TABLE IF NOT EXISTS profile_codes (
      profile_id TEXT PRIMARY KEY,
      code TEXT NOT NULL
    )`);

    const sharedCodeRow = await db.execute("SELECT code FROM couple_code ORDER BY id LIMIT 1", []);
    const seedCode =
      String((sharedCodeRow.rows[0]?.code as string | undefined) ?? "").trim() || appConfig.defaultCoupleCode;
    for (const profileId of ["me", "wife"]) {
      await db.execute(
        `INSERT INTO profile_codes (profile_id, code) VALUES ($1, $2) ON CONFLICT (profile_id) DO NOTHING`,
        [profileId, seedCode],
      );
    }

    // Seed only missing profiles — never overwrite name/bio the user saved in Settings.
    for (const profile of appConfig.defaultProfiles) {
      await db.execute(
        `INSERT INTO profiles (id, username, name, bio, avatar) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [profile.id, profile.username, profile.name, profile.bio, profile.avatar],
      );
    }

    for (const profile of appConfig.defaultProfiles) {
      await db.execute(
        `UPDATE profiles SET avatar = $1
         WHERE id = $2 AND (avatar IS NULL OR avatar = '' OR avatar LIKE '%picsum%' OR avatar LIKE '%dicebear%' OR avatar LIKE '%1516035069371%')`,
        [profile.avatar, profile.id],
      );
    }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS couple_prefs (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS activity_feed (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        from_name TEXT NOT NULL,
        text TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        read INTEGER DEFAULT 0
      )
    `);

    for (const sql of [
      "ALTER TABLE activity_feed ADD COLUMN actor_id TEXT",
      "ALTER TABLE activity_feed ADD COLUMN target_path TEXT",
    ]) {
      try {
        await db.execute(sql);
      } catch {
        /* column may exist */
      }
    }

    await db.execute(
      `INSERT INTO couple_prefs (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
      ["chat_theme", "default"],
    );
    for (const [key, val] of [
      ["read_receipts", "on"],
      ["show_presence", "on"],
      ["notifications", "on"],
      ["note_me", ""],
      ["note_wife", ""],
    ] as const) {
      await db.execute(
        `INSERT INTO couple_prefs (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
        [key, val],
      );
    }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        user_id TEXT PRIMARY KEY,
        subscription TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS public_keys (
        user_id TEXT PRIMARY KEY,
        public_key TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS two_factor_auth (
        user_id TEXT PRIMARY KEY,
        secret TEXT NOT NULL,
        enabled INTEGER DEFAULT 0,
        backup_codes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS message_reactions (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        emoji TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS message_read_receipts (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        read_at TEXT NOT NULL,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS message_media_opens (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        opened_at TEXT NOT NULL,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      )
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_message_media_opens_message_user ON message_media_opens(message_id, user_id)`);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS forwarded_messages (
        id TEXT PRIMARY KEY,
        original_message_id TEXT NOT NULL,
        from_user_id TEXT NOT NULL,
        to_user_id TEXT NOT NULL,
        forwarded_at TEXT NOT NULL,
        FOREIGN KEY (original_message_id) REFERENCES messages(id) ON DELETE CASCADE
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS message_edits (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        old_text TEXT,
        new_text TEXT,
        edited_at TEXT NOT NULL,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS pinned_messages (
        user_id TEXT NOT NULL,
        message_id TEXT NOT NULL,
        pinned_at TEXT NOT NULL,
        PRIMARY KEY (user_id, message_id),
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT,
        description TEXT,
        type TEXT NOT NULL,
        author TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS daily_checkins (
        id TEXT PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        mood TEXT NOT NULL,
        author TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS relationship_milestones (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        author TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS secret_notes (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        author TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS scheduled_messages (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL,
        text TEXT,
        type TEXT NOT NULL,
        audio_data TEXT,
        gif_url TEXT,
        image_data TEXT,
        variant TEXT,
        companion_sticker TEXT,
        scheduled_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        sent INTEGER DEFAULT 0
      )
    `);

    dbReady = true;
  } catch (err) {
    console.error("Database initialization error:", err);
    throw new Error(`Failed to initialize database: ${err instanceof Error ? err.message : String(err)}`);
  }
}
