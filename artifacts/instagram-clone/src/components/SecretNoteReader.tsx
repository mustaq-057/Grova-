import { memo, useState } from "react";
import { X, Lock, Mic } from "lucide-react";
import { motion } from "framer-motion";
import { AudioMessage } from "@/components/AudioMessage";
import { isTranscriptionSupported, transcribeFromMicrophone, type TranscriptSegment } from "@/lib/voice-transcribe";
import { parseSecretNotePlain, type SecretNotePayload } from "@/lib/secret-note-payload";
import { toast } from "sonner";

function formatSegTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type Props = {
  title: string;
  body: string;
  onClose: () => void;
};

export const SecretNoteReader = memo(function SecretNoteReader({ title, body, onClose }: Props) {
  const payload: SecretNotePayload = parseSecretNotePlain(body);
  const [appendText, setAppendText] = useState("");
  const [appendSegments, setAppendSegments] = useState<TranscriptSegment[]>([]);
  const [dictating, setDictating] = useState(false);

  const startAppendDictation = () => {
    if (!isTranscriptionSupported()) {
      toast.error("Voice typing needs Chrome or Edge.");
      return;
    }
    setDictating(true);
    const session = transcribeFromMicrophone((text, segs) => {
      setAppendText(text);
      setAppendSegments(segs);
    });
    void session.promise
      .then((r) => {
        setAppendText(r.text);
        setAppendSegments(r.segments);
      })
      .catch(() => toast.error("Could not transcribe."))
      .finally(() => setDictating(false));
  };

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
            <AudioMessage audioData={payload.audio} isMe={false} />
          </div>
        ) : null}
        {payload.text?.trim() ? (
          <p className="text-base md:text-lg leading-relaxed whitespace-pre-wrap break-words text-foreground max-w-2xl mx-auto">
            {payload.text}
          </p>
        ) : !payload.audio ? (
          <p className="text-sm text-muted-foreground text-center">Empty note</p>
        ) : null}
        <div className="max-w-2xl mx-auto border-t border-border pt-4 space-y-2">
          <p className="text-xs text-muted-foreground">Add a spoken note (transcribed to text)</p>
          <button
            type="button"
            onClick={startAppendDictation}
            disabled={dictating}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary text-sm font-medium disabled:opacity-50"
          >
            <Mic className="w-4 h-4" />
            {dictating ? "Listening…" : "Transcribe audio"}
          </button>
          {appendSegments.length > 0 ? (
            <div className="text-sm space-y-1.5 bg-secondary/50 rounded-xl p-3">
              {appendSegments.map((seg, i) => (
                <p key={`${seg.start}-${i}`} className="leading-relaxed break-words">
                  <span className="text-primary font-medium tabular-nums mr-2">{formatSegTime(seg.start)}</span>
                  {seg.text}
                </p>
              ))}
            </div>
          ) : appendText ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words bg-secondary/50 rounded-xl p-3">
              {appendText}
            </p>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
});
