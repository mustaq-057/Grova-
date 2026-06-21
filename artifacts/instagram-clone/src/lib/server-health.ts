export type ApiHealth = {
  reachable: boolean;
  authConfigured?: boolean;
  dbConfigured?: boolean;
  encryptionConfigured?: boolean;
  startupError?: string;
};

/** Quick check that the API is reachable (via Vite proxy in dev or same origin in prod). */
export async function probeApiHealth(timeoutMs = 20_000): Promise<ApiHealth> {
  const attempts = 3;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch("/api/healthz", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (res.ok) {
        const dbConfigured = data.dbConfigured === true || data.db === true;
        const authConfigured = data.authConfigured === true;
        const encryptionConfigured = data.encryptionConfigured === true;
        if (data.status === "degraded" && !dbConfigured) {
          return {
            reachable: true,
            authConfigured,
            dbConfigured: false,
            encryptionConfigured,
            startupError: "Database not connected. Check DATABASE_URL (Neon pooled URL) on Vercel — Cloudinary is not required for login.",
          };
        }
        return {
          reachable: true,
          authConfigured,
          dbConfigured,
          encryptionConfigured,
        };
      }
      if (res.status === 503 && typeof data.error === "string") {
        return {
          reachable: true,
          authConfigured: false,
          dbConfigured: false,
          encryptionConfigured: false,
          startupError: data.error,
        };
      }
    } catch {
      /* retry */
    }
    if (attempt < attempts - 1) {
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
  }
  return { reachable: false };
}

export function configErrorFromHealth(health: ApiHealth): string | null {
  if (!health.reachable) return null;
  if (health.startupError) {
    return `${health.startupError} Fix Vercel env vars and redeploy.`;
  }
  if (!health.encryptionConfigured) {
    return "Set ENCRYPTION_KEY and ENCRYPTION_PASSWORD in Vercel env vars, then redeploy.";
  }
  if (!health.dbConfigured) {
    return "Set DATABASE_URL (Neon postgresql:// pooled URL) in Vercel env vars, then redeploy.";
  }
  if (!health.authConfigured) {
    return "Set PRIMARY_AUTH_EMAILS and PRIMARY_AUTH_PASSWORD_1 in Vercel env vars, then redeploy.";
  }
  return null;
}
