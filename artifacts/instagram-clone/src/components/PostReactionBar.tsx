import { useState, useRef, useEffect } from "react";
import { Smile } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const POST_REACTIONS = [
  { emoji: "🤍", label: "Love" },
  { emoji: "😂", label: "Laugh" },
  { emoji: "😭", label: "Cry" },
  { emoji: "😡", label: "Anger" },
  { emoji: "😱", label: "Shock" },
] as const;

type Props = {
  myReaction?: string;
  reactionCounts?: Record<string, number>;
  onReact: (emoji: string) => void;
};

export function PostReactionBar({ myReaction, reactionCounts = {}, onReact }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const summary = POST_REACTIONS.filter((r) => (reactionCounts[r.emoji] ?? 0) > 0);

  return (
    <div ref={rootRef} className="relative px-4 pt-2 flex items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center justify-center w-9 h-9 rounded-full border transition-colors ${
          myReaction ? "border-primary bg-primary/10" : "border-border bg-secondary/40 hover:bg-secondary"
        }`}
        aria-label="React to post"
        aria-expanded={open}
      >
        <span className="emoji-native text-xl leading-none">{myReaction ?? "😊"}</span>
      </button>

      {summary.length > 0 ? (
        <div className="flex items-center gap-1 flex-wrap">
          {summary.map((r) => (
            <button
              key={r.emoji}
              type="button"
              onClick={() => onReact(r.emoji)}
              className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-secondary/60 text-xs"
            >
              <span className="text-base">{r.emoji}</span>
              <span className="text-muted-foreground">{reactionCounts[r.emoji]}</span>
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <Smile className="w-3.5 h-3.5" />
          React
        </button>
      )}

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            className="absolute left-4 bottom-full mb-2 flex gap-1 p-2 rounded-2xl bg-card border border-border shadow-xl z-20"
          >
            {POST_REACTIONS.map((r) => (
              <button
                key={r.emoji}
                type="button"
                title={r.label}
                onClick={() => {
                  onReact(r.emoji);
                  setOpen(false);
                }}
                className={`emoji-native w-11 h-11 rounded-xl text-[1.75rem] flex items-center justify-center hover:bg-secondary transition-transform hover:scale-110 ${
                  myReaction === r.emoji ? "bg-primary/15 ring-2 ring-primary/40" : ""
                }`}
              >
                {r.emoji}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
