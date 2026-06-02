import type { ApiMessage } from "./api";
import { normalizeMessages, messagePreview } from "./message-utils";
import { bumpUnreadChatBadge } from "./notifications-feed";
import { showNotification } from "./notifications";
import { areNotificationsEnabled } from "./couple-sync";
import { toast } from "sonner";

export type ChatNotifyContext = {
  myId: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
};

function onChatRoute(): boolean {
  return window.location.pathname.includes("/chat");
}

function shouldSurfaceAlert(): boolean {
  if (!areNotificationsEnabled()) return false;
  if (document.visibilityState === "hidden") return true;
  return !onChatRoute();
}

function bumpIfAway(): void {
  if (!onChatRoute() || document.visibilityState === "hidden") {
    bumpUnreadChatBadge();
  }
}

/** New message, gif, photo, video, file, reply, etc. */
export async function alertIncomingChatMessage(raw: ApiMessage, ctx: ChatNotifyContext): Promise<void> {
  if (raw.senderId !== ctx.partnerId) return;

  const [msg] = await normalizeMessages([raw]);
  bumpIfAway();

  if (!shouldSurfaceAlert()) return;

  const preview = messagePreview(msg);
  showNotification(ctx.partnerName, preview, ctx.partnerAvatar || undefined);

  if (document.visibilityState === "visible" && !onChatRoute()) {
    toast.message(ctx.partnerName, { description: preview, duration: 4000 });
  }
}

/** Heart / like on your message */
export function alertIncomingChatLike(ctx: Pick<ChatNotifyContext, "partnerName" | "partnerAvatar">): void {
  bumpIfAway();
  if (!shouldSurfaceAlert()) return;

  const body = "liked your message";
  showNotification(ctx.partnerName, body, ctx.partnerAvatar || undefined);

  if (document.visibilityState === "visible" && !onChatRoute()) {
    toast.message(ctx.partnerName, { description: body, duration: 3500 });
  }
}

/** Emoji reaction on your message */
export function alertIncomingChatReaction(
  emoji: string,
  ctx: Pick<ChatNotifyContext, "partnerName" | "partnerAvatar">,
): void {
  bumpIfAway();
  if (!shouldSurfaceAlert()) return;

  const body = `reacted ${emoji} to your message`;
  showNotification(ctx.partnerName, body, ctx.partnerAvatar || undefined);

  if (document.visibilityState === "visible" && !onChatRoute()) {
    toast.message(ctx.partnerName, { description: body, duration: 3500 });
  }
}
