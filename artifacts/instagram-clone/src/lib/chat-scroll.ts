/** Instant scroll to latest message — no scrollIntoView animation through history. */
export function scrollChatToBottom(
  container: HTMLElement | null,
  bottomAnchor?: HTMLElement | null,
): void {
  if (!container) return;
  const run = () => {
    container.scrollTop = container.scrollHeight;
    bottomAnchor?.scrollIntoView({ block: "end", behavior: "instant" as ScrollBehavior });
  };
  run();
  requestAnimationFrame(run);
  requestAnimationFrame(run);
}

/** Call after images/GIFs load — layout height changes after first scroll. */
export function scrollChatToBottomAfterPaint(
  container: HTMLElement | null,
  bottomAnchor?: HTMLElement | null,
): void {
  scrollChatToBottom(container, bottomAnchor);
  requestAnimationFrame(() => scrollChatToBottom(container, bottomAnchor));
  setTimeout(() => scrollChatToBottom(container, bottomAnchor), 120);
}
