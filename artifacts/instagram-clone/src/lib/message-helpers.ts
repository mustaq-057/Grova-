import type { ApiMessage } from "./api";
import { calendarDayKey, getUserTimeZone, formatClockInZone } from "./timezones";

type DayGroup = { label: string; dayKey: string; msgs: ApiMessage[] };

export function groupByDay(msgs: ApiMessage[], viewerId?: string) {
  const groups: DayGroup[] = [];
  const viewerZone = getUserTimeZone(viewerId);
  const now = new Date();
  const todayKey = calendarDayKey(now, viewerZone);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = calendarDayKey(yesterday, viewerZone);

  msgs.forEach((msg) => {
    const d = new Date(msg.timestamp);
    if (isNaN(d.getTime())) {
      const last = groups[groups.length - 1];
      if (last?.dayKey === "unknown") last.msgs.push(msg);
      else groups.push({ label: "Unknown", dayKey: "unknown", msgs: [msg] });
      return;
    }

    const dayKey = calendarDayKey(d, viewerZone);
    let label = "";
    if (dayKey === todayKey) {
      label = "";
    } else if (dayKey === yesterdayKey) {
      label = "Yesterday";
    } else {
      label = new Intl.DateTimeFormat(undefined, {
        timeZone: viewerZone,
        weekday: "long",
        month: "short",
        day: "numeric",
      }).format(d);
    }

    const last = groups[groups.length - 1];
    if (last?.dayKey === dayKey) {
      last.msgs.push(msg);
    } else {
      groups.push({ label, dayKey, msgs: [msg] });
    }
  });
  return groups;
}

/** Show a centered time pill when gap from previous message is ≥ 1 hour. */
export function shouldShowTimeGap(
  prev: ApiMessage | undefined,
  msg: ApiMessage,
  viewerId?: string,
): string | null {
  if (!prev) return null;
  const gap = new Date(msg.timestamp).getTime() - new Date(prev.timestamp).getTime();
  if (gap < 60 * 60_000) return null;
  const d = new Date(msg.timestamp);
  if (isNaN(d.getTime())) return null;
  return formatClockInZone(d, getUserTimeZone(viewerId));
}
