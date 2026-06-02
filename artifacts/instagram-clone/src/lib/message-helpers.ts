import type { ApiMessage } from "./api";

type DayGroup = { label: string; dayKey: string; msgs: ApiMessage[] };

export function groupByDay(msgs: ApiMessage[]) {
  const groups: DayGroup[] = [];
  msgs.forEach((msg) => {
    const d = new Date(msg.timestamp);
    if (isNaN(d.getTime())) {
      const last = groups[groups.length - 1];
      if (last?.dayKey === "unknown") last.msgs.push(msg);
      else groups.push({ label: "Unknown", dayKey: `unknown-${groups.length}`, msgs: [msg] });
      return;
    }
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayKey = d.toDateString();
    const label =
      dayKey === now.toDateString()
        ? "Today"
        : dayKey === yesterday.toDateString()
          ? "Yesterday"
          : d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
    const last = groups[groups.length - 1];
    if (last?.dayKey === dayKey) {
      last.msgs.push(msg);
    } else {
      groups.push({ label, dayKey: `${dayKey}-${groups.length}`, msgs: [msg] });
    }
  });
  return groups;
}

/** Show a centered time pill when gap from previous message is ≥ 1 hour. */
export function shouldShowTimeGap(prev: ApiMessage | undefined, msg: ApiMessage): string | null {
  if (!prev) return null;
  const gap = new Date(msg.timestamp).getTime() - new Date(prev.timestamp).getTime();
  if (gap < 60 * 60_000) return null;
  const d = new Date(msg.timestamp);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}
