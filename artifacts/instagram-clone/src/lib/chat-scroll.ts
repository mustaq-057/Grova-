/** Instant scroll to latest message — no animated scroll through history. */
export function scrollChatToBottom(
  container: HTMLElement | null,
  _bottomAnchor?: HTMLElement | null,
): void {
  if (!container) return;
  container.scrollTop = container.scrollHeight;
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

/** Repeat scroll across layout passes (images, replies, decrypt text expansion). */
export function scrollChatToBottomAfterPaint(
  container: HTMLElement | null,
  bottomAnchor?: HTMLElement | null,
  aggressive = false,
): void {
  if (!container) return;

  const run = () => scrollChatToBottom(container, bottomAnchor);
  run();
  requestAnimationFrame(run);
  requestAnimationFrame(() => requestAnimationFrame(run));
  if (aggressive) {
    setTimeout(run, 0);
    setTimeout(run, 80);
    setTimeout(run, 200);
  } else {
    setTimeout(run, 48);
  }
}

/** Keep pinned to bottom while composer grows (reply bar, edit bar). */
export function scrollChatForComposerChange(
  container: HTMLElement | null,
  bottomAnchor?: HTMLElement | null,
): void {
  scrollChatToBottomAfterPaint(container, bottomAnchor, false);
}
