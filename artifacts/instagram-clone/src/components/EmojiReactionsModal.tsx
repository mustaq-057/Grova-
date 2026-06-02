import { memo, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { getQuickReactions } from "@/lib/quick-reactions";

const BAR_HEIGHT = 52;
const PAD = 8;

type Props = {
  show: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  anchorRect: DOMRect | null;
  onOpenEmojiPanel?: () => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(n, max));
}

export const EmojiReactionsModal = memo(function EmojiReactionsModal({
  show,
  onClose,
  onSelectEmoji,
  anchorRect,
  onOpenEmojiPanel,
}: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const quickReactions = getQuickReactions();

  useLayoutEffect(() => {
    if (!show || !anchorRect) {
      setCoords(null);
      return;
    }
    const barWidth = barRef.current?.offsetWidth ?? Math.min(window.innerWidth - 16, quickReactions.length * 44 + 56);
    const barH = barRef.current?.offsetHeight ?? BAR_HEIGHT;
    let left = anchorRect.left + anchorRect.width / 2 - barWidth / 2;
    left = clamp(left, PAD, window.innerWidth - barWidth - PAD);
    let top = anchorRect.top - barH - 10;
    if (top < PAD) top = anchorRect.bottom + 10;
    top = clamp(top, PAD, window.innerHeight - barH - PAD);
    setCoords({ top, left });
  }, [show, anchorRect, quickReactions.length]);

  if (!show || !anchorRect) return null;

  const handleEmojiSelect = (emoji: string) => {
    onSelectEmoji(emoji);
    onClose();
  };

  const bar = (
  <>
    <div className="fixed inset-0 z-[200]" onClick={onClose} aria-hidden />
    <AnimatePresence>
      <motion.div
        ref={barRef}
        role="toolbar"
        aria-label="React to message"
        initial={{ opacity: 0, scale: 0.85, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 8 }}
        transition={{ type: "spring", stiffness: 520, damping: 32 }}
        className="fixed z-[201] flex items-center gap-0.5 px-2 py-1.5 rounded-full bg-[#262626]/95 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.45)] max-w-[calc(100vw-16px)]"
        style={{
          top: coords?.top ?? anchorRect.top - BAR_HEIGHT - 10,
          left: coords?.left ?? clamp(anchorRect.left, PAD, window.innerWidth - 280),
          visibility: coords ? "visible" : "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {quickReactions.map((emoji, index) => (
          <button
            key={`${emoji}-${index}`}
            type="button"
            onClick={() => handleEmojiSelect(emoji)}
            className="emoji-native w-10 h-10 sm:w-11 sm:h-11 text-[1.65rem] sm:text-[1.85rem] rounded-full flex items-center justify-center shrink-0 hover:bg-white/10 active:scale-125 transition-transform touch-manipulation"
          >
            {emoji}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenEmojiPanel?.();
          }}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white/90 shrink-0 touch-manipulation"
          aria-label="More emojis"
        >
          <Plus className="w-5 h-5" strokeWidth={2} />
        </button>
      </motion.div>
    </AnimatePresence>
  </>
  );

  return createPortal(bar, document.body);
});
