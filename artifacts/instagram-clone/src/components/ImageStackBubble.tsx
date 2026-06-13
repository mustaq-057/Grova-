import { memo, useMemo } from "react";
import type { ApiMessage } from "@/lib/api";
import { resolveChatImageUrl } from "@/lib/media-url";

type Props = {
  messages: ApiMessage[];
  isMe: boolean;
  onOpenMedia?: (msg: ApiMessage, stack?: ApiMessage[]) => void;
  onMediaLoad?: () => void;
};

export const ImageStackBubble = memo(function ImageStackBubble({
  messages,
  isMe,
  onOpenMedia,
  onMediaLoad,
}: Props) {
  const visible = messages.slice(0, 4);
  const extra = messages.length - visible.length;

  const layers = useMemo(
    () =>
      visible.map((msg, idx) => {
        const isTop = idx === visible.length - 1;
        const depth = visible.length - 1 - idx;
        return {
          msg,
          src: resolveChatImageUrl(msg.imageUrl || msg.imageData),
          left: depth * 14,
          top: depth * 10,
          rotate: isTop ? 4 : -3 - depth * 1.5,
          scale: 1 - depth * 0.04,
          z: idx,
          opacity: isTop ? 1 : 0.92 - depth * 0.08,
        };
      }),
    [visible],
  );

  return (
    <div className="relative" style={{ width: 188, height: 228 }}>
        {layers.map((layer) => (
          <button
            key={layer.msg.id}
            type="button"
            onClick={() => onOpenMedia?.(layer.msg, messages)}
            className="absolute rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-[#1a1a1a] transition-transform active:scale-[0.98]"
            style={{
              width: 152,
              height: 196,
              left: layer.left,
              top: layer.top,
              zIndex: layer.z,
              transform: `rotate(${layer.rotate}deg) scale(${layer.scale})`,
              opacity: layer.opacity,
            }}
            aria-label="Open photo"
          >
            {layer.src ? (
              <img
                src={layer.src}
                alt=""
                className="w-full h-full object-cover"
                loading="eager"
                decoding="async"
                fetchPriority={layer.z === layers.length - 1 ? "high" : "auto"}
                onLoad={onMediaLoad}
              />
            ) : (
              <div className="w-full h-full bg-white/5" />
            )}
          </button>
        ))}
        {extra > 0 && (
          <span className="absolute bottom-3 right-1 z-50 px-2 py-0.5 rounded-full bg-black/70 text-white text-xs font-semibold border border-white/20">
            +{extra}
          </span>
        )}
        {messages.length > 1 && (
          <span className="absolute top-2 left-2 z-50 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-medium border border-white/15">
            {messages.length} photos
          </span>
        )}
      </div>
  );
});
