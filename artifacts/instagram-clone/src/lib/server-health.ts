/** Quick check that the API is reachable (via Vite proxy in dev or same origin in prod). */
export async function probeApiHealth(timeoutMs = 4000): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
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
      /* retry once */
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}
