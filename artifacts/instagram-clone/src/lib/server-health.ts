/** Quick check that the API is reachable (via Vite proxy in dev or same origin in prod). */
export async function probeApiHealth(timeoutMs = 12_000): Promise<boolean> {
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
      if (res.ok) return true;
    } catch {
      /* retry */
    }
    if (attempt < attempts - 1) {
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
  }
  return false;
}
