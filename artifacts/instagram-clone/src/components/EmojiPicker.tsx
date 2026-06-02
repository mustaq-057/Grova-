import { createPortal } from "react-dom";
import { REACTION_EMOJI_GROUPS } from "@/lib/reaction-emoji-catalog";

type Props = {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  title?: string;
};

export default function EmojiPicker({ onSelect, onClose, title = "Emojis" }: Props) {
  return createPortal(
    <>
      <div className="fixed inset-0 z-[200] bg-black/40" onClick={onClose} aria-hidden />
      <div
        className="fixed z-[201] left-0 right-0 bottom-16 sm:bottom-14 md:bottom-0 max-h-[min(62vh,480px)] md:max-h-[min(65vh,520px)] bg-card border-t border-border rounded-t-2xl shadow-2xl overflow-hidden flex flex-col"
        data-testid="emoji-picker"
        role="dialog"
        aria-label={title}
      >
        <div className="shrink-0 border-b border-border px-4 py-2.5 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <button type="button" onClick={onClose} className="text-xs font-medium text-primary px-2 py-1">
            Done
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-3 pb-safe">
          {REACTION_EMOJI_GROUPS.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/80 px-1 mb-2 font-semibold">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-0.5">
                {group.emojis.map((emoji, i) => (
                  <button
                    key={`${group.label}-${emoji}-${i}`}
                    type="button"
                    onClick={() => onSelect(emoji)}
                    className="emoji-native w-11 h-11 sm:w-12 sm:h-12 text-[1.65rem] sm:text-[1.85rem] flex items-center justify-center rounded-xl hover:bg-secondary/80 active:scale-95 touch-manipulation"
                    data-testid={`emoji-${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>,
    document.body,
  );
}
