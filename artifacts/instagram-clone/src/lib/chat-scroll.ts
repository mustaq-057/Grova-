/** Instant scroll to latest message — no animated scroll through history. */
export function scrollChatToBottom(
  container: HTMLElement | null,
  _bottomAnchor?: HTMLElement | null,
): void {
  if (!container) return;
  container.scrollTop = container.scrollHeight;
}

/** Repeat scroll across layout passes (images, replies, decrypt text expansion). */
export function scrollChatToBottomAfterPaint(
  container: HTMLElement | null,
  bottomAnchor?: HTMLElement | null,
): void {
  if (!container) return;

  const run = () => scrollChatToBottom(container, bottomAnchor);
  run();
  requestAnimationFrame(run);
  requestAnimationFrame(() => requestAnimationFrame(run));
  setTimeout(run, 0);
  setTimeout(run, 80);
  setTimeout(run, 200);
}

/** Keep pinned to bottom while composer grows (reply bar, edit bar). */
export function scrollChatForComposerChange(
  container: HTMLElement | null,
  bottomAnchor?: HTMLElement | null,
): void {
  scrollChatToBottomAfterPaint(container, bottomAnchor);
}
