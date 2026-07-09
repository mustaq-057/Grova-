import { useState, memo, useCallback, useMemo, useRef, useLayoutEffect } from "react";
import { useLocation } from "wouter";
import { createPortal } from "react-dom";
import { Smile, MoreHorizontal, Trash2, Download, Pin } from "lucide-react";
import { motion } from "framer-motion";
import { AudioMessage } from "@/components/AudioMessage";
import { cn } from "@/lib/utils";
import { ChatFileBubble } from "@/components/ChatFileBubble";
import { DeletedMessageNotice } from "@/components/DeletedMessageNotice";
import { DuaMessage } from "@/components/DuaMessage";
import { EphemeralMediaBubble, ViewOnceIcon } from "@/components/EphemeralMediaBubble";
import { ImageStackBubble } from "@/components/ImageStackBubble";
import { AvatarImage } from "@/components/AvatarImage";
import { EmojiReactionsModal } from "@/components/EmojiReactionsModal";
import EmojiPicker from "@/components/EmojiPicker";
import type { ApiMessage } from "@/lib/api";
import { isCallLogMessage } from "@/lib/call-chat-log";
import { getPartnerBubbleColors } from "@/lib/themes";
import { getQuickReactions, onQuickReactionsChanged } from "@/lib/quick-reactions";
import { isEphemeralMedia, isReplyPhotoPlaceholder, parseLegacyReply, parseMediaViewMode, replyPreviewLabel, getFontStyleStyles } from "@/lib/message-utils";
import { tryRefreshSession } from "@/lib/api";
import { MessageText } from "@/lib/linkify";
import { resolveChatImageUrl, resolveChatVideoUrl, resolveChatAudioUrl, resolveMediaDownloadUrl } from "@/lib/media-url";
import { useEffect } from "react";
import { useChatTheme } from "@/hooks/useChatTheme";
import { useCall } from "@/lib/call-context";
import { downloadFileNative } from "@/lib/native-download";
import { Phone, PhoneOff, PhoneForwarded, PhoneMissed, Video, Lock, Clock, Palette } from "lucide-react";

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
  stack?: ApiMessage[];
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
  animateEntrance?: boolean;
  openingMedia?: boolean;
  isScheduled?: boolean;
  scheduledAt?: string;
}

export const MessageItem = memo(function MessageItem({
  msg,
  stack,
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
  animateEntrance = true,
  openingMedia = false,
  isScheduled = false,
  scheduledAt,
}: MessageItemProps) {
  const sameSender = prevMsg?.senderId === msg.senderId;
  const [showReactions, setShowReactions] = useState(false);
  const [reactionAnchor, setReactionAnchor] = useState<DOMRect | null>(null);
  const [hovered, setHovered] = useState(false);
  const [quickReactions, setQuickReactions] = useState(getQuickReactions);
  const [showReactionEmojiPicker, setShowReactionEmojiPicker] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [imageRetry, setImageRetry] = useState(0);
  const [doodleExpired, setDoodleExpired] = useState(false);

  useEffect(() => {
    if ((msg.variant as string) === "doodle_invite") {
      const checkExpiry = () => {
        const elapsed = Date.now() - new Date(msg.timestamp).getTime();
        setDoodleExpired(elapsed > 60000);
      };
      checkExpiry();
      const interval = setInterval(checkExpiry, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [msg.timestamp, msg.variant]);

  const remoteImageSrc = useMemo(
    () => resolveChatImageUrl(msg.imageUrl || msg.imageData),
    [msg.imageUrl, msg.imageData],
  );
  const [displayImageSrc, setDisplayImageSrc] = useState<string | undefined>(remoteImageSrc);
  const reactBtnRef = useRef<HTMLButtonElement>(null);
  const bubbleWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => onQuickReactionsChanged(setQuickReactions), []);



  const isEmojiOnly = useMemo(() => (msg.type === "text" || msg.type === "heart") && isEmojiOnlyText(msg.text), [msg.type, msg.text]);
  const isImage = useMemo(() => msg.type === "image" || msg.type === "doodle", [msg.type]);
  const isLegacyEmojiSticker = useMemo(() => msg.type === "sticker", [msg.type]);
  const isImageSticker = useMemo(() => isImage && Boolean(msg.imageUrl?.includes("/stickerz/")), [isImage, msg.imageUrl]);
  const isGif = useMemo(() => msg.type === "gif", [msg.type]);
  const isDoodle = useMemo(() => msg.type === "doodle", [msg.type]);
  const isFile = useMemo(() => msg.type === "file", [msg.type]);
  const isVideo = useMemo(() => msg.type === "video", [msg.type]);
  const isLocation = useMemo(() => msg.type === "location", [msg.type]);
  const isCallLog = useMemo(() => isCallLogMessage(msg.text), [msg.text]);
  const isDua = useMemo(() => msg.type === "text" && msg.companionSticker === "🤲", [msg.type, msg.companionSticker]);
  const isText = useMemo(() => msg.type === "text" || msg.type === "heart", [msg.type]);
  const customBubbleStyle = null;
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
    if (!isMe) {
      setDisplayImageSrc(remote);
      return;
    }
    if (remote.startsWith("blob:") || remote.startsWith("data:")) {
      setDisplayImageSrc(remote);
      return;
    }
    setDisplayImageSrc((current) => {
      if (!current) return remote;
      const currentIsLocal = current.startsWith("blob:") || current.startsWith("data:");
      return currentIsLocal ? current : remote;
    });
  }, [remoteImageSrc, isMe]);

  useEffect(() => {
    if (!isMe) return;
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
  }, [remoteImageSrc, displayImageSrc, msg.id, msg.imageUrl, onMediaCommitted, isMe]);
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
  const isStoryReply = quotedText === "Story";
  const hasReply = Boolean(quotedText);
  const [, setLocation] = useLocation();

  const replyThumbSrc = useMemo(() => {
    const rawUrl = replySource
      ? (replySource.imageUrl || replySource.imageData)
      : msg.replyToImageUrl;
    const type = replySource ? replySource.type : (msg.replyToImageUrl ? "image" : undefined);
    if (!rawUrl || (type !== "image" && type !== "doodle")) return undefined;
    if (replySource && isEphemeralMedia(replySource)) return undefined;
    return resolveChatImageUrl(rawUrl);
  }, [replySource, msg.replyToImageUrl]);

  const showReplyPhoto = Boolean(replyThumbSrc);

  const replyTargetLabel = useMemo(() => {
    if (!hasReply) return "";
    const targetId = msg.replyToSenderId;
    if (!targetId) return partnerName;
    if (targetId === myId) return "yourself";
    return partnerName;
  }, [hasReply, msg.replyToSenderId, myId, partnerName]);

  const { theme } = useChatTheme();
  const { startCall } = useCall();

  const defaultBubbleStyle = { backgroundColor: theme.bubbleColor, borderColor: theme.bubbleBorder };
  const partnerBubbleStyle = useMemo(() => {
    const c = getPartnerBubbleColors(theme);
    return { backgroundColor: c.fill, borderColor: c.border };
  }, [theme]);
  
  const currentBubbleStyle = isMe ? defaultBubbleStyle : partnerBubbleStyle;

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

  if (msg.deleted) {
    if (msg.companionSticker?.includes("__vanish__")) return null;
    return <DeletedMessageNotice isMe={isMe} partnerName={partnerName} />;
  }

  const viewMode = msg.mediaViewMode ?? parseMediaViewMode(msg.companionSticker);
  const mediaLimit = viewMode === "once" ? 1 : viewMode === "twice" ? 2 : 0;
  const mediaOpenedCount = msg.mediaOpenCount ?? 0;
  const mediaRemaining = Math.max(0, mediaLimit - mediaOpenedCount);
  const showEphemeralBubble = isEphemeralMedia(msg) && (isImage || isVideo);
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
        showEphemeralBubble ? (
          <EphemeralMediaBubble
            kind="photo"
            viewMode={viewMode as "once" | "twice"}
            isMe={isMe}
            viewsRemaining={mediaRemaining}
            wasOpened={mediaWasOpened}
            openedAt={msg.mediaOpenedAt}
            sentAt={msg.timestamp}
            opening={openingMedia}
            onOpen={() => onOpenMedia?.(msg)}
          />
        ) : stack && stack.length > 1 ? (
          <ImageStackBubble
            messages={stack}
            isMe={isMe}
            onOpenMedia={onOpenMedia}
            onMediaLoad={() => onMediaLoad?.(msg.id)}
          />
        ) : imageDisplaySrc && !imageLoadFailed ? (
          <div className="relative group/media inline-block max-w-full">
            <img
              src={imageDisplaySrc}
              alt={isDoodle ? "Doodle" : ""}
              className={cn(
                "max-w-[min(280px,92vw)] max-h-[340px] min-h-[72px] w-auto h-auto object-contain rounded-2xl block cursor-pointer bg-black/15",
                isDoodle && "shadow-sm",
                isImageSticker && "aspect-square w-[200px] h-[200px]"
              )}
              loading="eager"
              fetchPriority="high"
              referrerPolicy="no-referrer"
              onLoad={() => {
                onMediaLoad?.(msg.id);
              }}
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
            {!isEphemeralMedia(msg) && (
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const downloadUrl = resolveMediaDownloadUrl(msg.imageUrl || msg.imageData || imageDisplaySrc, "image");
                    const res = await fetch(downloadUrl);
                    const blob = await res.blob();
                    await downloadFileNative(blob, `grova-${msg.type}-${Date.now()}.jpg`);
                  } catch (err) {
                    console.error("Download failed", err);
                  }
                }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center transition-opacity z-10 hover:bg-black/70 shadow-sm"
                aria-label="Download image"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
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
        showEphemeralBubble ? (
          <EphemeralMediaBubble
            kind="video"
            viewMode={viewMode as "once" | "twice"}
            isMe={isMe}
            viewsRemaining={mediaRemaining}
            wasOpened={mediaWasOpened}
            openedAt={msg.mediaOpenedAt}
            sentAt={msg.timestamp}
            opening={openingMedia}
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
      ) : (msg.variant as string) === "doodle_invite" ? (
        <div className="flex flex-col gap-2 p-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
              <Palette className="w-4 h-4 text-red-500" />
            </div>
            <p className="font-semibold text-[15px]">{msg.text}</p>
          </div>
          <button 
            onClick={() => {
              if (!doodleExpired) onOpenMedia?.(msg);
            }}
            disabled={doodleExpired}
            className={`w-full mt-1 rounded-xl py-2 font-bold transition-all shadow-lg ${
              doodleExpired 
                ? "bg-secondary text-muted-foreground cursor-not-allowed shadow-none" 
                : "bg-red-500 text-white hover:bg-red-600 shadow-red-500/20"
            }`}
          >
            {doodleExpired ? "⏱️ Invitation Expired" : "🎨 Join Live Canvas"}
          </button>
        </div>

      ) : displayText && (msg.type === "text" || msg.type === "heart" || msg.type === "sticker") ? (
        <div className={cn(msg.companionSticker && !msg.companionSticker.startsWith("__vm:") && msg.companionSticker !== "🤲" && "flex items-start gap-1.5")}>
          {msg.companionSticker && !msg.companionSticker.startsWith("__vm:") && msg.companionSticker !== "🤲" && (
            <span className="text-xl leading-snug shrink-0">{msg.companionSticker}</span>
          )}
          <div className="flex-1 min-w-0"><MessageText text={displayText} /></div>
        </div>
      ) : null}
    </>
  );

  const bubbleNode =
    isEmojiOnly || isLegacyEmojiSticker ? (
      <div className="text-6xl sm:text-7xl px-2 py-1 select-none leading-none">{isLegacyEmojiSticker ? msg.text : bubbleContent}</div>
    ) : isDua ? (
      <DuaMessage msg={msg} isMe={isMe} />
    ) : isGif || isImage || isVideo || isFile || isLocation ? (
      <>{bubbleContent}</>
    ) : (
      <div
        className={cn(
          "chat-bubble-text px-3 py-2 sm:px-3.5 sm:py-2 text-[16px] sm:text-[17px] leading-relaxed border-2 relative break-words whitespace-pre-wrap [overflow-wrap:anywhere]",
          customBubbleStyle ? `bubble-${customBubbleStyle}` : "bubble-default",
          !customBubbleStyle && (isMe ? "rounded-br-md" : "rounded-bl-md"),
          !customBubbleStyle && (isMe ? (theme.textColor ? "" : "text-white") : (theme.partnerTextColor ? "" : "text-white"))
        )}
        style={
          customBubbleStyle 
            ? getFontStyleStyles(msg.fontStyle)
            : { 
                ...currentBubbleStyle, 
                ...getFontStyleStyles(msg.fontStyle),
                ...(isMe && theme.textColor ? { color: theme.textColor } : {}),
                ...(!isMe && theme.partnerTextColor ? { color: theme.partnerTextColor } : {})
              }
        }
      >
        {bubbleContent}
      </div>
    );

  if (isCallLog && msg.text) {
    const isVideoLog = msg.text.toLowerCase().includes("video");
    const isEnded = msg.text.toLowerCase().includes("ended");
    const isMissed = msg.text.toLowerCase().includes("missed");
    const isOutgoing = isMe;
    
    // Parse duration if present (e.g. "📞 Audio call ended · 10:45 AM · 5:23")
    const parts = msg.text.split(" · ");
    const durationStr = parts.length >= 3 ? parts[2] : null;
    
    let title = isVideoLog ? "Video call" : "Audio call";
    if (isMissed) title = `Missed ${isVideoLog ? "video" : "audio"} call`;
    else if (isEnded) title = `${isVideoLog ? "Video" : "Audio"} call ended`;
    else title = `${isVideoLog ? "Video" : "Audio"} call started`;

    // Format timestamp nicely for the call log (e.g. 9:41 PM)
    const timeString = new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    const isMissedRed = isMissed;
    const bgColor = isMissedRed ? "bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30" : "bg-card hover:bg-card/80 active:bg-card/60 shadow-sm";
    const borderColor = isMissedRed ? "border-red-500/20" : "border-border";
    const iconContainerColor = isMissedRed ? "bg-red-500/20" : "bg-primary/15";
    const textColor = isMissedRed ? "text-red-600 dark:text-red-400" : "text-card-foreground";
    const timeColor = isMissedRed ? "text-red-600/70 dark:text-red-400/70" : "text-muted-foreground";
    const iconColor = isMissedRed ? "text-red-600 dark:text-red-400" : "text-primary";

    return (
      <div 
        className={`flex ${isMe ? "justify-end" : "justify-start"} my-1 px-4 max-w-full`}
        data-testid={`message-${msg.id}`}
      >
        <button
          onClick={() => startCall(isVideoLog ? "video" : "audio")}
          className={`flex items-center gap-3 transition-colors rounded-3xl px-4 py-3 max-w-[85%] sm:max-w-[70%] border text-left ${bgColor} ${borderColor}`}
        >
          {/* Circular Icon Container */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${iconContainerColor}`}>
            {isVideoLog ? (
              <Video className={`w-6 h-6 ${iconColor}`} fill="currentColor" />
            ) : isMissed ? (
              <PhoneMissed className={`w-6 h-6 ${iconColor}`} />
            ) : isEnded ? (
              <PhoneOff className={`w-6 h-6 ${iconColor}`} />
            ) : isOutgoing ? (
              <PhoneForwarded className={`w-6 h-6 ${iconColor}`} />
            ) : (
              <Phone className={`w-6 h-6 ${iconColor}`} fill="currentColor" />
            )}
          </div>
          
          {/* Text Content */}
          <div className="flex flex-col flex-1 min-w-0">
            <p className={`font-semibold text-[15px] truncate ${textColor}`}>
              {title}
            </p>
            <p className={`text-[13px] mt-0.5 ${timeColor}`}>
              {timeString} {durationStr ? ` · ${durationStr}` : ''}
            </p>
          </div>
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={animateEntrance ? { opacity: 0, scale: 0.95, y: 15 } : false}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={animateEntrance ? { type: "spring", stiffness: 400, damping: 28 } : { duration: 0 }}
      className={`group flex items-end gap-2 mb-1 min-w-0 max-w-full ${isMe ? "flex-row-reverse" : "flex-row"}`}
      data-testid={`message-${msg.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="listitem"
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
              {isStoryReply ? (
                isMe ? (
                  msg.replyToSenderId === myId ? "You replied to your story" : `You replied to ${partnerName}'s story`
                ) : (
                  msg.replyToSenderId === myId ? `${partnerName} replied to your story` : `${partnerName} replied to their story`
                )
              ) : (
                `${isMe ? "You" : partnerName} replied to ${replyTargetLabel}`
              )}
            </p>
            <button
              type="button"
              onClick={() => {
                if (msg.replyToText === "Story") {
                  setLocation(`/?storyId=${msg.replyToId}`);
                } else if (msg.replyToId?.startsWith("__note__")) {
                  const noteUserId = msg.replyToId.replace("__note__", "");
                  setLocation(`/?noteUserId=${noteUserId}`);
                } else if (msg.replyToId && onJumpToMessage) {
                  onJumpToMessage(msg.replyToId);
                }
              }}
              className={`w-full max-w-full rounded-2xl bg-[#262626] border border-white/10 px-3 py-2.5 text-left transition-colors hover:bg-[#2e2e2e] active:bg-[#333] ${msg.replyToId ? "cursor-pointer" : "cursor-default"}`}
              disabled={!msg.replyToId && msg.replyToText !== "Story"}
            >
              <div className="flex gap-2.5 items-center min-w-0">
                {showReplyPhoto && replyThumbSrc ? (
                  <img
                    src={replyThumbSrc}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover shrink-0 bg-black/30 border border-white/10"
                    loading="lazy"
                  />
                ) : (replySource && isEphemeralMedia(replySource)) || (quotedText?.includes("view once") || quotedText?.includes("view twice")) ? (
                  (() => {
                    const count = replySource ? (replySource.mediaViewMode === "twice" || parseMediaViewMode(replySource.companionSticker) === "twice" ? 2 : 1) : (quotedText?.includes("twice") ? 2 : 1);
                    const isOpenedState = replySource ? (replySource.senderId === myId ? replySource.mediaOpenCount! > 0 : (replySource.mediaOpenCount || 0) >= count) : false;
                    return (
                      <div className="w-10 h-10 rounded-lg bg-[#1f2c34] border border-white/5 flex items-center justify-center shrink-0 p-0.5 scale-75 origin-left">
                        <ViewOnceIcon count={count as 1 | 2} opened={isOpenedState} />
                      </div>
                    );
                  })()
                ) : isReplyPhotoPlaceholder(quotedText) ? (
                  <div className="w-10 h-10 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center shrink-0">
                    <span className="text-base opacity-60">📷</span>
                  </div>
                ) : null}
                <span 
                  className="flex-1 min-w-0 text-[13px] sm:text-[14px] text-white/80 whitespace-pre-wrap break-words line-clamp-3"
                  style={getFontStyleStyles(replySource?.fontStyle)}
                >
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

        {msg.pinned && (
          <div className={`flex items-center justify-center p-1 z-10 ${isMe ? "mr-1" : "ml-1"}`}>
            <Pin className="w-3 h-3 text-primary rotate-45" fill="currentColor" />
          </div>
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
                ? "text-primary animate-pulse seen-glow"
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

// ─── Doodle message bubble ──────────────────────────────────────────────────────

interface DoodleBubbleProps {
  msg: ApiMessage;
  src: string | undefined;
  isMe: boolean;
  onUnsend?: () => void;
  doodleWidth?: number;
  doodleHeight?: number;
}

const DoodleMessageBubble = memo(function DoodleMessageBubble({
  msg, src, isMe, onUnsend, doodleWidth = 200, doodleHeight = 200,
}: DoodleBubbleProps) {
  const [showSheet, setShowSheet] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  return (
    <div
      className="relative group/doodle"
    >
      {src ? (
        <button
          type="button"
          onClick={() => setShowSheet(true)}
          className={cn(
            "block active:opacity-80 transition-opacity rounded-2xl overflow-hidden",
            isMe ? "bg-primary/10" : "bg-secondary/50",
          )}
          style={{
            width: doodleWidth,
            height: doodleHeight,
          }}
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
        <div 
          className="bg-white/10 animate-pulse rounded-2xl"
          style={{
            width: doodleWidth,
            height: doodleHeight,
          }}
        />
      )}

      {showSheet && (
        <DoodleSheet
          isMe={isMe}
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
    >
      {src ? (
        <button
          type="button"
          onClick={() => isMe && setShowSheet(true)}
          className="w-full h-full block active:opacity-80 transition-opacity"
          aria-label={isMe ? "Tap to manage doodle" : "Doodle"}
          disabled={!isMe}
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
          isMe={isMe}
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

// ── Unsend bottom sheet ──────────────────────────────────────────────────────

function DoodleSheet({ isMe, onClose, onUnsend }: { isMe: boolean; onClose: () => void; onUnsend: () => void }) {
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
          {isMe && (
            <button
              onClick={onUnsend}
              className="w-full flex items-center gap-3 px-5 py-4 text-[17px] text-red-400 font-medium hover:bg-white/5 transition-colors active:bg-white/10"
            >
              <Trash2 className="w-5 h-5" />
              <span>Unsend</span>
            </button>
          )}
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
