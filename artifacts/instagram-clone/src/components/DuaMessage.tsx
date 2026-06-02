import { memo } from "react";
import type { ApiMessage } from "@/lib/api";

export interface DuaMessageProps {
  msg: ApiMessage;
  isMe: boolean;
}

export const DuaMessage = memo(function DuaMessage({ msg, isMe }: DuaMessageProps) {
  // Get translation from metadata or extract from text
  const translation = (msg as any)?.metadata?.translation || "";
  const arabicText = msg.text || "";

  return (
    <div
      className={`chat-bubble-text min-w-0 max-w-full box-border px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl sm:rounded-3xl backdrop-blur-sm border-2 ${
        isMe
          ? "bg-gradient-to-br from-primary/20 to-primary/10 border-primary/40"
          : "bg-gradient-to-br from-secondary/40 to-secondary/20 border-secondary/60"
      }`}
    >
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-current/10">
        <span className="text-base sm:text-lg">🤲</span>
        <span className="text-xs font-semibold opacity-75">Shared a dua</span>
      </div>

      {arabicText && (
        <p className="text-sm sm:text-base font-arabic text-center mb-2 sm:mb-3 leading-relaxed">
          {arabicText}
        </p>
      )}

      {translation && (
        <p className="text-xs sm:text-sm italic opacity-80 text-center">
          — {translation}
        </p>
      )}
    </div>
  );
});
