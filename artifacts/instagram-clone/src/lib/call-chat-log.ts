export function formatChatTime(d = new Date()): string {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatCallDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function callStartedText(callType: "audio" | "video", at = new Date()): string {
  const kind = callType === "video" ? "Video" : "Audio";
  return `📞 ${kind} call started · ${formatChatTime(at)}`;
}

export function callEndedText(callType: "audio" | "video", durationSec: number, at = new Date()): string {
  const kind = callType === "video" ? "Video" : "Audio";
  return `📞 ${kind} call ended · ${formatChatTime(at)} · ${formatCallDuration(durationSec)}`;
}

export function missedCallText(callType: "audio" | "video", at = new Date()): string {
  const kind = callType === "video" ? "video" : "audio";
  return `📞 Missed ${kind} call · ${formatChatTime(at)}`;
}

const CALL_LOG_RE = /^📞 (Audio|Video|Missed) /;

export function isCallLogMessage(text?: string): boolean {
  return Boolean(text && CALL_LOG_RE.test(text));
}
