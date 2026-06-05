/** Home country timezones for this couple (Morocco + India). */
export const USER_TIMEZONES: Record<string, string> = {
  me: "Africa/Casablanca",
  wife: "Asia/Kolkata",
};

export function getUserTimeZone(userId: string | undefined): string {
  if (userId && USER_TIMEZONES[userId]) return USER_TIMEZONES[userId];
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function calendarDayKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatClockInZone(
  isoOrDate: string | Date,
  timeZone: string,
  withZoneName = false,
): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...(withZoneName ? { timeZoneName: "short" } : {}),
  }).format(d);
}
