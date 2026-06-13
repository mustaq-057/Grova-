import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo, startTransition } from "react";
import { Info, Heart, Mic, X, Trash2, Ban, Phone, Video, WifiOff, Wifi, Search, AlertCircle, Palette, MessageCircle, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { api, type ApiMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import CallScreen, { IncomingCallOverlay } from "@/components/CallScreen";
import { MessageItem } from "@/components/MessageItem";
import { MessageInput } from "@/components/MessageInput";
import { InfoPanel } from "@/components/InfoPanel";
import { Link } from "wouter";
import type { GreetingTemplate } from "@/lib/greeting-messages";
import { normalizeMessages, prepareOutgoingMessage, buildOptimisticMessage, buildSeenLabel, findLastSeenOutgoingId, messagePreview, replyPreviewLabel } from "@/lib/message-utils";
import { callStartedText, callEndedText, isCallLogMessage } from "@/lib/call-chat-log";
import { usePresenceLabel } from "@/hooks/usePresenceLabel";
import { groupByDay, shouldShowTimeGap } from "@/lib/message-helpers";
import { isEncryptionReady } from "@/lib/crypto";
import { isOnline } from "@/lib/offline";
import { requestNotificationPermission, subscribeToPush, sendSubscriptionToServer } from "@/lib/notifications";
import { isSupportedFileType, MAX_FILE_SIZE_MB } from "@/lib/supported-file-types";



function unsendErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return "Could not unsend. Try again.";
  const msg = err.message;
  if (/not found/i.test(msg)) return "This message is no longer on the server. Pull to refresh the chat.";
  if (/own messages|forbidden/i.test(msg)) return "You can only unsend messages you sent.";
  if (/unauthorized|session/i.test(msg)) return "Your session expired. Log in again, then try unsend.";
  if (/failed to delete/i.test(msg)) return "Server could not unsend right now. Try again in a moment.";
  if (/fetch|network|failed/i.test(msg)) return "Could not reach the server. Check your connection and try again.";
  return msg;
}
import { ChatInbox } from "@/components/ChatInbox";
import { AppThemeModal } from "@/components/AppThemeModal";
import { BubbleColorSelector } from "@/components/BubbleColorSelector";
import { CameraOverlay } from "@/components/CameraOverlay";
import { PendingMediaPreview } from "@/components/PendingMediaPreview";
import { MessageContextMenu } from "@/components/MessageContextMenu";
import { ReplyPreview } from "@/components/ReplyPreview";
import { EditMessageBar } from "@/components/EditMessageBar";
import { defaultAvatar } from "@/lib/avatars";
import { AvatarImage } from "@/components/AvatarImage";
import { saveMemoryFromMessage, removeMemory } from "@/lib/memories";
import { APP_THEME_CHANGED, getStoredAppTheme, isMoonlightSagaTheme, getPremiumChatThemeClass, isPremiumAnimatedTheme, type AppThemeId } from "@/lib/app-theme";
import { ChatAuroraLayer } from "@/components/ChatAuroraLayer";

import {
  filterVisibleMessages,
  hideMessageForUser,
  hydrateHiddenMessages,
  getChatClearedAt,
  clearChatForUser,
  applyHiddenMessageId,
  getHiddenMessageIds,
} from "@/lib/hidden-messages";
import { parsePresenceResponse, isPartnerActiveInChat } from "@/lib/presence-api";
import {
  commitRemoteMediaUrl,
  enforceUnsentMessages,
  findOptimisticMatch,
  mergeMessagesById,
  preserveDroppedMessages,
  reconcilePendingOptimistics,
  replaceOptimisticMessage,
  tombstoneMessage,
} from "@/lib/chat-sync";
import { mergeMessagesIfChanged, messagesListSignature } from "@/lib/message-list-perf";
import { downloadChatAsImage, downloadChatAsText } from "@/lib/chat-download";
import { openLiveChannel } from "@/lib/sse-client";
import { uploadMediaToB2, uploadMediaFile } from "@/lib/media-upload";
import {
  classifyMediaFile,
  detectMediaByMagicBytes,
  extractClipboardFiles,
  readClipboardFilesAsync,
  getVideoDurationSafe,
  guessVideoMime,
  isDocumentFile,
  isVideoFile,
  normalizeGalleryFile,
  normalizePastedFile,
  prepareImageForUpload,
  resolveGalleryPick,
} from "@/lib/media-file";
import {
  addNotification,
  unreadCount,
  NOTIFY_CHANGED,
  hydrateNotifications,
  clearUnreadChatBadge,
  getChatOpenedAt,
  notifyMessageReaction,
  notifyDoodleShared,
  notifyFileShared,
} from "@/lib/notifications-feed";
import { isReadReceiptsEnabled, isShowPresenceEnabled, areNotificationsEnabled, getCachedChatTheme } from "@/lib/couple-sync";
import { isChatBlocked, setChatBlocked } from "@/lib/client-memory";
import { hydrateQuickReactions } from "@/lib/quick-reactions";
import {
  scrollChatToBottom,
  scrollChatToBottomAfterPaint,
  scrollChatToBottomSoft,
  scrollChatForComposerChange,
  scrollMessageIntoCenter,
} from "@/lib/chat-scroll";
import { readChatCache, readChatCacheForCurrentUser, writeChatCache } from "@/lib/chat-cache";
import {
  captureScrollAnchor,
  clearChatScrollAnchor,
  readChatScrollAnchor,
  restoreScrollToAnchor,
  saveChatScrollAnchor,
  shouldRestoreScrollAnchor,
} from "@/lib/chat-scroll-anchor";
import { resolveChatImageUrl, resolveChatVideoUrl } from "@/lib/media-url";
import DoodleCanvas, { type DoodleData } from "@/components/DoodleCanvas";
import { ImageCropModal } from "@/components/ImageCropModal";
import { partnerTypingLine } from "@/lib/partner-words";
import { toast } from "sonner";

/** Always dismiss loading toasts before success/error so the spinner cannot stick. */
function finishToast(
  loadingId: string | number,
  result: { type: "success"; message: string } | { type: "error"; message: string } | { type: "none" },
) {
  toast.dismiss(loadingId);
  if (result.type === "success") toast.success(result.message, { duration: 2500 });
  else if (result.type === "error") toast.error(result.message, { duration: 4000 });
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 ml-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </span>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────


type CallState = { status: "outgoing" | "incoming" | "active"; type: "audio" | "video"; incomingOffer?: RTCSessionDescriptionInit } | null;

function initialChatMessages(): ApiMessage[] {
  return readChatCacheForCurrentUser();
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Messages() {
  const { user, partner, refreshCouplePrefs, updateChatTheme } = useAuth();
  const [messages, setMessages] = useState<ApiMessage[]>(initialChatMessages);
  const messagesSigRef = useRef(
    messages.length ? messagesListSignature(messages) : "0",
  );
  const [showInfo, setShowInfo] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [blocked, setBlocked] = useState(() => isChatBlocked());
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesStartRef = useRef<HTMLDivElement>(null);
  const [callState, setCallState] = useState<CallState>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [pendingMediaPreview, setPendingMediaPreview] = useState<{
    file: File;
    clipboardItemType?: string;
    kind: "image" | "video" | "other";
    normalized: File;
  } | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    type: "audio" | "video";
    offer?: RTCSessionDescriptionInit;
  } | null>(null);
  const [callSignal, setCallSignal] = useState<{ type: "answer" | "ice"; data: unknown; seq: number } | null>(null);
  const callSignalSeq = useRef(0);
  const callConnectedAtRef = useRef(0);
  const callLoggedStartRef = useRef(false);
  const activeCallTypeRef = useRef<"audio" | "video">("audio");
  const callRoleRef = useRef<"outgoing" | "incoming">("outgoing");
  const endCallRef = useRef<(opts?: { fromRemote?: boolean }) => void>(() => { });
  const [partnerName, setPartnerName] = useState(() => partner?.name ?? "");
  const [partnerAvatar, setPartnerAvatar] = useState(() => partner?.avatar ?? "");
  const [partnerLastSeen, setPartnerLastSeen] = useState<number | undefined>();
  const [online, setOnline] = useState(isOnline());

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    messageType: "all" as "all" | "text" | "image" | "sticker" | "audio" | "gif",
    sender: "all" as "all" | "me" | "partner",
    hasReaction: false,
    isPinned: false,
  });
  const [isTyping, setIsTyping] = useState(false);
  const [appThemeId, setAppThemeId] = useState<AppThemeId>(() => getStoredAppTheme());
  const [showAppThemes, setShowAppThemes] = useState(false);
  const [showBubbleColors, setShowBubbleColors] = useState(false);
  const [replyTo, setReplyTo] = useState<ApiMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ApiMessage | null>(null);
  const [editText, setEditText] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [doodleOpen, setDoodleOpen] = useState(false);
  const [pendingImageType, setPendingImageType] = useState("image/jpeg");
  const [mediaViewMode, setMediaViewMode] = useState<"keep" | "once" | "twice">("keep");
  const [mediaViewer, setMediaViewer] = useState<{
    messageId: string;
    url: string;
    kind: "image" | "video";
    timed: boolean;
    useVideoDuration: boolean;
    secondsLeft: number;
  } | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [showThreadPanel, setShowThreadPanel] = useState(false);
  const [hiddenTick, setHiddenTick] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ msg: ApiMessage; top: number; left: number } | null>(null);

  const [notifCount, setNotifCount] = useState(() => unreadCount());
  const [unreadChat, setUnreadChat] = useState(0);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const isNearBottomRef = useRef(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingPingRef = useRef(0);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sseRetryCountRef = useRef(0);
  const sseRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRequestsRef = useRef<Map<string, Promise<any>>>(new Map());
  const previousMessagesLengthRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  const initialLoadTimeRef = useRef(Date.now());
  const stickToBottomRef = useRef(false);
  const lastMessageTailRef = useRef("");
  const hasMessagesRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxSseRetries = 10; // Maximum number of SSE reconnection attempts
  const filePickInFlightRef = useRef(false);
  /** Optimistic message ids still uploading — must survive loadMessages() refresh */
  const pendingOutgoingRef = useRef<Set<string>>(new Set());
  const cropSendInFlightRef = useRef(false);
  const shouldSendVoiceRef = useRef(false);
  const voiceSendInFlightRef = useRef(false);
  const sendMsgRef = useRef<(partial: Partial<ApiMessage>) => Promise<void>>(async () => { });
  const userIdRef = useRef<string | undefined>(undefined);
  const prependScrollHeightRef = useRef<number | null>(null);
  const isPrependingRef = useRef(false);
  const unsentIdsRef = useRef<Set<string>>(new Set());
  const recentTailIdsRef = useRef<Set<string>>(new Set());
  const scrollAnchorSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingScrollRestoreRef = useRef<ReturnType<typeof readChatScrollAnchor>>(null);
  const scrollRestoreAttemptsRef = useRef(0);
  const anchorResolveStartedRef = useRef(false);
  const mediaScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollPreserveRef = useRef<{ top: number; height: number } | null>(null);
  /** Tracks whether we already scrolled to the first unread message on initial load */
  const initialUnreadHandledRef = useRef(false);

  const partnerId = useMemo(() => user?.id === "me" ? "wife" : "me", [user?.id]);

  const presence = usePresenceLabel(partnerLastSeen);
  const partnerActive = isPartnerActiveInChat(partnerLastSeen);
  const showPartnerTyping = isTyping;

  const requestStickToBottom = useCallback(() => {
    if (isPrependingRef.current || pendingScrollRestoreRef.current) return;
    stickToBottomRef.current = true;
    isNearBottomRef.current = true;
    setIsNearBottom(true);
    scrollChatToBottomSoft(messagesContainerRef.current, bottomRef.current);
  }, []);

  const scrollToBottomForMedia = useCallback((messageId?: string) => {
    const isInitialWindow = Date.now() - initialLoadTimeRef.current < 2500;
    if (messageId && !recentTailIdsRef.current.has(messageId) && !isInitialWindow) return;
    if (!isNearBottomRef.current && !stickToBottomRef.current && !isInitialWindow) return;
    if (mediaScrollTimerRef.current) clearTimeout(mediaScrollTimerRef.current);
    mediaScrollTimerRef.current = setTimeout(() => {
      if (!isNearBottomRef.current && !stickToBottomRef.current && !isInitialWindow) return;
      scrollChatToBottomSoft(messagesContainerRef.current, bottomRef.current);
    }, 150);
  }, []);

  const handleMediaCommitted = useCallback(
    (
      messageId: string,
      field: "imageUrl" | "imageData" | "fileData",
      remoteUrl: string,
    ) => {
      setMessages((prev) => commitRemoteMediaUrl(prev, messageId, field, remoteUrl));
    },
    [],
  );

  const highlightHandledRef = useRef<string | null>(null);

  const scrollToHighlightedMessage = useCallback(async (messageId: string): Promise<boolean> => {
    isNearBottomRef.current = false;
    stickToBottomRef.current = false;
    setIsNearBottom(false);

    const flash = (el: Element) => {
      el.classList.add("message-highlight-flash");
      window.setTimeout(() => el.classList.remove("message-highlight-flash"), 2600);
    };

    const tryScroll = (): boolean => {
      const el = document.querySelector(
        `[data-testid="message-${messageId}"]`,
      ) as HTMLElement | null;
      if (!el) return false;
      const container = messagesContainerRef.current;
      scrollMessageIntoCenter(container, el, "auto");
      requestAnimationFrame(() => {
        scrollMessageIntoCenter(container, el, "auto");
        flash(el);
      });
      return true;
    };

    if (tryScroll()) return true;

    try {
      const data = await api.getMessageContext(messageId, 35);
      const batch = await normalizeMessages(data.messages || []);
      if (batch.length === 0) return false;

      prependScrollHeightRef.current = null;
      isPrependingRef.current = false;

      setMessages((prev) => mergeMessagesById(prev, batch));
      setHasMore(data.pagination?.hasMoreBefore ?? hasMore);

      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      return tryScroll();
    } catch {
      return false;
    }
  }, [hasMore]);

  const jumpToMessage = useCallback(
    (messageId: string) => {
      void scrollToHighlightedMessage(messageId);
    },
    [scrollToHighlightedMessage],
  );

  const openDoodlePanel = useCallback(() => setDoodleOpen(true), []);
  const closeDoodlePanel = useCallback(() => setDoodleOpen(false), []);

  const handleDoodleSend = useCallback((data: DoodleData) => {
    closeDoodlePanel();
    if (!user) return;
    const tempId = crypto.randomUUID();

    // Calculate absolute scroll position
    const container = messagesContainerRef.current;
    let absoluteX = data.canvasX;
    let absoluteY = data.canvasY;

    if (container) {
      const rect = container.getBoundingClientRect();
      const style = window.getComputedStyle(container);
      const paddingLeft = parseFloat(style.paddingLeft) || 0;
      const paddingTop = parseFloat(style.paddingTop) || 0;
      const borderLeft = parseFloat(style.borderLeftWidth) || 0;
      const borderTop = parseFloat(style.borderTopWidth) || 0;

      absoluteX = data.canvasX - rect.left - paddingLeft - borderLeft;
      absoluteY = data.canvasY - rect.top - paddingTop - borderTop + container.scrollTop;
    }

    // Encode position metadata into the text field as JSON
    const posText = JSON.stringify({ canvasX: absoluteX, canvasY: absoluteY, width: data.width, height: data.height });

    pendingOutgoingRef.current.add(tempId);
    setMessages((prev) => [
      ...prev,
      buildOptimisticMessage(
        { senderId: user.id, type: "doodle", imageData: data.imageData, text: posText },
        tempId,
      ),
    ]);
    requestStickToBottom();

    const attemptUpload = async (attempt = 0): Promise<string> => {
      try {
        return await uploadMediaToB2(data.imageData, "image/png");
      } catch (err) {
        const raw = err instanceof Error ? err.message : "";
        const isRetryable = /timed out|502|503|504/i.test(raw);
        if (isRetryable && attempt < 2) {
          await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
          return attemptUpload(attempt + 1);
        }
        throw err;
      }
    };

    void (async () => {
      try {
        const url = await attemptUpload();
        const outgoing = await prepareOutgoingMessage({
          senderId: user.id,
          type: "doodle",
          imageUrl: url,
          text: posText,
        });
        const saved = await api.sendMessage(outgoing);
        const [display] = await normalizeMessages([saved]);
        setMessages((prev) => {
          const next = replaceOptimisticMessage(prev, tempId, display, user.id);
          pendingOutgoingRef.current.delete(tempId);
          messagesSigRef.current = messagesListSignature(next);
          writeChatCache(user.id, next);
          return next;
        });
        // Notify partner that we shared a doodle
        const partnerDisplayName = partner?.name || partnerName || (partnerId === "wife" ? "Sara" : "Mustaq");
        notifyDoodleShared(partnerDisplayName);
        requestStickToBottom();
      } catch (err) {
        pendingOutgoingRef.current.delete(tempId);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        const raw = err instanceof Error ? err.message : "";
        toast.error(raw || "Doodle upload failed. Please try again.", { duration: 5000 });
      }
    })();
  }, [closeDoodlePanel, user, requestStickToBottom, partner, partnerName, partnerId]);

  // Define partner info early to avoid hoisting issues
  const pAvatar = partner?.avatar || partnerAvatar || defaultAvatar(partnerId);
  const pName = partner?.name || partnerName || (partnerId === "wife" ? "Sara" : "Mustaq");
  const lastMsg = useMemo(
    () => messages.filter((m) => !m.deleted).slice(-1)[0],
    [messages],
  );
  const lastPreview = useMemo(
    () => (lastMsg ? messagePreview(lastMsg) : undefined),
    [lastMsg],
  );

  useEffect(() => {
    const refresh = () => setNotifCount(unreadCount());
    window.addEventListener(NOTIFY_CHANGED, refresh);
    return () => window.removeEventListener(NOTIFY_CHANGED, refresh);
  }, []);

  useEffect(() => {
    if (partner) {
      setPartnerName(partner.name);
      setPartnerAvatar(partner.avatar);
    }
  }, [partner?.name, partner?.avatar]);

  useEffect(() => {
    if (!user) return;
    const refreshPresence = () => {
      api.getPresence().then((raw) => {
        const { lastSeen, typing } = parsePresenceResponse(raw);
        if (lastSeen[partnerId] != null) setPartnerLastSeen(lastSeen[partnerId]);
        setIsTyping(Boolean(typing[partnerId]));
      }).catch(() => { });
    };
    api.heartbeat(user.id).catch(() => { });
    refreshPresence();
    const hb = setInterval(() => {
      if (isShowPresenceEnabled()) api.heartbeat(user.id).catch(() => { });
    }, 10_000);
    const poll = setInterval(() => {
      if (document.visibilityState === "visible") refreshPresence();
    }, 10_000);
    return () => { clearInterval(hb); clearInterval(poll); };
  }, [user?.id, partnerId]);

  const applyMessageBatch = useCallback((raw: ApiMessage[]) => {
    if (raw.length === 0) return;
    const container = messagesContainerRef.current;
    const readingHistory = !isNearBottomRef.current && !stickToBottomRef.current && !pendingScrollRestoreRef.current;
    if (readingHistory && container) {
      scrollPreserveRef.current = {
        top: container.scrollTop,
        height: container.scrollHeight,
      };
    }
    void normalizeMessages(raw).then((fromServer) => {
      setMessages((prev) => {
        const merged = reconcilePendingOptimistics(prev, fromServer, pendingOutgoingRef.current);
        const guarded = enforceUnsentMessages(merged, unsentIdsRef.current);
        const next = preserveDroppedMessages(prev, guarded);
        messagesSigRef.current = messagesListSignature(next);
        if (user?.id) writeChatCache(user.id, next);
        return next;
      });
      if ((isNearBottomRef.current || isInitialLoadRef.current) && !pendingScrollRestoreRef.current && !initialUnreadHandledRef.current) {
        stickToBottomRef.current = true;
      } else if (readingHistory) {
        stickToBottomRef.current = false;
      }
    });
  }, [user?.id]);

  // Load messages function (can be called from retry button)
  const loadMessages = useCallback(async () => {
    const requestId = "load-messages";

    if (pendingRequestsRef.current.has(requestId)) {
      return pendingRequestsRef.current.get(requestId);
    }

    const hadMessages = messagesSigRef.current !== "0";
    setError(null);

    const uid = user?.id;
    if (uid) {
      void hydrateHiddenMessages(uid).then(() => setHiddenTick((t) => t + 1));
    }

    const requestPromise = api.getMessages({ limit: 80 })
      .then((data) => {
        const raw = data.messages || [];
        if (raw.length > 0) {
          applyMessageBatch(raw);
          const more = data.pagination?.hasMore ?? false;
          setHasMore(more);
        } else if (!hadMessages) {
          setMessages((prev) => {
            const pending = prev.filter((m) => pendingOutgoingRef.current.has(m.id));
            messagesSigRef.current = pending.length ? messagesListSignature(pending) : "0";
            return pending;
          });
          setHasMore(false);
        }
        return data;
      })
      .catch((err) => {
        console.error("Failed to load messages:", err);
        if (!hadMessages && messagesSigRef.current === "0") {
          const msg =
            err instanceof Error && /timed out/i.test(err.message)
              ? "Loading messages timed out. Tap Try Again."
              : "Failed to load messages. Please check your connection.";
          setError(msg);
          setMessages([]);
        }
      })
      .finally(() => {
        pendingRequestsRef.current.delete(requestId);
      });

    pendingRequestsRef.current.set(requestId, requestPromise);
    return requestPromise;
  }, [user?.id, applyMessageBatch]);

  // Load more messages when scrolling to top with pagination
  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;

    const offset = messages.length;

    const container = messagesContainerRef.current;
    // Store current scroll height before adding messages
    const scrollHeightBefore = container?.scrollHeight ?? 0;

    stickToBottomRef.current = false;
    isNearBottomRef.current = false;
    isPrependingRef.current = true;

    setLoadingMore(true);
    try {
      const data = await api.getMessages({ offset });
      const older = await normalizeMessages(data.messages || []);
      if (older.length === 0) {
        setHasMore(false);
        isPrependingRef.current = false;
        prependScrollHeightRef.current = null;
        return;
      }

      prependScrollHeightRef.current = scrollHeightBefore;

      setMessages((prev) => {
        const existing = new Set(prev.map((m) => m.id));
        const unique = older.filter((m) => !existing.has(m.id));
        if (unique.length === 0) return prev;
        return [...unique, ...prev];
      });
      const more = data.pagination?.hasMore ?? false;
      setHasMore(more && older.length > 0);
    } catch (err) {
      console.error("Failed to load more messages:", err);
      // Don't set error state for load more failures, just log it
    } finally {
      setLoadingMore(false);
      if (prependScrollHeightRef.current === null) {
        isPrependingRef.current = false;
      }
    }
  }, [loadingMore, hasMore, messages.length]);

  // Intersection Observer for loading more messages on scroll to top
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !loadingMore &&
          !isPrependingRef.current &&
          hasMore &&
          messages.length > 0
        ) {
          loadMoreMessages();
        }
      },
      { rootMargin: '320px', threshold: 0.05 }
    );

    if (messagesStartRef.current) {
      observer.observe(messagesStartRef.current);
    }

    return () => observer.disconnect();
  }, [loadingMore, hasMore, loadMoreMessages, messages.length]);

  // SSE real-time connection with automatic reconnection
  useEffect(() => {
    if (!user) return;

    let mounted = true;
    let es: EventSource | null = null;
    let typingTimeout: ReturnType<typeof setTimeout> | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let livePollStop: (() => void) | null = null;
    let presencePollId: number | null = null;

    const syncPresenceFromServer = () => {
      if (!mounted) return;
      void api.getPresence().then((raw) => {
        const { lastSeen, typing } = parsePresenceResponse(raw);
        if (lastSeen[partnerId] != null) setPartnerLastSeen(lastSeen[partnerId]);
        const partnerTyping = Boolean(typing[partnerId]);
        setIsTyping(partnerTyping);
        if (partnerTyping) {
          if (typingTimeout) clearTimeout(typingTimeout);
          typingTimeout = setTimeout(() => setIsTyping(false), 4000);
        }
      }).catch(() => { });
    };

    void hydrateQuickReactions();
    const cached = messages.length === 0 ? readChatCache(user.id) : messages;
    const tailIds = (cached ?? []).slice(-12).map((m) => m.id);
    const savedAnchor = readChatScrollAnchor(user.id);
    const restoreAnchor = shouldRestoreScrollAnchor(savedAnchor, tailIds);

    if (restoreAnchor && savedAnchor) {
      pendingScrollRestoreRef.current = savedAnchor;
    } else {
      pendingScrollRestoreRef.current = null;
      scrollRestoreAttemptsRef.current = 0;
      anchorResolveStartedRef.current = false;
      clearChatScrollAnchor(user.id);
      isNearBottomRef.current = true;
      stickToBottomRef.current = true;
    }

    if (messages.length === 0 && cached && cached.length > 0) {
      isInitialLoadRef.current = true;
      setMessages(cached);
      messagesSigRef.current = messagesListSignature(cached);
    } else if (!restoreAnchor && isNearBottomRef.current) {
      stickToBottomRef.current = true;
    }
    loadMessages();

    const pollSyncMessages = () => {
      if (!mounted) return;
      const container = messagesContainerRef.current;
      const readingHistory = !isNearBottomRef.current && !stickToBottomRef.current;
      if (readingHistory && container) {
        scrollPreserveRef.current = {
          top: container.scrollTop,
          height: container.scrollHeight,
        };
      }
      void api.getMessages().then(async (data) => {
        const raw = data.messages ?? [];
        if (raw.length === 0) return;
        const fresh = await normalizeMessages(raw);
        if (!mounted) return;
        setMessages((prev) => {
          const merged = reconcilePendingOptimistics(prev, fresh, pendingOutgoingRef.current);
          const guarded = enforceUnsentMessages(merged, unsentIdsRef.current);
          const preserved = preserveDroppedMessages(prev, guarded);
          const next = mergeMessagesIfChanged(prev, preserved, (_, m) => m);
          if (!next) {
            scrollPreserveRef.current = null;
            return prev;
          }
          messagesSigRef.current = messagesListSignature(next);
          if (user?.id) writeChatCache(user.id, next);
          return next;
        });
        setHasMore(fresh.length > 0 && (data.pagination?.hasMore ?? false));
      }).catch(() => {
        scrollPreserveRef.current = null;
      });
    };

    // SSE (local) or polling (Vercel serverless)
    async function connectSSE() {
      if (!mounted || !user) return;

      const channel = await openLiveChannel(user.id, pollSyncMessages);
      if (!mounted) {
        if (channel?.mode === "poll") channel.stop();
        return;
      }
      if (!channel) return;

      if (channel.mode === "poll") {
        livePollStop = channel.stop;
        presencePollId = window.setInterval(syncPresenceFromServer, 1_000);
        void syncPresenceFromServer();
        return;
      }

      es = channel.eventSource;

      es.addEventListener("connected", () => {
        sseRetryCountRef.current = 0;
      });

      const handleNewMessage = async (e: MessageEvent) => {
        if (!mounted) return;
        try {
          const raw = JSON.parse(e.data) as ApiMessage;
          const [msg] = await normalizeMessages([raw]);
          if (!mounted) return;

          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) {
              return prev.map((m) => (m.id === msg.id ? { ...m, ...msg, text: msg.text ?? m.text } : m));
            }
            if (msg.senderId === user?.id) {
              const optimisticIdx = prev.findIndex(
                (m) =>
                  pendingOutgoingRef.current.has(m.id) &&
                  findOptimisticMatch(m, [msg], { allowBlobMatch: true }) !== undefined,
              );
              if (optimisticIdx >= 0) {
                pendingOutgoingRef.current.delete(prev[optimisticIdx]!.id);
                const next = [...prev];
                next[optimisticIdx] = msg;
                return next;
              }
            }
            return [...prev, msg];
          });

          if (msg.senderId === partnerId && !isNearBottomRef.current) {
            setHasNewMessages(true);
          } else {
            stickToBottomRef.current = true;
            requestStickToBottom();
          }
        } catch (err) {
          console.error("Failed to handle new message:", err);
        }
      };

      const handleMessageLiked = async (e: MessageEvent) => {
        if (!mounted) return;
        try {
          const raw = JSON.parse(e.data) as ApiMessage;
          const likedBy = (raw as ApiMessage & { likedBy?: string }).likedBy;
          const [msg] = await normalizeMessages([raw]);
          setMessages((prev) => {
            const found = prev.find(m => m.id === msg.id);
            if (!found) return prev;
            return prev.map((m) =>
              m.id === msg.id
                ? {
                  ...m,
                  ...msg,
                  deleted: m.deleted || msg.deleted,
                  text: m.deleted ? undefined : (msg.text ?? m.text),
                  reaction: m.reaction ?? msg.reaction,
                  imageUrl: m.deleted ? undefined : (msg.imageUrl ?? m.imageUrl),
                  imageData: m.deleted ? undefined : (msg.imageData ?? m.imageData),
                }
                : m,
            );
          });
        } catch (err) {
          console.error("Failed to handle message liked:", err);
        }
      };

      /** Unsend only — global delete for both partners. Not used for "delete for me". */
      const handleMessageDeleted = (e: MessageEvent) => {
        if (!mounted) return;
        try {
          const msg = JSON.parse(e.data) as ApiMessage;
          setMessages(prev => {
            const found = prev.find(m => m.id === msg.id);
            if (!found) return prev;
            return prev.map(m => m.id === msg.id ? {
              ...m,
              ...msg,
              deleted: true,
              text: undefined,
              audioData: undefined,
              gifUrl: undefined,
              imageData: undefined,
              imageUrl: undefined,
              fileData: undefined,
            } : m);
          });
        } catch (err) {
          console.error("Failed to handle message deleted:", err);
        }
      };

      const handleMessageHidden = (e: MessageEvent) => {
        if (!mounted || !user) return;
        try {
          const d = JSON.parse(e.data) as { userId: string; messageId: string };
          if (d.userId !== user.id) return;
          applyHiddenMessageId(user.id, d.messageId);
          setHiddenTick((t) => t + 1);
        } catch (err) {
          console.error("Failed to handle message hidden:", err);
        }
      };

      const handleMessageEdited = async (e: MessageEvent) => {
        if (!mounted) return;
        try {
          const raw = JSON.parse(e.data) as ApiMessage;
          const [msg] = await normalizeMessages([raw]);
          setMessages((prev) => {
            const found = prev.find(m => m.id === msg.id);
            if (!found) return prev;
            return prev.map((m) => (m.id === msg.id ? { ...m, text: msg.text } : m));
          });
        } catch (err) {
          console.error("Failed to handle message edited:", err);
        }
      };

      const handleMessageReaction = (e: MessageEvent) => {
        if (!mounted || !user) return;
        try {
          const d = JSON.parse(e.data) as {
            messageId: string;
            reactions: { emoji: string; userId: string }[];
            byUserId?: string;
          };
          const list = Array.isArray(d.reactions) ? d.reactions : [];
          const myReaction = list.find((r) => r.userId === user.id)?.emoji;
          const partnerReaction = list.find((r) => r.userId === partnerId)?.emoji;
          
          // Notify when partner reacts
          if (d.byUserId === partnerId && partnerReaction && !myReaction) {
            notifyMessageReaction(pName, partnerReaction);
          }
          
          setMessages((prev) => {
            const found = prev.find(m => m.id === d.messageId);
            if (!found) return prev;
            return prev.map((m) => {
              if (m.id !== d.messageId) return m;
              const displayReaction =
                m.senderId === user.id
                  ? (partnerReaction ?? myReaction)
                  : (myReaction ?? partnerReaction);
              return { ...m, reaction: displayReaction };
            });
          });
        } catch (err) {
          console.error("Failed to handle message reaction:", err);
        }
      };

      const handlePresence = (e: MessageEvent) => {
        if (!mounted) return;
        try {
          const d = JSON.parse(e.data) as { userId: string; lastSeen: number };
          if (d.userId === partnerId) setPartnerLastSeen(d.lastSeen);
        } catch (err) {
          console.error("Failed to handle presence:", err);
        }
      };

      const handleMessagesCleared = () => {
        if (!mounted) return;
        setMessages((prev) => prev.filter((m) => pendingOutgoingRef.current.has(m.id)));
      };

      const pushCallSignal = (type: "answer" | "ice", data: unknown) => {
        callSignalSeq.current += 1;
        setCallSignal({ type, data, seq: callSignalSeq.current });
      };

      const handleCallOffer = (e: MessageEvent) => {
        if (!mounted || !user) return;
        try {
          const d = JSON.parse(e.data) as {
            from: string;
            callType: "audio" | "video";
            sdp?: RTCSessionDescriptionInit;
          };
          if (d.from !== partnerId || !d.sdp) return;
          setIncomingCall({ type: d.callType, offer: d.sdp });
          if (Notification.permission === "granted") {
            new Notification(`${partnerName} is calling`, {
              body: d.callType === "video" ? "Video call" : "Audio call",
              icon: pAvatar,
            });
          }
        } catch (err) {
          console.error("Failed to handle call offer:", err);
        }
      };

      const handleCallRing = (e: MessageEvent) => {
        if (!mounted || !user) return;
        try {
          const d = JSON.parse(e.data) as { from: string; callType: "audio" | "video" };
          if (d.from !== partnerId) return;
          setIncomingCall((prev) => prev ?? { type: d.callType });
        } catch (err) {
          console.error("Failed to handle call ring:", err);
        }
      };

      const handleCallAnswer = (e: MessageEvent) => {
        if (!mounted || !user) return;
        try {
          const d = JSON.parse(e.data) as { from: string; sdp: RTCSessionDescriptionInit };
          if (d.from !== partnerId || !d.sdp) return;
          pushCallSignal("answer", d.sdp);
        } catch (err) {
          console.error("Failed to handle call answer:", err);
        }
      };

      const handleCallIce = (e: MessageEvent) => {
        if (!mounted || !user) return;
        try {
          const d = JSON.parse(e.data) as { from: string; candidate: RTCIceCandidateInit };
          if (d.from !== partnerId || !d.candidate) return;
          pushCallSignal("ice", d.candidate);
        } catch (err) {
          console.error("Failed to handle call ICE:", err);
        }
      };

      const handleCallEnd = () => {
        if (mounted) endCallRef.current({ fromRemote: true });
      };
      const handleCallReject = () => {
        if (mounted) endCallRef.current({ fromRemote: true });
      };

      const handleProfileUpdated = (e: MessageEvent) => {
        if (!mounted) return;
        try {
          const d = JSON.parse(e.data);
          if (d.userId === partnerId) { setPartnerName(d.name); setPartnerAvatar(d.avatar); }
        } catch (err) {
          console.error("Failed to handle profile updated:", err);
        }
      };

      const handleTypingIndicator = (e: MessageEvent) => {
        if (!mounted) return;
        try {
          const d = JSON.parse(e.data);
          if (d.userId === partnerId) {
            setIsTyping(d.typing);
            if (d.typing) {
              if (typingTimeout) clearTimeout(typingTimeout);
              typingTimeout = setTimeout(() => setIsTyping(false), 5000);
            }
          }
        } catch (err) {
          console.error("Failed to handle typing indicator:", err);
        }
      };

      const handleMessageRead = (e: MessageEvent) => {
        if (!mounted || !user) return;
        try {
          const d = JSON.parse(e.data) as { messageId: string; userId: string; readAt: string };
          setMessages(prev => {
            const readMsg = prev.find((m) => m.id === d.messageId);
            if (!readMsg) return prev;
            const readTs = new Date(readMsg.timestamp).getTime();
            return prev.map((m) => {
              if (d.userId === partnerId && m.senderId === user.id && !m.deleted) {
                const ts = new Date(m.timestamp).getTime();
                if (m.id === d.messageId || (readTs > 0 && ts <= readTs)) {
                  return { ...m, seenByPartner: true, readAt: m.readAt ?? d.readAt };
                }
              }
              if (d.userId === user.id && m.senderId === partnerId && m.id === d.messageId) {
                return { ...m, read: true, readAt: d.readAt };
              }
              return m;
            });
          });
        } catch (err) {
          console.error("Failed to handle message read:", err);
        }
      };

      const handleMessageMediaOpened = (e: MessageEvent) => {
        if (!mounted || !user) return;
        try {
          const d = JSON.parse(e.data) as { messageId: string; userId: string; mediaOpenCount: number; mediaOpenedAt: string };
          setMessages((prev) =>
            prev.map((m) =>
              m.id === d.messageId
                ? {
                  ...m,
                  mediaOpenedAt: d.userId === partnerId ? d.mediaOpenedAt : m.mediaOpenedAt,
                  mediaOpenCount: d.userId === user.id ? d.mediaOpenCount : m.mediaOpenCount,
                }
                : m,
            ),
          );
        } catch (err) {
          console.error("Failed to handle media open:", err);
        }
      };

      const handleDuaAdded = () => { hydrateNotifications(); };
      const handleDuaDeleted = () => { api.getDuas().catch(() => { }); };
      const handlePrefsUpdated = () => { refreshCouplePrefs(); };

      es.addEventListener("new-message", handleNewMessage);
      es.addEventListener("message-liked", handleMessageLiked);
      es.addEventListener("message-deleted", handleMessageDeleted);
      es.addEventListener("message-hidden", handleMessageHidden);
      es.addEventListener("message-edited", handleMessageEdited);
      es.addEventListener("message-reaction", handleMessageReaction);
      es.addEventListener("presence", handlePresence);
      es.addEventListener("messages-cleared", handleMessagesCleared);
      es.addEventListener("call-offer", handleCallOffer);
      es.addEventListener("call-ring", handleCallRing);
      es.addEventListener("call-answer", handleCallAnswer);
      es.addEventListener("call-ice", handleCallIce);
      es.addEventListener("call-end", handleCallEnd);
      es.addEventListener("call-reject", handleCallReject);
      es.addEventListener("profile-updated", handleProfileUpdated);
      es.addEventListener("typing-indicator", handleTypingIndicator);
      es.addEventListener("message-read", handleMessageRead);
      es.addEventListener("message-media-opened", handleMessageMediaOpened);
      es.addEventListener("dua-added", handleDuaAdded);
      es.addEventListener("dua-deleted", handleDuaDeleted);
      es.addEventListener("prefs-updated", handlePrefsUpdated);

      // SSE error handler with exponential backoff reconnection
      es.onerror = () => {
        console.warn("SSE connection error, will retry...");
        if (es) {
          es.close();
          es = null;
        }

        if (!mounted) return;

        // Check if we've exceeded max retries
        const retryCount = sseRetryCountRef.current;
        if (retryCount >= maxSseRetries) {
          console.warn("SSE max retries exceeded, falling back to polling");
          void openLiveChannel(user!.id, pollSyncMessages, { forcePoll: true }).then((channel) => {
            if (!mounted || !channel || channel.mode !== "poll") return;
            livePollStop = channel.stop;
            presencePollId = window.setInterval(syncPresenceFromServer, 1_000);
            void syncPresenceFromServer();
          });
          return;
        }

        // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        sseRetryCountRef.current = retryCount + 1;

        console.log(`SSE reconnecting in ${delay}ms (attempt ${retryCount + 1})`);
        reconnectTimeout = setTimeout(() => {
          if (mounted) connectSSE();
        }, delay);
      };
    }

    void connectSSE();

    return () => {
      mounted = false;
      if (typingTimeout) clearTimeout(typingTimeout);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (presencePollId) window.clearInterval(presencePollId);
      if (livePollStop) livePollStop();
      if (sseRetryTimeoutRef.current) clearTimeout(sseRetryTimeoutRef.current);
      if (es) {
        es.onerror = null;
        es.close();
        es = null;
      }
    };
  }, [user?.id, partnerId, loadMessages, refreshCouplePrefs]);

  // Keep chat in sync across tabs/devices (SSE can miss events while backgrounded)
  useEffect(() => {
    if (!user) return;

    const syncFromServer = () => {
      const container = messagesContainerRef.current;
      const readingHistory = !isNearBottomRef.current && !stickToBottomRef.current;
      if (readingHistory && container) {
        scrollPreserveRef.current = {
          top: container.scrollTop,
          height: container.scrollHeight,
        };
      }
      void api.getMessages().then(async (data) => {
        const fresh = await normalizeMessages(data.messages ?? []);
        setMessages((prev) => {
          const merged = reconcilePendingOptimistics(prev, fresh, pendingOutgoingRef.current);
          const guarded = enforceUnsentMessages(merged, unsentIdsRef.current);
          const preserved = preserveDroppedMessages(prev, guarded);
          const next = mergeMessagesIfChanged(prev, preserved, (_, m) => m);
          if (!next) {
            scrollPreserveRef.current = null;
            return prev;
          }
          messagesSigRef.current = messagesListSignature(next);
          if (user?.id) writeChatCache(user.id, next);
          return next;
        });
        setHasMore(fresh.length > 0 && (data.pagination?.hasMore ?? false));
      }).catch(() => {
        scrollPreserveRef.current = null;
      });
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") syncFromServer();
    };

    document.addEventListener("visibilitychange", onVisible);
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") syncFromServer();
    }, import.meta.env.PROD ? 15_000 : 180_000);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, [user?.id]);

  useEffect(() => {
    const onTheme = () => setAppThemeId(getStoredAppTheme());
    window.addEventListener(APP_THEME_CHANGED, onTheme);
    return () => window.removeEventListener(APP_THEME_CHANGED, onTheme);
  }, []);

  useEffect(() => {
    recentTailIdsRef.current = new Set(messages.slice(-6).map((m) => m.id));
  }, [messages]);

  // If refresh saved a scroll anchor to an older message, load that window first.
  useEffect(() => {
    if (!user) return;
    const anchor = pendingScrollRestoreRef.current;
    if (!anchor || anchor.messageId === "__ratio__") return;
    pendingScrollRestoreRef.current = anchor;
    if (messages.some((m) => m.id === anchor.messageId)) return;
    if (anchorResolveStartedRef.current) return;
    anchorResolveStartedRef.current = true;

    let cancelled = false;
    void (async () => {
      try {
        const data = await api.getMessageContext(anchor.messageId, 50);
        const batch = await normalizeMessages(data.messages ?? []);
        if (cancelled || batch.length === 0) return;
        setMessages((prev) => mergeMessagesById(prev, batch));
        setHasMore(Boolean(data.pagination?.hasMoreBefore));
        scrollRestoreAttemptsRef.current = 0;
      } catch {
        /* ratio fallback in restoreScrollToAnchor */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, messages.length]);

  // Stick to bottom: first load, own messages, decrypt height changes, reply bar, explicit requests
  useLayoutEffect(() => {
    if (messages.length === 0 || isPrependingRef.current) return;

    const last = messages[messages.length - 1];
    const tailSig = last
      ? `${last.id}:${last.text?.length ?? 0}:${last.type}:${last.replyToText?.length ?? 0}`
      : "";
    const tailChanged = tailSig !== lastMessageTailRef.current;
    lastMessageTailRef.current = tailSig;

    const firstPaint = isInitialLoadRef.current;
    const isOwnLast = last?.senderId === user?.id;

    if (firstPaint && !pendingScrollRestoreRef.current && !initialUnreadHandledRef.current) {
      const container = messagesContainerRef.current;
      if (container) {
        // Detect unread partner messages since user last opened chat
        const chatOpenedAt = getChatOpenedAt();
        const unreadPartnerMsgs = chatOpenedAt
          ? messages.filter(
              (m) =>
                m.senderId === partnerId &&
                new Date(m.timestamp).getTime() > new Date(chatOpenedAt).getTime(),
            )
          : [];

        if (unreadPartnerMsgs.length >= 2) {
          // Scroll to the first unread message and show "New messages" toggle
          initialUnreadHandledRef.current = true;
          const firstUnreadId = unreadPartnerMsgs[0]!.id;
          const el = container.querySelector(`[data-testid="message-${firstUnreadId}"]`) as HTMLElement | null;
          const row = el?.closest(".chat-message-row") as HTMLElement | null;
          if (row) {
            scrollMessageIntoCenter(container, row, "auto");
            isNearBottomRef.current = false;
            stickToBottomRef.current = false;
            setIsNearBottom(false);
            setHasNewMessages(true);
          } else {
            // Fallback: scroll to bottom
            scrollChatToBottom(container, bottomRef.current);
          }
        } else {
          scrollChatToBottom(container, bottomRef.current);
        }
      }
    }

    const restoreAnchor = pendingScrollRestoreRef.current;
    if (restoreAnchor && messages.length > 0 && scrollRestoreAttemptsRef.current < 24) {
      const container = messagesContainerRef.current;
      const restored = restoreScrollToAnchor(container, restoreAnchor);
      scrollRestoreAttemptsRef.current += 1;
      if (restored) {
        pendingScrollRestoreRef.current = null;
        isNearBottomRef.current = false;
        stickToBottomRef.current = false;
        isInitialLoadRef.current = false;
        return;
      }
    }

    const preserve = scrollPreserveRef.current;
    if (preserve && !isNearBottomRef.current && !stickToBottomRef.current) {
      const container = messagesContainerRef.current;
      if (container) {
        const diff = container.scrollHeight - preserve.height;
        if (diff !== 0) container.scrollTop = preserve.top + diff;
      }
      scrollPreserveRef.current = null;
    }

    const shouldStick =
      !isPrependingRef.current &&
      !pendingScrollRestoreRef.current &&
      !initialUnreadHandledRef.current &&
      (stickToBottomRef.current ||
        (firstPaint && !restoreAnchor) ||
        (isOwnLast && tailChanged && isNearBottomRef.current) ||
        (isNearBottomRef.current && tailChanged));

    if (shouldStick) {
      scrollChatToBottomAfterPaint(
        messagesContainerRef.current,
        bottomRef.current,
        false,
      );
      setHasNewMessages(false);
      stickToBottomRef.current = false;
    } else if (
      !firstPaint &&
      tailChanged &&
      last?.senderId === partnerId &&
      messages.length > previousMessagesLengthRef.current
    ) {
      setHasNewMessages(true);
    }

    if (firstPaint) {
      isInitialLoadRef.current = false;
      initialLoadTimeRef.current = Date.now();
    }
    previousMessagesLengthRef.current = messages.length;
  }, [messages, user?.id, partnerId]);

  // Restore scroll position after prepending older messages (load more / jump-to-memory)
  useLayoutEffect(() => {
    const before = prependScrollHeightRef.current;
    if (before === null) return;
    prependScrollHeightRef.current = null;
    const container = messagesContainerRef.current;
    if (!container) return;

    let isRestored = false;
    const diff = container.scrollHeight - before;
    if (diff > 0) {
      container.scrollTop += diff;
      isRestored = true;
    }

    requestAnimationFrame(() => {
      if (!isRestored) {
        const nextDiff = container.scrollHeight - before;
        if (nextDiff > 0) container.scrollTop += nextDiff;
      }
      isPrependingRef.current = false;
    });
  }, [messages]);

  // Jump to pinned memory from /chat?highlight=<messageId>
  useEffect(() => {
    if (!user) return;
    const highlightId = new URLSearchParams(window.location.search).get("highlight");
    if (!highlightId) return;
    if (highlightHandledRef.current === highlightId) return;
    if (messages.length === 0) return;

    void scrollToHighlightedMessage(highlightId).then((found) => {
      if (found) {
        highlightHandledRef.current = highlightId;
        window.history.replaceState({}, "", "/chat");
      }
    });
  }, [user, messages.length, scrollToHighlightedMessage]);

  // Composer grew (reply / edit bar) — keep latest message visible
  useLayoutEffect(() => {
    if (!replyTo && !editingMessage) return;
    stickToBottomRef.current = true;
    scrollChatForComposerChange(messagesContainerRef.current, bottomRef.current);
  }, [replyTo, editingMessage]);

  const startReply = useCallback((msg: ApiMessage) => {
    setReplyTo(msg);
    stickToBottomRef.current = true;
    scrollChatForComposerChange(messagesContainerRef.current, bottomRef.current);
  }, []);

  // Scroll position detection - track if user is near bottom (debounced for performance)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const handleScroll = () => {
      const { scrollHeight, scrollTop, clientHeight } = container;
      const isNear = scrollHeight - (scrollTop + clientHeight) < 100;
      isNearBottomRef.current = isNear;
      if (!isNear) stickToBottomRef.current = false;

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        setIsNearBottom(isNear);
        if (isNear) {
          setHasNewMessages(false);
          initialUnreadHandledRef.current = false;
          if (userIdRef.current) clearChatScrollAnchor(userIdRef.current);
        } else {
          const uid = userIdRef.current;
          if (uid) {
            const captured = captureScrollAnchor(container);
            if (captured) {
              saveChatScrollAnchor(uid, captured.messageId, captured.offsetPx, captured.scrollRatio);
            }
          }
        }
      }, 50);

      if (scrollAnchorSaveRef.current) clearTimeout(scrollAnchorSaveRef.current);
      scrollAnchorSaveRef.current = setTimeout(() => {
        const uid = userIdRef.current;
        if (!uid || isNearBottomRef.current) return;
        const captured = captureScrollAnchor(container);
        if (captured) {
          saveChatScrollAnchor(uid, captured.messageId, captured.offsetPx, captured.scrollRatio);
        }
      }, 120);
    };

    const saveAnchorNow = () => {
      const uid = userIdRef.current;
      if (!uid || isNearBottomRef.current) return;
      const captured = captureScrollAnchor(container);
      if (captured) {
        saveChatScrollAnchor(uid, captured.messageId, captured.offsetPx, captured.scrollRatio);
      }
    };

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('beforeunload', saveAnchorNow);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', saveAnchorNow);
      if (debounceTimer) clearTimeout(debounceTimer);
      if (scrollAnchorSaveRef.current) clearTimeout(scrollAnchorSaveRef.current);
      if (mediaScrollTimerRef.current) clearTimeout(mediaScrollTimerRef.current);
    };
  }, []);

  // Online/offline detection (UI only — messages always come from Neon via API)
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const markedReadRef = useRef<Set<string>>(new Set());
  const messagesForReadRef = useRef(messages);
  messagesForReadRef.current = messages;

  const markPartnerMessagesRead = useCallback(() => {
    if (!user || !isReadReceiptsEnabled()) return;
    if (document.visibilityState !== "visible") return;

    const unreadIds = messagesForReadRef.current
      .filter(
        (m) =>
          m.senderId === partnerId &&
          !m.read &&
          !m.deleted &&
          !markedReadRef.current.has(m.id),
      )
      .map((m) => m.id);
    if (unreadIds.length === 0) return;

    for (const id of unreadIds) markedReadRef.current.add(id);
    const readAt = new Date().toISOString();
    api.markMessagesReadBatch(unreadIds, user.id).catch(() => {
      for (const id of unreadIds) markedReadRef.current.delete(id);
    });
    setMessages((prev) => {
      const unreadSet = new Set(unreadIds);
      let changed = false;
      const next = prev.map((m) => {
        if (!unreadSet.has(m.id)) return m;
        if (m.read && m.readAt) return m;
        changed = true;
        return { ...m, read: true, readAt: m.readAt ?? readAt };
      });
      return changed ? next : prev;
    });
  }, [user, partnerId]);

  useEffect(() => {
    markPartnerMessagesRead();
  }, [messages, markPartnerMessagesRead]);

  useEffect(() => {
    if (!user || !isReadReceiptsEnabled()) return;
    const onVisible = () => markPartnerMessagesRead();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [user, markPartnerMessagesRead]);

  useEffect(() => {
    clearUnreadChatBadge();
    setUnreadChat(0);
  }, []);

  useEffect(() => {
    if (!user) return;
    const n = messages.filter((m) => m.senderId === partnerId && !m.deleted && !m.read).length;
    setUnreadChat(n);
  }, [messages, user, partnerId]);

  // Request notification permission on mount
  useEffect(() => {
    if (!user) return;

    let mounted = true;

    const setupNotifications = async () => {
      try {
        const granted = await requestNotificationPermission();
        if (granted && mounted) {
          const subscription = await subscribeToPush();
          if (subscription) {
            sendSubscriptionToServer(subscription, user.id);
          }
        }
      } catch (err) {
        console.error("Failed to setup notifications:", err);
      }
    };



    setupNotifications();

    return () => {
      mounted = false;
    };
  }, [user]);

  const fetchAllMessagesForExport = useCallback(async () => {
    const collected: ApiMessage[] = [];
    const seen = new Set<string>();
    let cursor: string | undefined;
    let hasMore = true;
    let guard = 0;

    while (hasMore && guard < 200) {
      const data = await api.getMessages({ cursor, limit: 100 });
      const batch = await normalizeMessages(data.messages || []);
      if (batch.length === 0) break;

      for (const msg of batch) {
        if (!seen.has(msg.id)) {
          seen.add(msg.id);
          collected.push(msg);
        }
      }

      hasMore = Boolean(data.pagination?.hasMore);
      cursor = data.pagination?.nextCursor || undefined;
      guard += 1;
    }

    return collected.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, []);

  const downloadChatImages = useCallback(async () => {
    if (!user) return;
    const toastId = "chat-export";
    try {
      toast.loading("Loading full chat history…", { id: toastId });
      const all = await fetchAllMessagesForExport();
      const visible = filterVisibleMessages(user.id, all);
      if (visible.length === 0) {
        finishToast(toastId, { type: "error", message: "No messages to export" });
        return;
      }
      toast.loading(`Exporting ${visible.length} messages…`, { id: toastId });
      downloadChatAsText(visible, user.id, user.name, pName);
      const pages = await downloadChatAsImage(visible, user.id, user.name, pName, (cur, total) => {
        if (total > 1) toast.loading(`Saving image part ${cur} of ${total}…`, { id: toastId });
      });
      finishToast(
        toastId,
        {
          type: "success",
          message:
            pages > 1
              ? `Saved readable .txt + ${pages} image parts.`
              : `Chat saved as .txt${pages ? " + image" : ""} (${visible.length} messages).`,
        },
      );
    } catch (err) {
      finishToast(toastId, {
        type: "error",
        message: err instanceof Error ? err.message : "Could not export chat.",
      });
    }
  }, [user, pName, fetchAllMessagesForExport]);

  const canEditMessage = useCallback((msg: ApiMessage) => {
    if (msg.senderId !== user?.id || !msg.text) return false;
    return Date.now() - new Date(msg.timestamp).getTime() < 60 * 60 * 1000;
  }, [user?.id]);

  const exportData = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/export/${user.id}`);
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `grova-export-${user.id}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export data:", err);
    }
  };

  // Drop legacy local chat cache — all messages live in Neon only
  useEffect(() => {
    try {
    } catch {
      /* ignore */
    }
  }, []);

  // Send helpers
  const stopTyping = useCallback(() => {
    if (!user) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    void api.sendTyping(user.id, partnerId, false);
  }, [user, partnerId]);

  const sendMsg = useCallback(async (partial: Partial<ApiMessage>) => {
    if (!user) return;

    if (!online) {
      setError("You're offline. Connect to the internet to send messages.");
      return;
    }

    stopTyping();

    let tempId: string | null = null;
    try {
      tempId = crypto.randomUUID();
      pendingOutgoingRef.current.add(tempId);
      const optimistic = buildOptimisticMessage({ senderId: user.id, ...partial }, tempId);

      setMessages((prev) => {
        const next = [...prev, optimistic];
        messagesSigRef.current = messagesListSignature(next);
        return next;
      });
      requestStickToBottom();

      const outgoing = await prepareOutgoingMessage({ senderId: user.id, ...partial });
      const saved = await api.sendMessage(outgoing);
      const [display] = await normalizeMessages([saved]);
      setMessages((prev) => {
        const next = replaceOptimisticMessage(prev, tempId!, display, user.id);
        pendingOutgoingRef.current.delete(tempId!);
        messagesSigRef.current = messagesListSignature(next);
        writeChatCache(user.id, next);
        return next;
      });
      requestStickToBottom();
    } catch (err) {
      console.error("Failed to send message:", err);
      if (tempId) {
        pendingOutgoingRef.current.delete(tempId);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
      setError("Message did not send. Check your connection and try again.");
      throw err;
    }
  }, [user, online, requestStickToBottom, stopTyping]);

  sendMsgRef.current = sendMsg;
  userIdRef.current = user?.id;

  const uploadAndSendGalleryImage = useCallback(
    async (file: File) => {
      if (!user) return;
      const tempId = crypto.randomUUID();
      const mime = file.type || "image/jpeg";
      const localPreview = URL.createObjectURL(file);
      pendingOutgoingRef.current.add(tempId);
      setMessages((prev) => [
        ...prev,
        buildOptimisticMessage(
          { senderId: user.id, type: "image", imageUrl: localPreview },
          tempId,
        ),
      ]);
      requestStickToBottom();
      try {
        const url = await uploadMediaFile(file, mime);
        const sticker =
          mediaViewMode === "once" ? "__vm:once" : mediaViewMode === "twice" ? "__vm:twice" : undefined;
        const outgoing = await prepareOutgoingMessage({
          senderId: user.id,
          type: "image",
          imageUrl: url,
          ...(sticker ? { companionSticker: sticker } : {}),
        });
        const saved = await api.sendMessage(outgoing);
        const [display] = await normalizeMessages([saved]);
        setMessages((prev) => {
          const next = replaceOptimisticMessage(prev, tempId, display, user.id);
          pendingOutgoingRef.current.delete(tempId);
          messagesSigRef.current = messagesListSignature(next);
          writeChatCache(user.id, next);
          return next;
        });
        // Notify partner that we shared a photo
        notifyFileShared(pName, "photo");
        requestAnimationFrame(() => URL.revokeObjectURL(localPreview));
      } catch (err) {
        URL.revokeObjectURL(localPreview);
        pendingOutgoingRef.current.delete(tempId);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        toast.error(err instanceof Error ? err.message : "Failed to send photo.", { duration: 4000 });
        throw err;
      }
    },
    [user, mediaViewMode, pName],
  );

  const uploadAndSendEphemeralMedia = useCallback(
    async (
      file: File,
      kind: "image" | "video",
      mode: "once" | "twice",
    ) => {
      if (!user) return;
      if (!online) {
        setError("You're offline. Connect to the internet to send messages.");
        return;
      }

      const sticker = mode === "once" ? "__vm:once" : "__vm:twice";
      const tempId = crypto.randomUUID();
      const mime = kind === "video" ? guessVideoMime(file) : file.type || "image/jpeg";
      const localPreview = URL.createObjectURL(file);
      pendingOutgoingRef.current.add(tempId);
      const optimistic = buildOptimisticMessage(
        {
          senderId: user.id,
          type: kind,
          companionSticker: sticker,
          mediaViewMode: mode,
          text: kind === "video" ? file.name || "Video" : undefined,
          ...(kind === "video"
            ? { fileData: localPreview, fileType: mime, fileSize: file.size }
            : localPreview
              ? { imageUrl: localPreview }
              : {}),
        },
        tempId,
      );
      setMessages((prev) => [...prev, optimistic]);
      requestStickToBottom();

      try {
        const url = await uploadMediaFile(file, mime);
        const outgoing = await prepareOutgoingMessage({
          senderId: user.id,
          ...(kind === "image"
            ? { type: "image" as const, imageUrl: url, companionSticker: sticker }
            : {
              type: "video" as const,
              text: file.name || "Video",
              fileData: url,
              fileType: mime,
              fileSize: file.size,
              companionSticker: sticker,
            }),
        });
        const saved = await api.sendMessage(outgoing);
        const [display] = await normalizeMessages([saved]);
        pendingOutgoingRef.current.delete(tempId);
        setMessages((prev) => {
          const next = replaceOptimisticMessage(prev, tempId, display, user.id);
          messagesSigRef.current = messagesListSignature(next);
          if (user?.id) writeChatCache(user.id, next);
          return next;
        });
        requestStickToBottom();
      } catch (err) {
        console.error("Failed to send ephemeral media:", err);
        pendingOutgoingRef.current.delete(tempId);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setError("Message did not send. Check your connection and try again.");
        throw err;
      } finally {
        if (localPreview) URL.revokeObjectURL(localPreview);
      }
    },
    [user, online, requestStickToBottom],
  );

  const openMediaMessage = useCallback(async (msg: ApiMessage) => {
    const timed = msg.mediaViewMode === "once" || msg.mediaViewMode === "twice";
    try {
      if (timed) {
        const opened = await api.openMediaMessage(msg.id);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msg.id
              ? {
                ...m,
                mediaOpenCount: opened.mediaOpenCount,
                mediaOpenedAt: opened.mediaOpenedAt ?? m.mediaOpenedAt,
              }
              : m,
          ),
        );
        const openedDisplay =
          opened.kind === "video"
            ? resolveChatVideoUrl(opened.url, msg.text, msg.fileType)
            : resolveChatImageUrl(opened.url);
        setMediaViewer({
          messageId: msg.id,
          url: openedDisplay ?? opened.url,
          kind: opened.kind,
          timed: true,
          useVideoDuration: opened.kind === "video",
          secondsLeft: opened.kind === "video" ? 0 : 10,
        });
        return;
      }

      const raw = msg.type === "image" ? msg.imageUrl || msg.imageData : msg.fileData;
      if (!raw) return;
      const display =
        msg.type === "video"
          ? resolveChatVideoUrl(raw, msg.text, msg.fileType)
          : resolveChatImageUrl(raw);
      setMediaViewer({
        messageId: msg.id,
        url: display ?? raw,
        kind: msg.type === "video" ? "video" : "image",
        timed: false,
        useVideoDuration: false,
        secondsLeft: 0,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open media");
    }
  }, []);



  const sendText = useCallback((rawText: string) => {
    const text = rawText.trim();
    if (!text) return;
    stopTyping();
    const replyMeta = replyTo
      ? {
        replyToId: replyTo.id,
        replyToText: replyPreviewLabel(replyTo).slice(0, 200),
        replyToSenderId: replyTo.senderId,
      }
      : {};
    setReplyTo(null);
    sendMsg({
      text,
      type: "text",
      ...replyMeta,
    });
  }, [sendMsg, replyTo, stopTyping]);

  // Debounced search handler
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Clear previous timeout
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    // Set new timeout with 300ms debounce
    searchDebounceRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 120);
  }, []);

  const handleInputActivity = useCallback((value: string) => {
    if (!user) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (!value.trim()) {
      void api.sendTyping(user.id, partnerId, false);
      return;
    }
    const now = Date.now();
    if (now - lastTypingPingRef.current > 400) {
      lastTypingPingRef.current = now;
      void api.sendTyping(user.id, partnerId, true);
    }
    typingTimeoutRef.current = setTimeout(() => {
      void api.sendTyping(user.id, partnerId, false);
    }, 1500);
  }, [user, partnerId]);

  const sendGreeting = useCallback((g: GreetingTemplate) => {
    sendMsg({
      text: g.text,
      type: "text",
      variant: "cute",
      companionSticker: g.companionSticker,
    });
  }, [sendMsg]);

  const handleEdit = useCallback((msg: ApiMessage) => {
    setEditingMessage(msg);
    setEditText(msg.text || "");
    setReplyTo(null);
    setContextMenu(null);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingMessage || !editText.trim() || !user || editSaving) return;
    if (editText.trim() === (editingMessage.text || "").trim()) {
      setEditingMessage(null);
      setEditText("");
      return;
    }

    setEditSaving(true);
    try {
      await api.editMessage(editingMessage.id, editText.trim(), user.id);
      setMessages((prev) => {
        const found = prev.find((m) => m.id === editingMessage.id);
        if (!found) return prev;
        return prev.map((m) => (m.id === editingMessage.id ? { ...m, text: editText.trim() } : m));
      });
      setEditingMessage(null);
      setEditText("");
    } catch (err) {
      console.error("Failed to edit message:", err);
      toast.error("Could not edit — only within 1 hour of sending.", { duration: 4000 });
    } finally {
      setEditSaving(false);
    }
  }, [editingMessage, editText, user, editSaving]);

  const handleCancelEdit = useCallback(() => {
    if (editSaving) return;
    setEditingMessage(null);
    setEditText("");
  }, [editSaving]);

  const handleShareLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported in this browser");
      return;
    }

    // Only block on clearly insecure contexts (http:// non-localhost)
    const proto = window.location?.protocol;
    if (proto === "http:" && !window.location?.hostname?.match(/^(localhost|127\.0\.0\.1)$/)) {
      toast.error("Location requires HTTPS. Open the app via a secure URL.");
      return;
    }

    setSharingLocation(true);
    const toastId = "location-sharing";
    toast.loading("Getting your location…", { id: toastId, duration: 30_000 });

    const sendFromPosition = async (position: GeolocationPosition) => {
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setCurrentLocation(location);
      try {
        await sendMsg({
          type: "location",
          location,
          text: "📍 Shared location",
        });
        toast.success("Location shared!", { id: toastId, duration: 2000 });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to send location", { id: toastId, duration: 4000 });
      } finally {
        setSharingLocation(false);
      }
    };

    const geoErrorMessage = (error: GeolocationPositionError) =>
      error.code === 1
        ? "Location permission denied. Allow location access in your browser settings."
        : error.code === 2
          ? "Location unavailable. Make sure location/GPS is turned on."
          : error.code === 3
            ? "Location request timed out. Try again."
            : "Could not get your location.";

    const fail = (error: GeolocationPositionError) => {
      toast.error(geoErrorMessage(error), { id: toastId, duration: 5000 });
      setSharingLocation(false);
    };

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      // Mobile: try high accuracy first (triggers GPS prompt), fall back to low accuracy
      navigator.geolocation.getCurrentPosition(
        (position) => void sendFromPosition(position),
        (firstError) => {
          if (firstError.code === 1) { fail(firstError); return; }
          // GPS failed — retry with low accuracy (cell/wifi)
          navigator.geolocation.getCurrentPosition(
            (position) => void sendFromPosition(position),
            fail,
            { enableHighAccuracy: false, timeout: 20_000, maximumAge: 60_000 },
          );
        },
        { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
      );
    } else {
      // Desktop: low accuracy first (IP/Wi-Fi), fall back to no-cache
      navigator.geolocation.getCurrentPosition(
        (position) => void sendFromPosition(position),
        (firstError) => {
          if (firstError.code === 1) { fail(firstError); return; }
          navigator.geolocation.getCurrentPosition(
            (position) => void sendFromPosition(position),
            fail,
            { enableHighAccuracy: false, timeout: 25_000, maximumAge: 0 },
          );
        },
        { enableHighAccuracy: false, timeout: 15_000, maximumAge: 120_000 },
      );
    }
  }, [sendMsg]);

  const handleStartThread = useCallback((message: ApiMessage) => {
    const threadId = message.threadId || message.id;
    setActiveThread(threadId);
    setShowThreadPanel(true);
  }, []);

  const handleReplyToThread = useCallback((threadId: string) => {
    setActiveThread(threadId);
    setShowThreadPanel(true);
  }, []);

  const handleCloseThread = useCallback(() => {
    setActiveThread(null);
    setShowThreadPanel(false);
  }, []);

  const getThreadMessages = useCallback((threadId: string) => {
    return messages.filter(msg => msg.threadId === threadId || msg.id === threadId);
  }, [messages]);

  const exportChatHistory = useCallback(async () => {
    if (!user) return;
    const toastId = "chat-export-info";
    try {
      toast.loading("Preparing export…", { id: toastId });
      const all = await fetchAllMessagesForExport();
      const visible = filterVisibleMessages(user.id, all);
      if (visible.length === 0) {
        finishToast(toastId, { type: "error", message: "No messages to export" });
        return;
      }
      downloadChatAsText(visible, user.id, user.name, pName);
      finishToast(toastId, { type: "success", message: `Exported ${visible.length} messages as .txt` });
    } catch (err) {
      finishToast(toastId, {
        type: "error",
        message: err instanceof Error ? err.message : "Could not export chat.",
      });
    }
  }, [user, pName, fetchAllMessagesForExport]);

  const deleteMessage = useCallback(async (id: string) => {
    try {
      const deleted = await api.deleteMessage(id);
      setMessages((prev) => {
        const found = prev.find(m => m.id === id);
        if (!found) return prev;
        return prev.map((m) =>
          m.id === id ? { ...m, ...deleted, deleted: true, text: undefined, audioData: undefined } : m,
        );
      });
    } catch (err) {
      const message = unsendErrorMessage(err);
      if (err instanceof Error && /not found/i.test(err.message)) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }
      window.alert(message);
    }
  }, []);

  const sendHeart = useCallback(() => sendMsg({ text: "♥", type: "heart" }), [sendMsg]);

  const sendSticker = useCallback(
    (s: string) => {
      if (s.startsWith("http")) sendMsg({ gifUrl: s, type: "gif" });
      else sendMsg({ text: s, type: "sticker" });
    },
    [sendMsg],
  );
  const sendGif = useCallback((url: string) => sendMsg({ gifUrl: url, type: "gif" }), [sendMsg]);

  const sendImage = useCallback((dataUrl: string) => sendMsg({ imageData: dataUrl, type: "image" }), [sendMsg]);

  const convertToWebP = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const webpDataUrl = canvas.toDataURL('image/webp', 0.8);
        resolve(webpDataUrl);
      };

      img.onerror = () => reject(new Error('Failed to load image'));

      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }, []);

  const uploadAndSendFile = useCallback(
    async (file: File) => {
      if (!user) return;

      const tempId = crypto.randomUUID();
      pendingOutgoingRef.current.add(tempId);
      const optimistic = buildOptimisticMessage(
        {
          senderId: user.id,
          type: "file",
          text: `${file.name} · Uploading…`,
          fileType: file.type,
          fileSize: file.size,
        },
        tempId,
      );
      setMessages((prev) => [...prev, optimistic]);
      scrollChatToBottom(messagesContainerRef.current, bottomRef.current);

      try {
        const url = await uploadMediaFile(file, file.type || undefined);
        const outgoing = await prepareOutgoingMessage({
          senderId: user.id,
          type: "file",
          text: file.name,
          fileData: url,
          fileType: file.type,
          fileSize: file.size,
        });
        const saved = await api.sendMessage(outgoing);
        const [display] = await normalizeMessages([saved]);
        pendingOutgoingRef.current.delete(tempId);
        setMessages((prev) => replaceOptimisticMessage(prev, tempId, display, user.id));
        // Notify partner that we shared a file
        notifyFileShared(pName, "file");
        scrollChatToBottom(messagesContainerRef.current, bottomRef.current);
      } catch (uploadError) {
        console.error("File upload failed:", uploadError);
        pendingOutgoingRef.current.delete(tempId);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        toast.error(
          uploadError instanceof Error
            ? uploadError.message
            : "File upload failed. Check your connection and try again.",
          { duration: 4000 },
        );
      }
    },
    [user, pName],
  );

  const mediaModeSticker = useCallback(
    (mode: "keep" | "once" | "twice"): string | undefined => {
      if (mode === "once") return "__vm:once";
      if (mode === "twice") return "__vm:twice";
      return undefined;
    },
    [],
  );

  const handlePickedFile = useCallback(
    async (fileInput: File | File[], clipboardItemType?: string) => {
      const files = Array.isArray(fileInput) ? fileInput : [fileInput];
      if (!user || filePickInFlightRef.current || files.length === 0) return;
      
      // Validate file types upfront
      const unsupportedFiles: string[] = [];
      for (const file of files) {
        if (!isSupportedFileType(file.type, file.name)) {
          unsupportedFiles.push(file.name);
        }
      }
      
      if (unsupportedFiles.length > 0) {
        toast.error(
          `❌ Unsupported file types:\n${unsupportedFiles.join(", ")}\n\nPlease use supported document, image, audio, video, or archive formats.`,
          { duration: 5000 },
        );
        return;
      }

      // Check file sizes
      const oversizedFiles: string[] = [];
      for (const file of files) {
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > MAX_FILE_SIZE_MB) {
          oversizedFiles.push(`${file.name} (${fileSizeMB.toFixed(1)}MB)`);
        }
      }
      
      if (oversizedFiles.length > 0) {
        toast.error(
          `⚠️ Files too large (max ${MAX_FILE_SIZE_MB}MB):\n${oversizedFiles.join(", ")}`,
          { duration: 5000 },
        );
        return;
      }

      filePickInFlightRef.current = true;
      const unlockTimer = window.setTimeout(() => {
        filePickInFlightRef.current = false;
      }, 90_000);

      const processSingleFile = async (file: File) => {
        const normalized = clipboardItemType
          ? normalizePastedFile(file, clipboardItemType)
          : await resolveGalleryPick(file);
        const toastId = `media-pick-${Date.now()}`;
        const quickDoc = isDocumentFile(normalized, clipboardItemType);
        const likelyVideo =
          clipboardItemType?.startsWith("video/") || isVideoFile(normalized, clipboardItemType);

        let kind: "image" | "video" | "other";
        try {
          if (quickDoc) {
            kind = "other";
          } else if (likelyVideo) {
            kind = "video";
          } else if (clipboardItemType?.startsWith("image/")) {
            kind = "image";
          } else {
            const magic = await detectMediaByMagicBytes(normalized);
            if (magic === "video") kind = "video";
            else if (magic === "image") kind = "image";
            else kind = await classifyMediaFile(normalized, clipboardItemType);
          }
          if (kind === "image") {
            const magic = await detectMediaByMagicBytes(normalized);
            if (magic === "video") kind = "video";
          }
        } catch {
          finishToast(toastId, { type: "error", message: "Could not read pasted file." });
          return;
        }

        const MAX_FILE_SIZE =
          kind === "video" ? 20 * 1024 * 1024 : kind === "image" ? 25 * 1024 * 1024 : 25 * 1024 * 1024;
        if (normalized.size > MAX_FILE_SIZE) {
          finishToast(toastId, {
            type: "error",
            message: kind === "video" ? "Video too large (max 20MB)." : "File too large (max 25MB).",
          });
          return;
        }

        if (files.length === 1 && (kind === "image" || kind === "video")) {
          setPendingMediaPreview({ file, clipboardItemType, kind, normalized });
          return;
        }

        try {
          if (kind === "image") {
            await uploadAndSendGalleryImage(normalized);
          } else if (kind === "video") {
            await uploadAndSendFile(normalized);
          } else {
            await uploadAndSendFile(normalized);
          }
        } catch (error) {
          console.error("Failed to process file:", error);
          finishToast(toastId, {
            type: "error",
            message: error instanceof Error ? error.message : "Failed to send media.",
          });
        }
      };

      try {
        for (const f of files) {
          await processSingleFile(f);
        }
      } finally {
        filePickInFlightRef.current = false;
        clearTimeout(unlockTimer);
      }
    },
    [user, uploadAndSendFile, uploadAndSendGalleryImage],
  );

  const processAndSendMedia = useCallback(
    async (viewMode: "keep" | "once" | "twice") => {
      if (!pendingMediaPreview || !user || filePickInFlightRef.current) return;
      filePickInFlightRef.current = true;
      setMediaViewMode(viewMode);

      const { clipboardItemType, kind, normalized } = pendingMediaPreview;
      setPendingMediaPreview(null);
      const isEphemeral = viewMode === "once" || viewMode === "twice";
      const toastId = `media-send-${Date.now()}`;

      try {
        if (kind === "image") {
          const prepared = await prepareImageForUpload(normalized, clipboardItemType);
          if (isEphemeral) {
            await uploadAndSendEphemeralMedia(prepared, "image", viewMode);
          } else if (!clipboardItemType) {
            await uploadAndSendGalleryImage(prepared);
          } else {
            setPendingImageType(prepared.type || "image/jpeg");
            setImageToCrop(URL.createObjectURL(prepared));
          }
        } else if (kind === "video") {
          const mime = guessVideoMime(normalized, clipboardItemType);
          const previewUrl = URL.createObjectURL(normalized);
          const tempId = crypto.randomUUID();
          pendingOutgoingRef.current.add(tempId);

          const optimistic = buildOptimisticMessage(
            {
              senderId: user.id,
              type: "video",
              text: normalized.name || "Video",
              fileData: previewUrl,
              fileType: mime,
              fileSize: normalized.size,
              ...(isEphemeral
                ? {
                  companionSticker: mediaModeSticker(viewMode),
                  mediaViewMode: viewMode,
                }
                : {}),
            },
            tempId,
          );
          setMessages((prev) => [...prev, optimistic]);
          requestStickToBottom();

          try {
            const duration = await getVideoDurationSafe(normalized);
            if (duration > 60) {
              pendingOutgoingRef.current.delete(tempId);
              setMessages((prev) => prev.filter((m) => m.id !== tempId));
              URL.revokeObjectURL(previewUrl);
              toast.error("Video must be 1 minute or less.", { duration: 4000 });
              return;
            }

            const url = await uploadMediaFile(normalized, mime);

            const sticker = mediaModeSticker(viewMode);
            const outgoing = await prepareOutgoingMessage({
              senderId: user.id,
              type: "video",
              text: normalized.name || "Video",
              fileData: url,
              fileType: mime,
              fileSize: normalized.size,
              ...(sticker ? { companionSticker: sticker } : {}),
            });
            const saved = await api.sendMessage(outgoing);
            const [display] = await normalizeMessages([saved]);
            pendingOutgoingRef.current.delete(tempId);
            setMessages((prev) => {
              const next = replaceOptimisticMessage(prev, tempId, display, user.id);
              messagesSigRef.current = messagesListSignature(next);
              writeChatCache(user.id, next);
              return next;
            });
            // Notify partner that we shared a video
            notifyFileShared(pName, "video");
            requestStickToBottom();
          } catch (videoErr) {
            pendingOutgoingRef.current.delete(tempId);
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
            toast.error(
              videoErr instanceof Error ? videoErr.message : "Failed to send video.",
              { duration: 4000 },
            );
          } finally {
            URL.revokeObjectURL(previewUrl);
          }
        }
      } catch (error) {
        console.error("Failed to process media:", error);
        finishToast(toastId, {
          type: "error",
          message: error instanceof Error ? error.message : "Failed to send media. Check your connection.",
        });
      } finally {
        filePickInFlightRef.current = false;
      }
    },
    [uploadAndSendFile, uploadAndSendGalleryImage, uploadAndSendEphemeralMedia, mediaModeSticker, user, pendingMediaPreview, pName],
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await handlePickedFile(file);
      e.target.value = "";
    },
    [handlePickedFile],
  );

  useEffect(() => {
    if (!user || blocked) return;

    const onDocumentPaste = (e: ClipboardEvent) => {
      if (recording || filePickInFlightRef.current) return;
      const cd = e.clipboardData;
      const picked = extractClipboardFiles(cd).filter(({ file }) => file.size > 0);
      const plainText = cd?.getData("text/plain")?.trim() ?? "";

      const runPaste = (files: { file: File; itemType?: string }[]) => {
        if (files.length === 0 || filePickInFlightRef.current) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        const { file, itemType } = files[0]!;
        void handlePickedFile(file, itemType);
      };

      if (picked.length > 0) {
        runPaste(picked);
        return;
      }

      // Screen recordings / Windows paste often need async clipboard read (even when text is also on clipboard).
      void readClipboardFilesAsync().then((asyncPicked) => {
        const media = asyncPicked.filter(({ file }) => file.size > 0);
        if (media.length === 0) return;
        runPaste(media);
      });

      if (plainText.length > 0) return;
    };

    document.addEventListener("paste", onDocumentPaste, true);
    return () => document.removeEventListener("paste", onDocumentPaste, true);
  }, [user, blocked, handlePickedFile, recording]);

  useEffect(() => {
    if (!mediaViewer?.timed || mediaViewer.useVideoDuration) return;
    const interval = setInterval(() => {
      setMediaViewer((prev) => {
        if (!prev || !prev.timed || prev.useVideoDuration) return prev;
        if (prev.secondsLeft <= 1) return null;
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [mediaViewer?.timed, mediaViewer?.useVideoDuration, mediaViewer?.messageId]);

  useEffect(() => {
    if (!mediaViewer?.timed) return;
    const onBlur = () => setMediaViewer(null);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onBlur);
    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onBlur);
    };
  }, [mediaViewer?.timed, mediaViewer?.messageId]);

  const dismissImageCrop = useCallback(() => {
    setImageToCrop((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const handleCroppedImage = useCallback(async (croppedDataUrl: string) => {
    if (cropSendInFlightRef.current || !user) return;
    cropSendInFlightRef.current = true;
    dismissImageCrop();

    const tempId = crypto.randomUUID();
    const sticker = mediaModeSticker(mediaViewMode);
    pendingOutgoingRef.current.add(tempId);
    const optimistic = buildOptimisticMessage(
      {
        senderId: user.id,
        type: "image",
        imageUrl: croppedDataUrl,
        companionSticker: sticker,
      },
      tempId,
    );
    setMessages((prev) => [...prev, optimistic]);
    requestStickToBottom();

    try {
      const url = await uploadMediaToB2(croppedDataUrl, pendingImageType);
      const outgoing = await prepareOutgoingMessage({
        senderId: user.id,
        type: "image",
        imageUrl: url,
        companionSticker: sticker,
      });
      const saved = await api.sendMessage(outgoing);
      const [display] = await normalizeMessages([saved]);
      pendingOutgoingRef.current.delete(tempId);
      setMessages((prev) => replaceOptimisticMessage(prev, tempId, display, user.id));
      requestStickToBottom();
    } catch (uploadError) {
      console.error("Failed to upload image:", uploadError);
      pendingOutgoingRef.current.delete(tempId);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      cropSendInFlightRef.current = false;
    }
  }, [pendingImageType, user, mediaModeSticker, mediaViewMode, dismissImageCrop, requestStickToBottom]);

  // Voice recording
  const startRecording = useCallback(async () => {
    if (voiceSendInFlightRef.current || recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
            ? "audio/mp4"
            : undefined;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        chunksRef.current = [];
        mediaRecorderRef.current = null;

        if (!shouldSendVoiceRef.current) return;
        shouldSendVoiceRef.current = false;

        const senderId = userIdRef.current;
        if (!senderId || voiceSendInFlightRef.current) return;

        voiceSendInFlightRef.current = true;
        const tempId = crypto.randomUUID();
        pendingOutgoingRef.current.add(tempId);
        setMessages((prev) => [
          ...prev,
          buildOptimisticMessage({ senderId, type: "audio" }, tempId),
        ]);
        scrollChatToBottom(messagesContainerRef.current, bottomRef.current);
        void (async () => {
          try {
            const voiceMime = (mimeType || "audio/webm").split(";")[0]?.trim() || "audio/webm";
            const voiceFile = new File([blob], `voice-${Date.now()}.webm`, { type: voiceMime });
            const [url, outgoing] = await Promise.all([
              uploadMediaFile(voiceFile, voiceMime),
              prepareOutgoingMessage({
                senderId,
                type: "audio",
                audioData: "",
              }),
            ]);
            outgoing.audioData = url;
            const saved = await api.sendMessage(outgoing);
            const [display] = await normalizeMessages([saved]);
            pendingOutgoingRef.current.delete(tempId);
            setMessages((prev) => replaceOptimisticMessage(prev, tempId, display, senderId));
            scrollChatToBottom(messagesContainerRef.current, bottomRef.current);
          } catch (err) {
            console.error("Voice upload failed:", err);
            pendingOutgoingRef.current.delete(tempId);
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
            toast.error(
              err instanceof Error ? err.message : "Voice message failed to send",
              { duration: 4000 },
            );
          } finally {
            voiceSendInFlightRef.current = false;
          }
        })();
      };
      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch (err) {
      console.error("Microphone error:", err);
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          toast.error("Microphone permission denied. Allow mic access in browser settings.");
        } else if (err.name === "NotFoundError") {
          toast.error("No microphone found.");
        } else if (err.name === "NotReadableError") {
          toast.error("Microphone is in use by another app.");
        } else {
          toast.error("Could not access microphone.");
        }
      } else {
        toast.error("Could not access microphone.");
      }
    }
  }, [recording]);

  const sendVoiceRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || !recording || recorder.state === "inactive") return;
    shouldSendVoiceRef.current = true;
    try {
      if (recorder.state === "recording") recorder.requestData();
      recorder.stop();
    } catch {
      /* ignore */
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    setRecordingTime(0);
  }, [recording]);

  const cancelRecording = useCallback(() => {
    shouldSendVoiceRef.current = false;
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        /* ignore */
      }
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    setRecordingTime(0);
    chunksRef.current = [];
  }, []);

  // Call actions
  const startCall = useCallback((type: "audio" | "video") => {
    if (!user) return;
    activeCallTypeRef.current = type;
    callRoleRef.current = "outgoing";
    callLoggedStartRef.current = false;
    callConnectedAtRef.current = 0;
    setCallSignal(null);
    setCallState({ status: "outgoing", type });
    setIncomingCall(null);
  }, [user]);

  const acceptCall = useCallback(() => {
    if (!incomingCall?.offer) return;
    activeCallTypeRef.current = incomingCall.type;
    callRoleRef.current = "incoming";
    callLoggedStartRef.current = false;
    callConnectedAtRef.current = 0;
    setCallSignal(null);
    setCallState({ status: "incoming", type: incomingCall.type, incomingOffer: incomingCall.offer });
    setIncomingCall(null);
  }, [incomingCall]);

  const rejectCall = useCallback(() => {
    if (user) {
      api.sendCallSignal({ type: "reject", senderId: user.id }).catch(() => { });
    }
    setIncomingCall(null);
  }, [user]);

  const onCallConnected = useCallback(() => {
    if (callLoggedStartRef.current) return;
    callLoggedStartRef.current = true;
    callConnectedAtRef.current = Date.now();
    if (callRoleRef.current === "outgoing") {
      void sendMsg({ type: "text", text: callStartedText(activeCallTypeRef.current) });
    }
  }, [sendMsg]);

  const endCall = useCallback((opts?: { fromRemote?: boolean }) => {
    const type = activeCallTypeRef.current;
    const startedAt = callConnectedAtRef.current;
    const hadSession = callLoggedStartRef.current;
    callLoggedStartRef.current = false;
    callConnectedAtRef.current = 0;
    setCallState(null);
    setCallSignal(null);
    setIncomingCall(null);
    if (hadSession && !opts?.fromRemote) {
      const durationSec = startedAt ? Math.max(0, Math.floor((Date.now() - startedAt) / 1000)) : 0;
      void sendMsg({ type: "text", text: callEndedText(type, durationSec) });
    }
  }, [sendMsg]);

  useEffect(() => {
    endCallRef.current = endCall;
  }, [endCall]);

  const handleDeleteChat = useCallback(async () => {
    if (!user) return;
    setShowDeleteConfirm(false);
    setShowInfo(false);
    setMessages([]);
    setHasMore(false);
    setLoadingMore(false);
    setHasNewMessages(false);
    setError(null);
    setHiddenTick((t) => t + 1);
    try {
      await clearChatForUser(user.id);
    } catch (err) {
      console.error("Failed to clear chat:", err);
      window.alert("Could not clear chat on the server. Try again.");
      void loadMessages();
    }
  }, [user, loadMessages]);

  const toggleLike = useCallback(async (id: string) => {
    try { await api.likeMessage(id); } catch { /**/ }
  }, []);

  const handleReact = useCallback(async (id: string, emoji: string) => {
    if (!user) return;
    let previousReaction: string | undefined;
    setMessages((prev) => {
      const msg = prev.find((m) => m.id === id);
      if (!msg) return prev;
      previousReaction = msg.reaction;
      const nextReaction = msg.reaction === emoji ? undefined : emoji;
      const displayReaction =
        msg.senderId === user.id ? msg.reaction : nextReaction;
      return prev.map((m) =>
        m.id === id ? { ...m, reaction: displayReaction } : m,
      );
    });
    try {
      const { reactions } = await api.reactMessage(id, user.id, emoji);
      const list = Array.isArray(reactions) ? reactions : [];
      setMessages((prev) => {
        const found = prev.find(m => m.id === id);
        if (!found) return prev;
        return prev.map((m) => {
          if (m.id !== id) return m;
          const myReaction = list.find((r) => r.userId === user.id)?.emoji;
          const partnerReaction = list.find((r) => r.userId === partnerId)?.emoji;
          const displayReaction =
            m.senderId === user.id
              ? (partnerReaction ?? myReaction)
              : (myReaction ?? partnerReaction);
          return { ...m, reaction: displayReaction };
        });
      });
    } catch (err) {
      setMessages((prev) => {
        const found = prev.find(m => m.id === id);
        if (!found) return prev;
        return prev.map((m) => (m.id === id ? { ...m, reaction: previousReaction } : m));
      });
      console.error("Failed to react to message:", err);
    }
  }, [user, partnerId]);

  const handleUnsend = useCallback(async (id: string) => {
    setContextMenu(null);
    let snapshot: ApiMessage | undefined;
    unsentIdsRef.current.add(id);
    setMessages((prev) => {
      snapshot = prev.find((m) => m.id === id);
      const next = prev.map((m) => (m.id === id ? tombstoneMessage(m) : m));
      if (user?.id) writeChatCache(user.id, next);
      return next;
    });
    try {
      await api.deleteMessage(id);
      setMessages((prev) => {
        const next = prev.map((m) => (m.id === id ? tombstoneMessage(m) : m));
        if (user?.id) writeChatCache(user.id, next);
        return next;
      });
      window.setTimeout(() => unsentIdsRef.current.delete(id), 12_000);
    } catch (err) {
      unsentIdsRef.current.delete(id);
      if (snapshot) {
        setMessages((prev) => {
          const next = prev.map((m) => (m.id === id ? snapshot! : m));
          if (user?.id) writeChatCache(user.id, next);
          return next;
        });
      } else if (err instanceof Error && /not found/i.test(err.message)) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }
      toast.error(unsendErrorMessage(err));
    }
  }, [user?.id]);

  const handleDeleteForMe = useCallback(
    async (id: string) => {
      if (!user) return;
      applyHiddenMessageId(user.id, id);
      setHiddenTick((t) => t + 1);
      try {
        await hideMessageForUser(user.id, id);
      } catch {
        const set = getHiddenMessageIds(user.id);
        set.delete(id);
        setHiddenTick((t) => t + 1);
        window.alert("Could not hide message — check your connection.");
      }
    },
    [user],
  );

  const handlePin = useCallback(async (id: string) => {
    if (!user) return;
    const msg = messages.find((m) => m.id === id);
    if (!msg) return;
    const nextPinned = !msg.pinned;
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, pinned: nextPinned } : m)));
    try {
      if (nextPinned) {
        await saveMemoryFromMessage(user.id, msg);
      } else {
        await removeMemory(user.id, id);
      }
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, pinned: !nextPinned } : m)));
      window.alert("Could not update pin — check your connection.");
    }
  }, [messages, user]);

  // Filter messages based on search query (memoized for performance)
  const visibleMessages = useMemo(() => {
    if (!user) return messages;
    return filterVisibleMessages(user.id, messages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, user, hiddenTick]);

  const filteredMessages = useMemo(() => {
    let filtered = visibleMessages;

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter((msg) =>
        msg.text?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply message type filter
    if (searchFilters.messageType !== "all") {
      filtered = filtered.filter((msg) => msg.type === searchFilters.messageType);
    }

    // Apply sender filter
    if (searchFilters.sender !== "all") {
      filtered = filtered.filter((msg) => {
        if (searchFilters.sender === "me") return msg.senderId === user?.id;
        if (searchFilters.sender === "partner") return msg.senderId !== user?.id;
        return true;
      });
    }

    // Apply reaction filter
    if (searchFilters.hasReaction) {
      filtered = filtered.filter((msg) => msg.reaction);
    }

    // Apply pinned filter
    if (searchFilters.isPinned) {
      filtered = filtered.filter((msg) => msg.pinned);
    }

    return filtered;
  }, [visibleMessages, searchQuery, searchFilters, user?.id]);

  // Memoize pinned messages to avoid filtering on every render
  const pinnedMessages = useMemo(() => {
    return visibleMessages.filter((m) => m.pinned);
  }, [visibleMessages]);

  // Memoize grouped messages to avoid regrouping on every render
  const groupedMessages = useMemo(() => {
    return groupByDay(filteredMessages, user?.id);
  }, [filteredMessages, user?.id]);

  const lastSeenOutgoingId = useMemo(
    () => findLastSeenOutgoingId(filteredMessages, user?.id),
    [filteredMessages, user?.id],
  );

  const messageById = useMemo(() => {
    const map = new Map<string, ApiMessage>();
    for (const m of messages) map.set(m.id, m);
    return map;
  }, [messages]);

  const showChatAurora = isMoonlightSagaTheme(appThemeId);
  const premiumChatClass = "";

  if (blocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
        <Ban className="w-12 h-12 text-destructive/50" />
        <p className="font-semibold">You've blocked {pName}</p>
        <button onClick={() => { setBlocked(false); setChatBlocked(false); }} className="px-4 py-2 bg-secondary rounded-lg text-sm font-semibold">Unblock</button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full">
      {user && (
        <ChatInbox
          userName={user.name}
          partnerId={partnerId}
          partnerName={pName}
          partnerAvatar={pAvatar}
          partnerLastSeen={partnerLastSeen}
          lastPreview={lastPreview}
          partnerTyping={showPartnerTyping}
          active
        />
      )}
      <div
        className={`chat-panel flex-1 min-w-0 h-full min-h-0 relative bg-black ${premiumChatClass ?? ""}`}
      >


        <div className="chat-panel-top shrink-0 z-20 flex flex-col relative">
          {/* ── Header ── */}
          <div className="chat-panel-header flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-3 py-1 sm:py-1.5 border-b shrink-0 text-white">
            <div className="relative shrink-0">
              <AvatarImage src={pAvatar} userId={partnerId} alt={pName} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover" />
              {presence.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" data-testid="chat-partner-name">{pName}</p>
              <p className={`text-xs flex items-center ${isTyping ? "text-primary" : presence.online ? "text-green-400" : "text-muted-foreground"}`}>
                {isTyping ? `${pName} is typing...` : presence.label}
              </p>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              {isEncryptionReady() && (
                <span className="hidden sm:flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20 mr-1">
                  <Shield className="w-3 h-3" /> Encrypted
                </span>
              )}
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-secondary/60">
                {online ? (
                  <Wifi className="w-3 h-3 text-green-400" />
                ) : (
                  <WifiOff className="w-3 h-3 text-destructive" />
                )}
                <span className="text-xs text-muted-foreground">{presence.label}</span>
              </div>


              <button
                onClick={() => { setShowBubbleColors(true); }}
                className={`p-1.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 active:scale-95 ${showBubbleColors ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                aria-label="Change bubble color"
              >
                <Palette className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => startCall("audio")}
                className="hidden sm:inline-flex p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 active:scale-95"
                data-testid="button-voice-call"
                aria-label="Start audio call"
              >
                <Phone className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => startCall("video")}
                className="hidden sm:inline-flex p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 active:scale-95"
                data-testid="button-video-call"
                aria-label="Start video call"
              >
                <Video className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => { setShowInfo(s => !s); }}
                className={`p-1.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 active:scale-95 ${showInfo ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                data-testid="button-info"
                aria-label="Show chat info"
              >
                <Info className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Messages ── */}
        <div
          className="chat-panel-messages relative z-[1] overflow-y-auto px-2 sm:px-3 py-2 md:py-3 md:px-4 flex flex-col gap-1 scrollbar-hide"
          data-testid="messages-list"
          ref={messagesContainerRef}
          style={{ scrollBehavior: 'auto' }}
          onClick={(e) => {
            const t = e.target as HTMLElement;
            if (t.closest("button, a, input, textarea, video, audio, img, [role='button']")) return;
            if (!isNearBottomRef.current) return;
            if (window.matchMedia("(max-width: 767px)").matches) return;
            messageInputRef.current?.focus();
          }}
        >
          {/* New messages indicator */}
          {hasNewMessages && !isNearBottom && (
            <div className="flex justify-center mb-2 sticky top-0 z-10">
              <button
                onClick={() => {
                  initialUnreadHandledRef.current = false;
                  scrollChatToBottom(messagesContainerRef.current, bottomRef.current);
                  setHasNewMessages(false);
                }}
                className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full hover:bg-primary/90 transition-colors shadow-sm"
              >
                ↓ New messages
              </button>
            </div>
          )}

          {/* Load more indicator at top */}
          <div ref={messagesStartRef} className="h-2" />

          {/* Pinned messages section */}
          {pinnedMessages.length > 0 && (
            <div className="mb-4 px-2">
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-2 font-semibold px-2">Pinned</p>
              {pinnedMessages.map(msg => {
                const isMe = msg.senderId === user?.id;
                return (
                  <MessageItem
                    key={msg.clientUniqueId || msg.id}
                    msg={msg}
                    isMe={isMe}
                    myId={user?.id ?? "me"}
                    partnerName={pName}

                    partnerAvatar={pAvatar}
                    onDelete={deleteMessage}
                    onLike={toggleLike}
                    onReact={handleReact}
                    onUnsend={handleUnsend}
                    onPin={handlePin}
                    onReply={startReply}
                    onEdit={handleEdit}
                    onOpenMenu={(m: ApiMessage, rect: DOMRect) => setContextMenu({ msg: m, top: rect.bottom + 4, left: rect.left })}
                    onOpenMedia={openMediaMessage}
                    seenLabel={buildSeenLabel(msg, isMe, lastSeenOutgoingId, partnerId)}
                    onStartThread={handleStartThread}
                    onReplyToThread={handleReplyToThread}
                    onMediaLoad={scrollToBottomForMedia}
                    onMediaCommitted={handleMediaCommitted}
                    replySource={msg.replyToId ? messageById.get(msg.replyToId) : undefined}
                    onJumpToMessage={jumpToMessage}
                  />
                );
              })}
            </div>
          )}
          {loadingMore && messages.length > 0 && (
            <div className="flex justify-center py-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Profile header — only when chat is empty so scroll stays on messages */}
          {visibleMessages.length <= 3 && (
            <div className="flex flex-col items-center gap-2 py-3 md:py-6 mb-1 shrink-0">
              <AvatarImage src={pAvatar} userId={partnerId} alt={`Profile picture of ${pName}`} className="w-14 h-14 md:w-20 md:h-20 rounded-full object-cover" />
              <p className="font-bold text-sm md:text-base">{pName}</p>
              <span className="text-[10px] md:text-xs bg-secondary/60 px-3 py-1 rounded-full text-muted-foreground">Just the two of you ♥</span>
            </div>
          )}

          {error && messages.length === 0 && visibleMessages.length === 0 && (
            <div
              className="flex flex-col items-center gap-3 py-8 text-center px-4 bg-destructive/5 border border-destructive/30 rounded-2xl mx-2"
            >
              <div className="w-12 h-12 rounded-full bg-destructive/15 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Failed to load messages</p>
                <p className="text-xs text-destructive/80">{error}</p>
              </div>
              <button
                onClick={() => { setError(null); loadMessages(); }}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-semibold hover:bg-destructive/90 transition-colors active:scale-95"
              >
                Try Again
              </button>
            </div>
          )}

          {!error && visibleMessages.length === 0 && messages.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center px-4">
              <span className="text-4xl">💬</span>
              {user && getChatClearedAt(user.id) ? (
                <>
                  <p className="text-sm font-medium text-foreground">Chat cleared on your side</p>
                  <p className="text-xs text-muted-foreground">
                    Older messages are hidden for you. {pName} may still see the full history — send a new message anytime.
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Say hi to {pName}!</p>
              )}
            </div>
          )}

          {groupedMessages.map((group, groupIndex) => (
            <div key={`${group.dayKey}-${groupIndex}`}>
              {group.label ? (
                <p className="text-center text-[11px] text-muted-foreground/70 my-4 font-medium">{group.label}</p>
              ) : null}
              {group.msgs
                .filter((msg: ApiMessage) => !msg.pinned)
                .map((msg, i, arr) => {
                  const isMe = msg.senderId === user?.id;
                  const prevMsg = arr[i - 1];
                  const timeGap = shouldShowTimeGap(prevMsg, msg, user?.id);
                  return (
                    <div key={msg.clientUniqueId || msg.id} className="chat-message-row">
                      {timeGap && (
                        <p className="text-center text-[10px] text-muted-foreground/60 my-3 font-medium">{timeGap}</p>
                      )}
                      <MessageItem
                        msg={msg}
                        isMe={isMe}
                        myId={user?.id ?? "me"}
                        partnerName={pName}
                        partnerAvatar={pAvatar}
                        onDelete={deleteMessage}
                        onLike={toggleLike}
                        onReact={handleReact}
                        onUnsend={handleUnsend}
                        onPin={handlePin}
                        onReply={startReply}
                        onOpenMenu={(m: ApiMessage, rect: DOMRect) => setContextMenu({ msg: m, top: rect.bottom + 4, left: rect.left })}
                        onOpenMedia={openMediaMessage}
                        prevMsg={prevMsg}
                        seenLabel={buildSeenLabel(msg, isMe, lastSeenOutgoingId, partnerId)}
                        onStartThread={handleStartThread}
                        onReplyToThread={handleReplyToThread}
                        onMediaLoad={scrollToBottomForMedia}
                        onMediaCommitted={handleMediaCommitted}
                        replySource={msg.replyToId ? messageById.get(msg.replyToId) : undefined}
                        onJumpToMessage={jumpToMessage}
                      />
                    </div>
                  );
                })}
            </div>
          ))}

          <div ref={bottomRef} className="h-8 shrink-0" aria-hidden />
        </div>

        <div className="chat-panel-bottom shrink-0 relative z-10">
          {showPartnerTyping && (
            <div className="flex items-end gap-2 px-3 py-1.5 shrink-0 border-t border-white/5 bg-background/80 backdrop-blur-sm">
              <AvatarImage src={pAvatar} userId={partnerId} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
              <div className="bg-secondary/80 rounded-2xl rounded-bl-md px-3 py-2 flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{partnerTypingLine(partnerId)}</span>
                <TypingDots />
              </div>
            </div>
          )}
          {/* ── Edit Message Bar ── */}
          {editingMessage && (
            <EditMessageBar
              value={editText}
              onChange={setEditText}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
              saving={editSaving}
            />
          )}

          {doodleOpen && (
            <DoodleCanvas
              onClose={closeDoodlePanel}
              onSend={handleDoodleSend}
            />
          )}

          {/* ── Input Bar or Media Preview ── */}
          {pendingMediaPreview ? (
            <PendingMediaPreview
              file={pendingMediaPreview.normalized}
              onCancel={() => setPendingMediaPreview(null)}
              onSend={processAndSendMedia}
              disabled={!online || blocked}
            />
          ) : (
            <MessageInput
              ref={messageInputRef}
              onInputActivity={handleInputActivity}
              onSendMessage={sendText}
              onShareLocation={handleShareLocation}
              sharingLocation={sharingLocation}
              replyPreview={
                replyTo && user ? (
                  <ReplyPreview
                    replyTo={replyTo}
                    myId={user.id}
                    partnerName={pName}
                    onCancel={() => setReplyTo(null)}
                  />
                ) : undefined
              }
              onStickerSelect={sendSticker}
              onGifSelect={sendGif}
              onGreetingSelect={sendGreeting}
              onImageSelect={(file, itemType) => {
                void handlePickedFile(file, itemType);
              }}
              onOpenCamera={() => setShowCamera(true)}
              mediaViewMode={mediaViewMode}
              onMediaViewModeChange={setMediaViewMode}
              onDoodleOpen={openDoodlePanel}
              doodleActive={doodleOpen}
              onStartRecording={startRecording}
              onCancelRecording={cancelRecording}
              onSendRecording={sendVoiceRecording}
              recording={recording}
              recordingTime={recordingTime}
              disabled={!online || blocked || editingMessage !== null}
            />
          )}
          <BubbleColorSelector
            show={showBubbleColors}
            onClose={() => setShowBubbleColors(false)}
            currentThemeId={user ? getCachedChatTheme() : "default"}
            onSelect={(themeId) => {
              if (updateChatTheme) updateChatTheme(themeId);
            }}
          />
        </div>

        <AppThemeModal
          show={showAppThemes}
          onClose={() => setShowAppThemes(false)}
          current={appThemeId}
          onSelect={(themeId) => {
            setAppThemeId(themeId);
            api.updateCouplePrefs({ appTheme: themeId }).then(refreshCouplePrefs).catch(console.error);
          }}
        />

        {showCamera && (
          <CameraOverlay
            onClose={() => setShowCamera(false)}
            onCapture={(file) => {
              setShowCamera(false);
              void handlePickedFile(file);
            }}
          />
        )}

        {/* ── Info Panel ── */}
        <InfoPanel
          show={showInfo}
          onClose={() => setShowInfo(false)}
          partnerName={pName}
          partnerAvatar={pAvatar}
          partnerLastSeen={partnerLastSeen}
          online={online}
          blocked={blocked}
          onToggleBlock={() => {
            setBlocked((prev) => {
              const next = !prev;
              setChatBlocked(next);
              return next;
            });
          }}
          onClearChat={() => setShowDeleteConfirm(true)}
          onExportChat={exportChatHistory}
          onAudioCall={() => startCall("audio")}
          onVideoCall={() => startCall("video")}
        />

        {/* ── Delete confirm ── */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-6">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-xs" data-testid="delete-confirm">
              <Trash2 className="w-8 h-8 text-destructive mx-auto mb-3" />
              <h3 className="font-bold text-center mb-1">Clear chat for you?</h3>
              <p className="text-sm text-muted-foreground text-center mb-5">
                Messages disappear on your account only. {pName} will still see the full chat.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 bg-secondary rounded-xl text-sm font-semibold" data-testid="button-cancel-delete">Cancel</button>
                <button onClick={handleDeleteChat} className="flex-1 py-2.5 bg-destructive text-white rounded-xl text-sm font-semibold" data-testid="button-confirm-delete">Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Incoming call banner ── */}
        {incomingCall && (
          <IncomingCallOverlay
            callerName={pName}
            callerAvatar={pAvatar}
            callType={incomingCall.type}
            canAccept={Boolean(incomingCall.offer)}
            onAccept={acceptCall}
            onReject={rejectCall}
          />
        )}

        {/* ── Active / Outgoing call screen ── */}
        {callState && (
          <CallScreen
            call={callState}
            partnerId={partnerId}
            partnerName={pName}
            partnerAvatar={pAvatar}
            myId={user!.id}
            onSendSignal={(data) => api.sendCallSignal(data)}
            onConnected={onCallConnected}
            onEnd={endCall}
            incomingSignal={callSignal ?? undefined}
          />
        )}

        {mediaViewer && (
          <div
            className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center p-4"
            onContextMenu={(e) => e.preventDefault()}
          >
            <button
              type="button"
              onClick={() => setMediaViewer(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center"
              aria-label="Close media"
            >
              <X className="w-5 h-5" />
            </button>
            {mediaViewer.timed && !mediaViewer.useVideoDuration && (
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-primary/30 text-white text-sm font-semibold">
                {mediaViewer.secondsLeft}s
              </div>
            )}
            {mediaViewer.kind === "video" ? (
              <video
                src={mediaViewer.url}
                controls={!mediaViewer.timed}
                autoPlay
                playsInline
                onEnded={() => {
                  if (mediaViewer.timed) setMediaViewer(null);
                }}
                className="w-full h-full object-contain"
              />
            ) : (
              <img src={mediaViewer.url} alt="Media Viewer" className="w-full h-full object-contain" />
            )}
          </div>
        )}

        {contextMenu && user && (
          <MessageContextMenu
            msg={contextMenu.msg}
            position={{ top: contextMenu.top, left: contextMenu.left }}
            mode={contextMenu.msg.type === "audio" ? "audio" : "full"}
            isMe={contextMenu.msg.senderId === user.id}
            canEdit={canEditMessage(contextMenu.msg)}
            onClose={() => setContextMenu(null)}
            onReply={() => startReply(contextMenu.msg)}
            onCopy={() => {
              if (contextMenu.msg.text) navigator.clipboard.writeText(contextMenu.msg.text);
            }}
            onPin={() => handlePin(contextMenu.msg.id)}
            onDeleteForMe={() => handleDeleteForMe(contextMenu.msg.id)}
            onUnsend={
              contextMenu.msg.senderId === user.id ? () => handleUnsend(contextMenu.msg.id) : undefined
            }
            onRemoveReaction={
              typeof contextMenu.msg.reaction === "string" && contextMenu.msg.reaction.trim()
                ? () => handleReact(contextMenu.msg.id, contextMenu.msg.reaction as string)
                : undefined
            }
            onEdit={
              canEditMessage(contextMenu.msg)
                ? () => handleEdit(contextMenu.msg)
                : undefined
            }
            onDownloadChat={contextMenu.msg.type !== "audio" ? downloadChatImages : undefined}
          />
        )}

        {imageToCrop && (
          <ImageCropModal
            imageSrc={imageToCrop}
            title="Crop before sending"
            onCancel={dismissImageCrop}
            onApply={handleCroppedImage}
          />
        )}

      </div>
    </div>
  );
}
