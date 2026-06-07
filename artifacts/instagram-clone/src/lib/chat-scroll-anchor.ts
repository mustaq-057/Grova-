const ANCHOR_PREFIX = "grova_chat_scroll_v1_";

export type ChatScrollAnchor = {
  messageId: string;
  offsetPx: number;
  at: string;
};

export function saveChatScrollAnchor(
  userId: string,
  messageId: string,
  offsetPx: number,
): void {
  try {
    const payload: ChatScrollAnchor = {
      messageId,
      offsetPx,
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
  const el = container.querySelector(
    `[data-testid="message-${anchor.messageId}"]`,
  ) as HTMLElement | null;
  if (!el) return false;
  const containerRect = container.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const offsetTop = elRect.top - containerRect.top + container.scrollTop;
  container.scrollTop = Math.max(0, offsetTop - anchor.offsetPx);
  return true;
}
