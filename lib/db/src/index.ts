import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Allow database to sleep by releasing idle connections
  idleTimeoutMillis: 10000, // Close idle connections after 10 seconds
  // Connection timeout for establishing new connections
  connectionTimeoutMillis: 10000, // Wait 10 seconds for connection
  // Maximum number of clients in the pool
  max: 10, // Limit concurrent connections
  // Keep connections alive for database wake-up
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
