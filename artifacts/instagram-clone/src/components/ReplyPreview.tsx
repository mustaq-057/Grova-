import { memo, useMemo } from "react";
import { X } from "lucide-react";
import type { ApiMessage } from "@/lib/api";
import { resolveChatImageUrl } from "@/lib/media-url";
import { replyPreviewLabel } from "@/lib/message-utils";

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
  const thumbSrc = useMemo(
    () => (isPhoto ? resolveChatImageUrl(replyTo.imageUrl || replyTo.imageData) : undefined),
    [isPhoto, replyTo.imageUrl, replyTo.imageData],
  );

  return (
    <div className="mx-3 mb-2 flex items-stretch gap-2 rounded-2xl bg-[#262626] border border-white/10 overflow-hidden max-h-32">
      <div className="w-1 shrink-0 bg-primary" aria-hidden />
      <div className="flex-1 min-w-0 py-2.5 pr-2 flex gap-2.5 items-start">
        {thumbSrc ? (
          <img
            src={thumbSrc}
            alt=""
            className="w-14 h-14 rounded-xl object-cover shrink-0 bg-black/30"
          />
        ) : null}
        <div className="flex-1 min-w-0 overflow-y-auto scrollbar-hide">
          <p className="text-xs font-semibold text-primary">Replying to {who}</p>
          <p className="text-sm text-white/80 mt-0.5 whitespace-pre-wrap break-words line-clamp-4">
            {preview}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="shrink-0 px-3 text-white/60 hover:text-white self-center"
        aria-label="Cancel reply"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
});
