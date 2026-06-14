import { memo } from "react";
import { X, Camera, ImageIcon } from "lucide-react";
import type { ApiMessage } from "@/lib/api";
import { resolveChatImageUrl } from "@/lib/media-url";
import { isEphemeralMedia, replyPreviewLabel, getFontStyleStyles, parseMediaViewMode } from "@/lib/message-utils";
import { ViewOnceIcon } from "@/components/EphemeralMediaBubble";

type Props = {
  replyTo: ApiMessage;
  myId: string;
  partnerName: string;
  onCancel: () => void;
};

export const ReplyPreview = memo(function ReplyPreview({
  replyTo,
  myId,
  partnerName,
  onCancel,
}: Props) {
  const who = replyTo.senderId === myId ? "yourself" : partnerName;
  const preview = replyPreviewLabel(replyTo);
  const isPhoto = replyTo.type === "image";
  const ephemeral = isEphemeralMedia(replyTo);
  const thumbSrc =
    isPhoto && !ephemeral
      ? resolveChatImageUrl(replyTo.imageUrl || replyTo.imageData)
      : undefined;

  const count = ephemeral ? (replyTo.mediaViewMode === "twice" || parseMediaViewMode(replyTo.companionSticker) === "twice" ? 2 : 1) : 1;
  const isOpenedState = ephemeral ? (replyTo.senderId === myId ? replyTo.mediaOpenCount! > 0 : (replyTo.mediaOpenCount || 0) >= count) : false;

  return (
    <div className="mx-3 mb-2 flex items-stretch gap-0 rounded-2xl bg-[#1a1a1a] border border-white/10 overflow-hidden">
      <div className="w-1 shrink-0 bg-primary" aria-hidden />
      <div className="flex-1 min-w-0 py-3 px-3 flex gap-3 items-center">
        {ephemeral ? (
          <div className="w-12 h-12 rounded-xl bg-[#1f2c34] border border-white/5 flex items-center justify-center shrink-0 p-1 scale-75 origin-left">
            <ViewOnceIcon count={count as 1 | 2} opened={isOpenedState} />
          </div>
        ) : thumbSrc ? (
          <img
            src={thumbSrc}
            alt=""
            className="w-12 h-12 rounded-xl object-cover shrink-0 bg-black/30 border border-white/10"
          />
        ) : isPhoto ? (
          <div className="w-12 h-12 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center shrink-0">
            <ImageIcon className="w-5 h-5 text-white/50" strokeWidth={1.75} />
          </div>
        ) : null}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-primary uppercase tracking-wide">
            Replying to {who}
          </p>
          <p 
            className="text-[13px] text-white/75 mt-0.5 whitespace-pre-wrap break-words line-clamp-2"
            style={getFontStyleStyles(replyTo.fontStyle)}
          >
            {preview}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="shrink-0 px-3 text-white/50 hover:text-white self-center transition-colors"
        aria-label="Cancel reply"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
});
