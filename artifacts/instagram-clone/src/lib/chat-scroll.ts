/** Instant scroll to latest message — direct scrollTop avoids scrollIntoView jitter. */
export function scrollChatToBottom(
  container: HTMLElement | null,
  _bottomAnchor?: HTMLElement | null,
): void {
  if (!container) return;
  container.scrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
}

/** Scroll a message row to the vertical center of the chat container (precise jump). */
export function scrollMessageIntoCenter(
  container: HTMLElement | null,
  messageEl: HTMLElement | null,
  behavior: ScrollBehavior = "auto",
): void {
  if (!container || !messageEl) return;
  const elRect = messageEl.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const offsetTop = elRect.top - containerRect.top + container.scrollTop;
  const target =
    offsetTop - container.clientHeight / 2 + elRect.height / 2;
  container.scrollTo({
    top: Math.max(0, target),
    behavior,
  });
}

/** One soft scroll — avoids the bounce from repeated scroll-to-bottom passes. */
export function scrollChatToBottomSoft(
  container: HTMLElement | null,
  bottomAnchor?: HTMLElement | null,
): void {
  scrollChatToBottom(container, bottomAnchor);
}

/** Repeat scroll across layout passes (images, replies, decrypt text expansion). */
export function scrollChatToBottomAfterPaint(
  container: HTMLElement | null,
  bottomAnchor?: HTMLElement | null,
  _aggressive = false,
): void {
  if (!container) return;
  scrollChatToBottom(container, bottomAnchor);
  requestAnimationFrame(() => scrollChatToBottom(container, bottomAnchor));
}

/** Keep pinned to bottom while composer grows (reply bar, edit bar). */
export function scrollChatForComposerChange(
  container: HTMLElement | null,
  bottomAnchor?: HTMLElement | null,
): void {
  scrollChatToBottomAfterPaint(container, bottomAnchor, false);
}
