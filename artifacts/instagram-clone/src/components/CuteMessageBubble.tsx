import { Heart } from "lucide-react";
import type { ReactNode } from "react";
import { getPartnerBubbleColors } from "@/lib/themes";

type Props = {
  isMe: boolean;
  children: ReactNode;
  companionSticker?: string;
  className?: string;
  dir?: "ltr" | "rtl";
  bubbleColor: string;
  bubbleBorder: string;
};

function bubbleFill(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return hex;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Cute bubble — uses the shared chat theme; frog + heart are optional decorations only. */
export function CuteMessageBubble({
  isMe,
  children,
  companionSticker,
  className = "",
  dir = "ltr",
  bubbleColor,
  bubbleBorder,
}: Props) {
  const stickerEl = companionSticker ? (
    <span
      className="emoji-native text-2xl shrink-0 mb-0.5 select-none drop-shadow-sm"
      aria-hidden
      title="Companion"
    >
      {companionSticker}
    </span>
  ) : null;

  if (!isMe) {
    const partner = getPartnerBubbleColors({ bubbleColor, bubbleBorder });
    return (
      <div className={`relative flex items-end gap-1 max-w-full ${className}`}>
        {stickerEl}
        <div
          dir={dir}
          className="chat-bubble-text relative px-4 py-2.5 rounded-[24px] text-[16px] leading-relaxed rounded-bl-md border-2 text-white min-w-0"
          style={{
            backgroundColor: partner.fill,
            borderColor: partner.border,
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex items-end gap-1 max-w-full ${className}`}>
      {stickerEl}
      <div className="relative min-w-0">
        <div className="absolute -top-1.5 -right-1.5 z-10 pointer-events-none">
          <Heart className="w-4 h-4 fill-red-500 text-red-500 drop-shadow" aria-hidden />
        </div>
        <div
          dir={dir}
          className="chat-bubble-text relative px-5 py-3 rounded-[22px] rounded-br-[6px] text-[16px] leading-relaxed font-medium text-white shadow-md border-2 max-w-full"
          style={{
            borderColor: bubbleBorder,
            background: `linear-gradient(145deg, ${bubbleFill(bubbleColor, 0.95)} 0%, ${bubbleColor} 55%, ${bubbleFill(bubbleColor, 0.85)} 100%)`,
            boxShadow: `0 2px 8px ${bubbleFill(bubbleColor, 0.35)}`,
          }}
        >
          <span className="relative z-[1]">{children}</span>
        </div>
      </div>
    </div>
  );
}
