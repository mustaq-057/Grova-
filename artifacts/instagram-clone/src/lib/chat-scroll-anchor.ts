const ANCHOR_PREFIX = "grova_chat_scroll_v1_";

export type ChatScrollAnchor = {
  messageId: string;
  offsetPx: number;
  /** 0..1 scroll position fallback when the anchor row is not mounted yet */
  scrollRatio?: number;
  at: string;
};

export function saveChatScrollAnchor(
  userId: string,
  messageId: string,
  offsetPx: number,
  scrollRatio?: number,
): void {
  try {
    const payload: ChatScrollAnchor = {
      messageId,
      offsetPx,
      scrollRatio,
      at: new Date().toISOString(),
    };
    sessionStorage.setItem(`${ANCHOR_PREFIX}${userId}`, JSON.stringify(payload));
  } catch {
    /* quota or private mode */
  }
}

export function saveChatScrollRatio(userId: string, scrollRatio: number): void {
  try {
    const existing = readChatScrollAnchor(userId);
    const payload: ChatScrollAnchor = {
      messageId: existing?.messageId ?? "__ratio__",
      offsetPx: existing?.offsetPx ?? 0,
      scrollRatio,
      at: new Date().toISOString(),
    };
    sessionStorage.setItem(`${ANCHOR_PREFIX}${userId}`, JSON.stringify(payload));
  } catch {
    /* quota or private mode */
  }
}

export function readChatScrollAnchor(userId: string): ChatScrollAnchor | null {
  try {
    const raw = sessionStorage.getItem(`${ANCHOR_PREFIX}${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChatScrollAnchor;
    if (!parsed?.messageId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearChatScrollAnchor(userId: string): void {
  try {
    sessionStorage.removeItem(`${ANCHOR_PREFIX}${userId}`);
  } catch {
    /* ignore */
  }
}

/** First message row intersecting the chat container viewport (top-down). */
export function findTopVisibleMessageId(container: HTMLElement): {
  messageId: string;
  offsetPx: number;
} | null {
  const containerRect = container.getBoundingClientRect();
  const nodes = container.querySelectorAll<HTMLElement>('[data-testid^="message-"]');
  for (const el of nodes) {
    const testId = el.getAttribute("data-testid") ?? "";
    const messageId = testId.replace(/^message-/, "");
    if (!messageId) continue;
    const rect = el.getBoundingClientRect();
    if (rect.bottom < containerRect.top + 4) continue;
    if (rect.top > containerRect.bottom) break;
    const offsetPx = rect.top - containerRect.top;
    return { messageId, offsetPx };
  }
  return null;
}

export function restoreScrollToAnchor(
  container: HTMLElement | null,
  anchor: ChatScrollAnchor,
): boolean {
  if (!container) return false;

  if (anchor.messageId && anchor.messageId !== "__ratio__") {
    const el = container.querySelector(
      `[data-testid="message-${anchor.messageId}"]`,
    ) as HTMLElement | null;
    if (el) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offsetTop = elRect.top - containerRect.top + container.scrollTop;
      container.scrollTop = Math.max(0, offsetTop - anchor.offsetPx);
      return true;
    }
  }

  if (anchor.scrollRatio != null && Number.isFinite(anchor.scrollRatio)) {
    const max = container.scrollHeight - container.clientHeight;
    if (max > 0) {
      container.scrollTop = Math.round(anchor.scrollRatio * max);
      return true;
    }
  }

  return false;
}

/** Only restore saved position when the user was reading history (not at the bottom). */
export function shouldRestoreScrollAnchor(
  anchor: ChatScrollAnchor | null,
  tailMessageIds: string[],
): boolean {
  if (!anchor) return false;
  if (anchor.messageId !== "__ratio__" && tailMessageIds.includes(anchor.messageId)) {
    return false;
  }
  if (anchor.scrollRatio != null && anchor.scrollRatio >= 0.82) {
    return false;
  }
  return true;
}

export function captureScrollAnchor(
  container: HTMLElement,
): { messageId: string; offsetPx: number; scrollRatio: number } | null {
  const { scrollHeight, scrollTop, clientHeight } = container;
  const max = scrollHeight - clientHeight;
  const scrollRatio = max > 0 ? scrollTop / max : 0;
  const visible = findTopVisibleMessageId(container);
  if (visible) {
    return { ...visible, scrollRatio };
  }
  if (max > 0) {
    return { messageId: "__ratio__", offsetPx: 0, scrollRatio };
  }
  return null;
}
