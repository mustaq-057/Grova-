/** Connect to live updates via SSE, or polling when serverless (Vercel) returns JSON. */

export type LiveChannel =
  | { mode: "sse"; eventSource: EventSource }
  | { mode: "poll"; intervalMs: number; stop: () => void };

export function startPollChannel(onPoll: () => void, intervalMs = 1_000): LiveChannel {
  const id = window.setInterval(onPoll, intervalMs);
  window.setTimeout(onPoll, 350);
  return {
    mode: "poll",
    intervalMs,
    stop: () => window.clearInterval(id),
  };
}

export async function openLiveChannel(
  userId: string,
  onPoll: () => void,
  opts?: { forcePoll?: boolean },
): Promise<LiveChannel | null> {
  if (opts?.forcePoll) return startPollChannel(onPoll);

  const url = `/api/sse?userId=${encodeURIComponent(userId)}`;

  try {
    const probe = await fetch(url, { credentials: "include" });
    const contentType = probe.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = (await probe.json()) as { mode?: string; pollIntervalMs?: number };
      if (body.mode === "poll") {
        return startPollChannel(onPoll, body.pollIntervalMs ?? 1_000);
      }
    }
  } catch {
    /* fall through to EventSource */
  }

  try {
    const eventSource = new EventSource(url, { withCredentials: true });
    return { mode: "sse", eventSource };
  } catch {
    return startPollChannel(onPoll);
  }
}
