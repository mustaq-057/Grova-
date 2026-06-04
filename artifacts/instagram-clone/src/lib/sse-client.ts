/** Connect to live updates via SSE, or polling when serverless (Vercel) returns JSON. */

export type LiveChannel =
  | { mode: "sse"; eventSource: EventSource }
  | { mode: "poll"; intervalMs: number; stop: () => void };

export async function openLiveChannel(
  userId: string,
  onPoll: () => void,
): Promise<LiveChannel | null> {
  const url = `/api/sse?userId=${encodeURIComponent(userId)}`;

  try {
    const probe = await fetch(url, { credentials: "include" });
    const contentType = probe.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = (await probe.json()) as { mode?: string; pollIntervalMs?: number };
      if (body.mode === "poll") {
        const intervalMs = body.pollIntervalMs ?? 12_000;
        const id = window.setInterval(onPoll, intervalMs);
        window.setTimeout(onPoll, 1500);
        return {
          mode: "poll",
          intervalMs,
          stop: () => window.clearInterval(id),
        };
      }
    }
  } catch {
    /* fall through to EventSource */
  }

  try {
    const eventSource = new EventSource(url, { withCredentials: true });
    return { mode: "sse", eventSource };
  } catch {
    const id = window.setInterval(onPoll, 12_000);
    window.setTimeout(onPoll, 1500);
    return { mode: "poll", intervalMs: 12_000, stop: () => window.clearInterval(id) };
  }
}
