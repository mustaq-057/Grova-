import { memo } from "react";
import { X, Lock } from "lucide-react";
import { motion } from "framer-motion";

type Props = {
  title: string;
  body: string;
  onClose: () => void;
};

export const SecretNoteReader = memo(function SecretNoteReader({ title, body, onClose }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background flex flex-col"
    >
      <header className="flex items-center justify-between gap-3 px-4 py-4 border-b border-border shrink-0 safe-area-top">
        <div className="flex items-center gap-2 min-w-0">
          <Lock className="w-5 h-5 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{title}</p>
            <p className="text-[10px] text-muted-foreground">Unlocked · tap close when done</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full hover:bg-secondary transition-colors shrink-0"
          aria-label="Close note"
        >
          <X className="w-5 h-5" />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-10">
        <p className="text-base md:text-lg leading-relaxed whitespace-pre-wrap break-words text-foreground max-w-2xl mx-auto">
          {body}
        </p>
      </div>
    </motion.div>
  );
});
