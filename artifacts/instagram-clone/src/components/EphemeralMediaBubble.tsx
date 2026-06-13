import { memo } from "react";

type EphemeralMediaBubbleProps = {
  kind: "photo" | "video";
  viewMode: "once" | "twice";
  isMe: boolean;
  /** Views left for receiver; 0 when fully consumed */
  viewsRemaining: number;
  /** Partner has opened at least once (sender view) */
  wasOpened: boolean;
  openedAt?: string;
  sentAt: string;
  onOpen?: () => void;
  disabled?: boolean;
  opening?: boolean;
};

function formatBubbleTime(ts: string): string {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
}

function ViewOnceIcon({ count, opened }: { count: 1 | 2; opened: boolean }) {
  const accent = opened ? "#8696a0" : "#00a884";
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden className="shrink-0">
      <circle cx="14" cy="14" r="11" fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray={opened ? "2.5 3.5" : "0"} />
      {!opened && (
        <>
          <path d="M 14 3 A 11 11 0 0 0 3 14" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 14 25 A 11 11 0 0 0 25 14" fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="2.5 3.5" />
        </>
      )}
      {opened && (
        <path d="M 14 3 A 11 11 0 0 0 3 14" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
      )}
      {!opened && (
        <text x="14" y="18" textAnchor="middle" fill={accent} fontSize="11" fontWeight="700" fontFamily="system-ui, sans-serif">
          {count}
        </text>
      )}
    </svg>
  );
}

export const EphemeralMediaBubble = memo(function EphemeralMediaBubble({
  kind,
  viewMode,
  isMe,
  viewsRemaining,
  wasOpened,
  openedAt,
  sentAt,
  onOpen,
  disabled,
  opening = false,
}: EphemeralMediaBubbleProps) {
  const label = kind === "photo" ? "Photo" : "Video";
  const count = viewMode === "once" ? 1 : 2;

  const isOpenedState = opening ? false : isMe ? wasOpened : viewsRemaining <= 0;
  const canOpen = !isMe && viewsRemaining > 0 && !disabled && !opening;

  const title = opening ? "Opening…" : isOpenedState ? "Opened" : label;

  const timeLabel = formatBubbleTime(isOpenedState && openedAt ? openedAt : sentAt);

  return (
    <button
      type="button"
      onClick={canOpen ? onOpen : undefined}
      disabled={!canOpen}
      className={`group/ephemeral relative flex items-center gap-3 px-3.5 py-2.5 min-w-[200px] max-w-[260px] rounded-xl border text-left transition-colors ${
        canOpen ? "cursor-pointer hover:brightness-110 active:scale-[0.98]" : "cursor-default"
      } bg-[#1f2c34]/95 border-white/8 shadow-sm`}
    >
      <ViewOnceIcon count={count} opened={isOpenedState} />

      <div className="flex-1 min-w-0 pr-12">
        <p
          className={`text-[15px] leading-tight ${
            isOpenedState ? "text-white/55 italic font-normal" : "text-white/95 font-semibold"
          }`}
        >
          {title}
        </p>
        {isMe && !wasOpened && (
          <p className="text-[11px] text-white/45 mt-0.5">Not opened yet</p>
        )}
        {isMe && wasOpened && openedAt && (
          <p className="text-[11px] text-white/45 mt-0.5">Opened {formatBubbleTime(openedAt)}</p>
        )}
        {!isMe && !isOpenedState && !opening && viewsRemaining > 0 && (
          <p className="text-[11px] text-[#00a884]/90 mt-0.5 font-medium">
            {viewsRemaining} {viewsRemaining === 1 ? "view" : "views"} left · tap to open
          </p>
        )}
      </div>

      <span className="absolute bottom-2 right-3 text-[10px] text-white/40 tabular-nums">{timeLabel}</span>
    </button>
  );
});
