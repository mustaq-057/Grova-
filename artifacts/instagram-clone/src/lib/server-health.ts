export type ApiHealth = {
  reachable: boolean;
  authConfigured?: boolean;
  dbConfigured?: boolean;
  encryptionConfigured?: boolean;
};

/** Quick check that the API is reachable (via Vite proxy in dev or same origin in prod). */
export async function probeApiHealth(timeoutMs = 12_000): Promise<ApiHealth> {
  const attempts = 4;
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
      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        return {
          reachable: true,
          authConfigured: data.authConfigured === true,
          dbConfigured: data.dbConfigured === true || data.db === true,
          encryptionConfigured: data.encryptionConfigured === true,
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
