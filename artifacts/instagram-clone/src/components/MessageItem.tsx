import { useState, memo, useCallback, useMemo, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Smile, MoreHorizontal, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { AudioMessage } from "@/components/AudioMessage";
import { cn } from "@/lib/utils";
import { ChatFileBubble } from "@/components/ChatFileBubble";
import { DeletedMessageNotice } from "@/components/DeletedMessageNotice";
import { DuaMessage } from "@/components/DuaMessage";
import { EphemeralMediaBubble } from "@/components/EphemeralMediaBubble";
import { AvatarImage } from "@/components/AvatarImage";
import { EmojiReactionsModal } from "@/components/EmojiReactionsModal";
import EmojiPicker from "@/components/EmojiPicker";
import type { ApiMessage } from "@/lib/api";
import { isCallLogMessage } from "@/lib/call-chat-log";
import { getPartnerBubbleColors } from "@/lib/themes";
import { getQuickReactions, onQuickReactionsChanged } from "@/lib/quick-reactions";
import { isReplyPhotoPlaceholder, parseLegacyReply, parseMediaViewMode, replyPreviewLabel } from "@/lib/message-utils";
import { tryRefreshSession } from "@/lib/api";
import { MessageText } from "@/lib/linkify";
import { resolveChatImageUrl, resolveChatVideoUrl, resolveChatAudioUrl } from "@/lib/media-url";
import { useEffect } from "react";

function isEmojiOnlyText(text?: string): boolean {
  if (!text) return false;
  const stripped = text.replace(/\s/g, "");
  return stripped.length > 0 && stripped.length <= 6 && /^\p{Emoji}+$/u.test(stripped);
}

function hasArabic(text?: string): boolean {
  if (!text) return false;
  return /[\u0600-\u06FF]/.test(text);
}

export interface MessageItemProps {
  msg: ApiMessage;
  isMe: boolean;
  myId: string;
  partnerName: string;
  partnerAvatar: string;

  onDelete: (id: string) => void;
  onLike: (id: string) => void;
  onReact?: (id: string, emoji: string) => void;
  onUnsend?: (id: string) => void;
  onPin?: (id: string) => void;
  onReply?: (msg: ApiMessage) => void;
  onEdit?: (msg: ApiMessage) => void;
  onOpenMenu?: (msg: ApiMessage, anchor: DOMRect) => void;
  prevMsg?: ApiMessage;
  seenLabel?: string;
  onStartThread?: (msg: ApiMessage) => void;
  onReplyToThread?: (threadId: string) => void;
  onMediaLoad?: (messageId: string) => void;
  onMediaCommitted?: (messageId: string, field: "imageUrl" | "imageData" | "fileData", remoteUrl: string) => void;
  onOpenMedia?: (msg: ApiMessage) => void;
  replySource?: ApiMessage;
  onJumpToMessage?: (messageId: string) => void;
}

export const MessageItem = memo(function MessageItem({
  msg,
  isMe,
  myId,
  partnerName,
  partnerAvatar,

  onLike,
  onReact,
  onUnsend,
  onReply,
  onOpenMenu,
  prevMsg,
  seenLabel,
  onStartThread,
  onReplyToThread,
  onMediaLoad,
  onMediaCommitted,
  onOpenMedia,
  replySource,
  onJumpToMessage,
}: MessageItemProps) {
  const sameSender = prevMsg?.senderId === msg.senderId;
  const [showReactions, setShowReactions] = useState(false);
  const [reactionAnchor, setReactionAnchor] = useState<DOMRect | null>(null);
  const [hovered, setHovered] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [quickReactions, setQuickReactions] = useState(getQuickReactions);
  const [showReactionEmojiPicker, setShowReactionEmojiPicker] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [imageRetry, setImageRetry] = useState(0);
  const remoteImageSrc = useMemo(
    () => resolveChatImageUrl(msg.imageUrl || msg.imageData),
    [msg.imageUrl, msg.imageData],
  );
  const [displayImageSrc, setDisplayImageSrc] = useState<string | undefined>(remoteImageSrc);
  const reactBtnRef = useRef<HTMLButtonElement>(null);
  const bubbleWrapRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => onQuickReactionsChanged(setQuickReactions), []);



  const isEmojiOnly = useMemo(() => (msg.type === "text" || msg.type === "heart") && isEmojiOnlyText(msg.text), [msg.type, msg.text]);
  const isSticker = useMemo(() => msg.type === "sticker", [msg.type]);
  const isGif = useMemo(() => msg.type === "gif", [msg.type]);
  const isImage = useMemo(() => msg.type === "image", [msg.type]);
  const isDoodle = useMemo(() => msg.type === "doodle", [msg.type]);
  const isFile = useMemo(() => msg.type === "file", [msg.type]);
  const isVideo = useMemo(() => msg.type === "video", [msg.type]);
  const isLocation = useMemo(() => msg.type === "location", [msg.type]);
  const isCallLog = useMemo(() => isCallLogMessage(msg.text), [msg.text]);
  const isDua = useMemo(() => msg.type === "text" && msg.companionSticker === "🤲", [msg.type, msg.companionSticker]);
  const isText = useMemo(() => msg.type === "text" || msg.type === "heart", [msg.type]);
  const customBubbleStyle = useMemo(() => msg.variant && msg.variant !== "default" ? msg.variant : null, [msg.variant]);
  const rtl = useMemo(() => hasArabic(msg.text), [msg.text]);
  const imageDisplaySrc = useMemo(() => {
    const base = displayImageSrc;
    if (!base || imageRetry === 0) return base;
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}_retry=${imageRetry}`;
  }, [displayImageSrc, imageRetry]);

  useEffect(() => {
    const remote = remoteImageSrc;
    if (!remote) return;
    if (remote.startsWith("blob:") || remote.startsWith("data:")) {
      setDisplayImageSrc(remote);
      return;
    }
    setDisplayImageSrc((current) => {
      if (!current) return remote;
      const currentIsLocal = current.startsWith("blob:") || current.startsWith("data:");
      return currentIsLocal ? current : remote;
    });
  }, [remoteImageSrc]);

  useEffect(() => {
    const remote = remoteImageSrc;
    if (!remote || remote.startsWith("blob:") || remote.startsWith("data:")) return;
    const showingLocal =
      displayImageSrc?.startsWith("blob:") || displayImageSrc?.startsWith("data:");
    if (!showingLocal || displayImageSrc === remote) return;

    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      setDisplayImageSrc(remote);
      const field =
        msg.imageUrl?.startsWith("blob:") || msg.imageUrl?.startsWith("data:")
          ? "imageUrl"
          : "imageData";
      onMediaCommitted?.(msg.id, field, remote);
    };
    img.onerror = () => {
      if (!cancelled) setDisplayImageSrc(remote);
    };
    img.src = remote;
    return () => {
      cancelled = true;
    };
  }, [remoteImageSrc, displayImageSrc, msg.id, msg.imageUrl, onMediaCommitted]);
  const videoDisplaySrc = useMemo(
    () => resolveChatVideoUrl(msg.fileData, msg.text, msg.fileType),
    [msg.fileData, msg.text, msg.fileType],
  );
  const audioDisplaySrc = useMemo(
    () => resolveChatAudioUrl(msg.audioData) ?? msg.audioData,
    [msg.audioData],
  );

  useEffect(() => {
    if (!remoteImageSrc?.startsWith("http")) {
      setImageLoadFailed(false);
      setImageRetry(0);
    }
  }, [remoteImageSrc]);

  const legacyReply = useMemo(
    () => (!msg.replyToText && msg.text ? parseLegacyReply(msg.text) : null),
    [msg.replyToText, msg.text],
  );
  const quotedText = msg.replyToText ?? legacyReply?.quoted;
  const displayText = legacyReply?.body ?? msg.text;
  const hasReply = Boolean(quotedText);

  const replyThumbSrc = useMemo(() => {
    if (!replySource || replySource.type !== "image") return undefined;
    return resolveChatImageUrl(replySource.imageUrl || replySource.imageData);
  }, [replySource]);

  const showReplyPhoto =
    Boolean(replyThumbSrc) &&
    (replySource?.type === "image" || isReplyPhotoPlaceholder(quotedText));

  const replyTargetLabel = useMemo(() => {
    if (!hasReply) return "";
    const targetId = msg.replyToSenderId;
    if (!targetId) return partnerName;
    if (targetId === myId) return "yourself";
    return partnerName;
  }, [hasReply, msg.replyToSenderId, myId, partnerName]);

  const defaultBubbleStyle = isMe
    ? { backgroundColor: "var(--color-primary, #2563EB)", borderColor: "var(--color-primary, #2563EB)" }
    : { backgroundColor: "var(--color-secondary, #374151)", borderColor: "var(--color-secondary, #374151)" };

  const openReactionPicker = useCallback(() => {
    const anchor = bubbleWrapRef.current;
    if (!anchor) {
      setShowReactions((s) => !s);
      return;
    }
    setReactionAnchor(anchor.getBoundingClientRect());
    setShowReactions(true);
  }, []);

  useLayoutEffect(() => {
    if (!showReactions || !bubbleWrapRef.current) return;
    const update = () => {
      if (bubbleWrapRef.current) setReactionAnchor(bubbleWrapRef.current.getBoundingClientRect());
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [showReactions]);

  const handleReaction = useCallback((emoji: string) => {
    onReact?.(msg.id, emoji);
    setShowReactions(false);
  }, [onReact, msg.id]);

  const handleLike = useCallback(() => onLike(msg.id), [onLike, msg.id]);
  const handleReply = useCallback(() => onReply?.(msg), [onReply, msg]);
  const handleOpenMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowReactions(false);
    setShowReactionEmojiPicker(false);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    onOpenMenu?.(msg, rect);
  }, [onOpenMenu, msg]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwiping(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      setIsSwiping(true);
      setSwipeOffset(Math.max(-80, Math.min(0, deltaX)));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (isSwiping && swipeOffset < -50) onReply?.(msg);
    setSwipeOffset(0);
    setIsSwiping(false);
  }, [isSwiping, swipeOffset, onReply, msg]);

  if (msg.deleted) {
    return <DeletedMessageNotice isMe={isMe} partnerName={partnerName} />;
  }

  // ── Doodle: rendered inline as an absolute overlay ──────────────────
  if (isDoodle) {
    const src = resolveChatImageUrl(msg.imageUrl || msg.imageData);
    let pos = { canvasX: 0, canvasY: 0, width: 100, height: 100 };
    try {
      if (msg.text) pos = JSON.parse(msg.text);
    } catch(e) {}

    return (
      <div 
        className="absolute pointer-events-auto"
        style={{
           left: pos.canvasX,
           top: pos.canvasY,
           width: pos.width,
           height: pos.height,
           zIndex: 20,
        }}
      >
        <DoodleMessageOverlay
          msg={msg}
          src={src}
          isMe={isMe}
          onUnsend={() => onUnsend?.(msg.id)}
        />
      </div>
    );
  }

  const viewMode = msg.mediaViewMode ?? parseMediaViewMode(msg.companionSticker);
  const mediaLimit = viewMode === "once" ? 1 : viewMode === "twice" ? 2 : 0;
  const mediaOpenedCount = msg.mediaOpenCount ?? 0;
  const mediaRemaining = Math.max(0, mediaLimit - mediaOpenedCount);
  const isEphemeralMedia = mediaLimit > 0 && (isImage || isVideo);
  const mediaWasOpened = Boolean(msg.mediaOpenedAt);

  const bubbleContent = (
    <>
      {msg.type === "audio" && !msg.audioData ? (
        <p className="text-sm text-muted-foreground italic px-1">Sending voice…</p>
      ) : msg.type === "audio" && audioDisplaySrc ? (
        <AudioMessage audioData={audioDisplaySrc} isMe={isMe} />
      ) : isGif && msg.gifUrl ? (
        <img
          src={msg.gifUrl}
          alt="GIF"
          className="max-w-[min(280px,92vw)] max-h-[340px] min-h-[72px] w-auto h-auto object-contain rounded-2xl block bg-black/15"
          loading="eager"
          decoding="async"
          onLoad={() => onMediaLoad?.(msg.id)}
        />
      ) : isImage && (msg.imageUrl || msg.imageData || mediaLimit > 0) ? (
        isEphemeralMedia ? (
          <EphemeralMediaBubble
            kind="photo"
            viewMode={viewMode as "once" | "twice"}
            isMe={isMe}
            viewsRemaining={mediaRemaining}
            wasOpened={mediaWasOpened}
            openedAt={msg.mediaOpenedAt}
            sentAt={msg.timestamp}
            onOpen={() => onOpenMedia?.(msg)}
          />
        ) : imageDisplaySrc && !imageLoadFailed ? (
          <img
            src={imageDisplaySrc}
            alt=""
            className="max-w-[min(280px,92vw)] max-h-[340px] min-h-[72px] w-auto h-auto object-contain rounded-2xl block cursor-pointer bg-black/15"
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
            onLoad={() => onMediaLoad?.(msg.id)}
            onError={() => {
              if (imageRetry < 2) {
                void tryRefreshSession().finally(() => {
                  setImageRetry((n) => n + 1);
                });
              } else {
                setImageLoadFailed(true);
              }
            }}
            onClick={() => onOpenMedia?.(msg)}
          />
        ) : (
          <button
            type="button"
            onClick={() => onOpenMedia?.(msg)}
            className="max-w-[min(280px,92vw)] min-h-[120px] px-4 py-6 rounded-2xl bg-[#262626] border border-white/10 text-sm text-white/70 text-center"
          >
            Photo couldn&apos;t load · Tap to open
          </button>
        )
      ) : isVideo && (msg.fileData || mediaLimit > 0) ? (
        isEphemeralMedia ? (
          <EphemeralMediaBubble
            kind="video"
            viewMode={viewMode as "once" | "twice"}
            isMe={isMe}
            viewsRemaining={mediaRemaining}
            wasOpened={mediaWasOpened}
            openedAt={msg.mediaOpenedAt}
            sentAt={msg.timestamp}
            onOpen={() => onOpenMedia?.(msg)}
          />
        ) : videoDisplaySrc?.startsWith("blob:") ? (
          <div className="max-w-[min(280px,92vw)] min-h-[120px] px-4 py-6 rounded-2xl bg-[#262626] border border-white/10 text-sm text-white/70 text-center">
            <video
              src={videoDisplaySrc}
              playsInline
              muted
              className="max-w-full max-h-[200px] mx-auto rounded-xl mb-2 object-contain"
            />
            <p className="text-xs text-muted-foreground italic">Sending video…</p>
          </div>
        ) : videoDisplaySrc ? (
          <video
            src={videoDisplaySrc}
            controls
            playsInline
            preload="metadata"
            className="max-w-[min(280px,92vw)] max-h-[340px] w-auto h-auto object-contain rounded-2xl block cursor-pointer"
            onClick={() => onOpenMedia?.(msg)}
          />
        ) : (
          <p className="text-sm text-muted-foreground italic px-1">Sending video…</p>
        )
      ) : isFile && msg.fileData ? (
        <ChatFileBubble msg={msg} isMe={isMe} />
      ) : isLocation ? (
        <div className="rounded-2xl overflow-hidden min-w-[220px] max-w-[280px] border border-white/10 shadow-lg">
          {msg.location && (
            <a
              href={`https://maps.google.com/?q=${msg.location.lat},${msg.location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src={`https://static-maps.yandex.ru/v1?ll=${msg.location.lng},${msg.location.lat}&z=15&size=400,200&l=map&pt=${msg.location.lng},${msg.location.lat},pm2rdm`}
                alt="Map preview"
                className="w-full h-[120px] object-cover bg-white/5"
                loading="lazy"
                onError={(e) => {
                  // Fallback: hide broken image, show text only
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </a>
          )}
          <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-primary/20 to-primary/10">
            <div className="w-10 h-10 bg-primary/30 rounded-xl flex items-center justify-center shrink-0 ring-2 ring-primary/20">
              <span className="text-xl">📍</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Location shared</p>
              {msg.location && (
                <p className="text-[11px] text-white/60 font-mono mt-0.5">
                  {msg.location.lat.toFixed(5)}, {msg.location.lng.toFixed(5)}
                </p>
              )}
            </div>
            {msg.location && (
              <a
                href={`https://maps.google.com/?q=${msg.location.lat},${msg.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/15 text-white rounded-xl hover:bg-white/25 transition-colors shrink-0"
                aria-label="Open in maps"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </a>
            )}
          </div>
        </div>
      ) : displayText ? (
        <MessageText text={displayText} />
      ) : null}
    </>
  );

  const bubbleNode =
    isEmojiOnly || isSticker ? (
      <div className="text-6xl sm:text-7xl px-2 py-1 select-none leading-none">{isSticker ? msg.text : bubbleContent}</div>
    ) : isDua ? (
      <DuaMessage msg={msg} isMe={isMe} />
    ) : isGif || isImage || isVideo || isFile || isLocation ? (
      <>{bubbleContent}</>
    ) : (
      <div
        className={cn(
          "chat-bubble-text px-3 py-2 sm:px-3.5 sm:py-2 text-[16px] sm:text-[17px] leading-relaxed border-2 relative",
          customBubbleStyle ? `bubble-${customBubbleStyle}` : "bubble-default",
          !customBubbleStyle && (isMe ? "rounded-br-md text-white" : "rounded-bl-md text-white")
        )}
        style={customBubbleStyle ? undefined : defaultBubbleStyle}
      >
        {bubbleContent}
      </div>
    );

  if (isCallLog && msg.text) {
    return (
      <div className="flex justify-center my-3 px-4" data-testid={`message-${msg.id}`} role="listitem">
        <p className="text-xs text-muted-foreground/90 text-center font-medium bg-secondary/40 px-4 py-2 rounded-full">
          {msg.text}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={`group flex items-end gap-2 mb-1 min-w-0 max-w-full ${isMe ? "flex-row-reverse" : "flex-row"}`}
      data-testid={`message-${msg.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="listitem"
      style={{
        transform: `translateX(${swipeOffset}px)`,
        transition: isSwiping ? "none" : "none",
      }}
    >
      {!isMe && !sameSender ? (
        <AvatarImage
          src={partnerAvatar}
          userId={msg.senderId}
          alt=""
          className="w-7 h-7 rounded-full object-cover shrink-0 mb-1"
        />
      ) : !isMe ? (
        <div className="w-7 shrink-0" aria-hidden />
      ) : null}

      <div
        ref={bubbleWrapRef}
        className={`relative min-w-0 max-w-[min(92%,calc(100vw-2.5rem))] md:max-w-[78%] flex flex-col ${isMe ? "items-end" : "items-start"}`}
      >
        <EmojiReactionsModal
          show={showReactions}
          onClose={() => setShowReactions(false)}
          onSelectEmoji={handleReaction}
          anchorRect={reactionAnchor}
          onOpenEmojiPanel={() => setShowReactionEmojiPicker(true)}
        />

        {showReactionEmojiPicker && (
          <EmojiPicker
            title="React with emoji"
            onSelect={(emoji) => {
              handleReaction(emoji);
              setShowReactionEmojiPicker(false);
            }}
            onClose={() => setShowReactionEmojiPicker(false)}
          />
        )}

        {hasReply && (
          <div className={`w-full max-w-full mb-1.5 ${isMe ? "items-end" : "items-start"} flex flex-col`}>
            <p className="text-[11px] sm:text-xs text-muted-foreground/90 mb-1 px-0.5">
              {isMe ? "You" : partnerName} replied to {replyTargetLabel}
            </p>
            <button
              type="button"
              onClick={() => msg.replyToId && onJumpToMessage?.(msg.replyToId)}
              className={`w-full max-w-full rounded-2xl bg-[#262626] border border-white/10 px-3 py-2 text-left text-[14px] sm:text-[15px] text-white/85 leading-snug max-h-28 overflow-hidden scrollbar-hide transition-colors hover:bg-[#2e2e2e] active:bg-[#333] ${msg.replyToId ? "cursor-pointer" : "cursor-default"}`}
              disabled={!msg.replyToId || !onJumpToMessage}
            >
              <div className="flex gap-2.5 items-start min-w-0">
                {showReplyPhoto && replyThumbSrc ? (
                  <img
                    src={replyThumbSrc}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover shrink-0 bg-black/30"
                    loading="lazy"
                  />
                ) : null}
                <span className="flex-1 min-w-0 whitespace-pre-wrap break-words line-clamp-4">
                  {replySource ? replyPreviewLabel(replySource) : quotedText}
                </span>
              </div>
            </button>
          </div>
        )}

        {bubbleNode}

        {typeof msg.reaction === "string" && msg.reaction.trim() && (
          <button
            type="button"
            onClick={openReactionPicker}
            className={`emoji-native text-[1.1rem] leading-none -mt-1 mb-0.5 z-10 ${isMe ? "mr-1" : "ml-1"}`}
            title={`Reaction: ${msg.reaction}`}
            aria-label={`Reaction: ${msg.reaction}`}
          >
            {msg.reaction}
          </button>
        )}

        <div
          className={`flex items-center gap-2 mt-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 ${
            hovered || showReactions ? "md:opacity-100" : ""
          } ${isMe ? "flex-row-reverse" : "flex-row"}`}
        >
          <button
            ref={reactBtnRef}
            type="button"
            onClick={openReactionPicker}
            className="p-1 text-white/70 hover:text-white"
            aria-label="React"
          >
            <Smile className="w-4 h-4" strokeWidth={1.75} />
          </button>
          <button type="button" onClick={handleOpenMenu} className="p-1 text-white/70 hover:text-white" aria-label="More">
            <MoreHorizontal className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {isMe && seenLabel && (
          <p
            className={`text-[11px] mt-0.5 pr-1 font-medium transition-all duration-300 ${
              seenLabel === "Just seen"
                ? "text-primary animate-pulse"
                : "text-muted-foreground/80"
            }`}
          >
            {seenLabel}
          </p>
        )}
      </div>
    </motion.div>
  );
});

// ─── Doodle chat bubble (always inline) ──────────────────────────────────────

interface DoodleOverlayProps {
  msg: ApiMessage;
  src: string | undefined;
  isMe: boolean;
  onUnsend?: () => void;
}

const DoodleMessageOverlay = memo(function DoodleMessageOverlay({
  msg, src, isMe, onUnsend,
}: DoodleOverlayProps) {
  const [showSheet, setShowSheet] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  return (
    <div
      className="w-full h-full relative"
      data-testid={`message-${msg.id}`}
      role="listitem"
    >
      {src ? (
        <button
          type="button"
          onClick={() => setShowSheet(true)}
          className="w-full h-full block active:opacity-80 transition-opacity"
          aria-label="Tap to manage doodle"
        >
          <img
            ref={imgRef}
            src={src}
            alt="Doodle"
            className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
            draggable={false}
          />
        </button>
      ) : (
        <div className="w-full h-full bg-white/10 animate-pulse rounded-2xl" />
      )}

      {showSheet && (
        <DoodleSheet
          onClose={() => setShowSheet(false)}
          onUnsend={() => {
            setShowSheet(false);
            onUnsend?.();
          }}
        />
      )}
    </div>
  );
});

// ─── Unsend bottom sheet ─────────────────────────────────────────────────────

function DoodleSheet({ onClose, onUnsend }: { onClose: () => void; onUnsend: () => void }) {
  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[700] bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="fixed bottom-0 inset-x-0 z-[701] pb-[env(safe-area-inset-bottom,16px)]">
        <div className="mx-3 mb-3 bg-[#1c1c1e] rounded-[18px] overflow-hidden shadow-2xl">
          <div className="px-4 py-3 border-b border-white/8 text-center">
            <p className="text-[13px] text-white/50 font-medium">Doodle</p>
          </div>
          <button
            onClick={onUnsend}
            className="w-full flex items-center gap-3 px-5 py-4 text-[17px] text-red-400 font-medium hover:bg-white/5 transition-colors active:bg-white/10"
          >
            <Trash2 className="w-5 h-5" />
            <span>Unsend</span>
          </button>
        </div>
        <div className="mx-3 bg-[#1c1c1e] rounded-[18px] overflow-hidden shadow-2xl">
          <button
            onClick={onClose}
            className="w-full py-4 text-[17px] text-primary font-semibold hover:bg-white/5 transition-colors active:bg-white/10"
          >
            Cancel
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
