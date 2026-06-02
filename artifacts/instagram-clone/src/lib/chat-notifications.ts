import type { ApiMessage } from "./api";
import { normalizeMessages, messagePreview } from "./message-utils";
import { bumpUnreadChatBadge } from "./notifications-feed";
import { requestNotificationPermission, showNotification } from "./notifications";
import { areNotificationsEnabled } from "./couple-sync";
import { toast } from "sonner";

export type ChatNotifyContext = {
  myId: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
};

function onChatRoute(): boolean {
  return typeof window !== "undefined" && window.location.pathname.includes("/chat");
}

function shouldBumpChatBadge(): boolean {
  return !onChatRoute() || document.visibilityState === "hidden";
}

function showChatToast(title: string, body: string) {
  toast.message(title, {
    description: body,
    duration: 5000,
    action: {
      label: "Open chat",
      onClick: () => {
        window.location.href = "/chat";
      },
    },
  });
}

/** New message, gif, photo, video, voice, file, etc. */
export async function alertIncomingChatMessage(raw: ApiMessage, ctx: ChatNotifyContext): Promise<void> {
  if (raw.senderId !== ctx.partnerId) return;

  if (shouldBumpChatBadge()) {
    bumpUnreadChatBadge();
  }

  let msg = raw;
  try {
    [msg] = await normalizeMessages([raw]);
  } catch {
    /* use raw for preview */
  }

  const preview = messagePreview(msg) || "New message";
  showChatToast(ctx.partnerName, preview);

  if (!areNotificationsEnabled()) return;

  const granted =
    Notification.permission === "granted"
      ? true
      : Notification.permission !== "denied"
        ? await requestNotificationPermission()
        : false;

  if (granted && shouldBumpChatBadge()) {
    showNotification(ctx.partnerName, preview, ctx.partnerAvatar || undefined);
  }
}

export function alertIncomingChatLike(ctx: Pick<ChatNotifyContext, "partnerName" | "partnerAvatar">): void {
  if (shouldBumpChatBadge()) bumpUnreadChatBadge();
  const body = "liked your message";
  showChatToast(ctx.partnerName, body);
  if (areNotificationsEnabled() && Notification.permission === "granted") {
    showNotification(ctx.partnerName, body, ctx.partnerAvatar || undefined);
  }
}

export function alertIncomingChatReaction(
  emoji: string,
  ctx: Pick<ChatNotifyContext, "partnerName" | "partnerAvatar">,
): void {
  if (shouldBumpChatBadge()) bumpUnreadChatBadge();
  const body = `reacted ${emoji} to your message`;
  showChatToast(ctx.partnerName, body);
  if (areNotificationsEnabled() && Notification.permission === "granted") {
    showNotification(ctx.partnerName, body, ctx.partnerAvatar || undefined);
  }
}
