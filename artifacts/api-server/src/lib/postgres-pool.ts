import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

/** Strip params that break node-pg / Neon serverless on Windows and corporate networks. */
export function normalizePostgresUrl(raw: string): string {
  const url = new URL(raw);
  url.searchParams.delete("channel_binding");
  return url.toString();
}

export function isNeonHost(connectionString: string): boolean {
  try {
    return new URL(connectionString).hostname.includes("neon.tech");
  } catch {
    return connectionString.includes("neon.tech");
  }
}

export type PgPoolLike = {
  connect: () => Promise<{
    query: (sql: string, params?: unknown[]) => Promise<{ rows: any[]; rowCount?: number | null }>;
    release: () => void;
  }>;
  query: (sql: string, params?: unknown[]) => Promise<{ rows: any[]; rowCount?: number | null }>;
  end: () => Promise<void>;
};

/** Neon: WebSocket pool (port 443). Other hosts: TCP via node-pg. */
export async function createPostgresPool(connectionString: string): Promise<PgPoolLike> {
  const normalized = normalizePostgresUrl(connectionString);

  if (isNeonHost(normalized)) {
    neonConfig.webSocketConstructor = ws;
    return new NeonPool({
      connectionString: normalized,
      max: process.env.VERCEL ? 3 : 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: process.env.VERCEL ? 15000 : 30000,
    }) as unknown as PgPoolLike;
  }

  const pg = await import("pg");
  const url = new URL(normalized);
  const sslmode = url.searchParams.get("sslmode");
  const needsSsl = sslmode === "require" || sslmode === "verify-full" || sslmode === "verify-ca";

  return new pg.default.Pool({
    connectionString: normalized,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 30000,
    max: 10,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  }) as unknown as PgPoolLike;
}
