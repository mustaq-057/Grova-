import { memo } from "react";
import { X, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { AudioMessage } from "@/components/AudioMessage";
import { parseSecretNotePlain, type SecretNotePayload } from "@/lib/secret-note-payload";

type Props = {
  title: string;
  body: string;
  onClose: () => void;
};

export const SecretNoteReader = memo(function SecretNoteReader({ title, body, onClose }: Props) {
  const payload: SecretNotePayload = parseSecretNotePlain(body);

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
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-10 space-y-6">
        {payload.audio ? (
          <div className="max-w-2xl mx-auto rounded-2xl border border-border bg-card/50 p-4">
            <p className="text-xs text-muted-foreground mb-3 font-medium">Saved voice note</p>
            <AudioMessage audioData={payload.audio} isMe={false} hideTranscribe />
          </div>
        ) : null}
        {payload.text?.trim() ? (
          <p className="text-base md:text-lg leading-relaxed whitespace-pre-wrap break-words text-foreground max-w-2xl mx-auto">
            {payload.text}
          </p>
        ) : !payload.audio ? (
          <p className="text-sm text-muted-foreground text-center">Empty note</p>
        ) : null}
      </div>
    </motion.div>
  );
});
