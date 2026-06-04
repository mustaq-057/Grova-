import { resolveAvatarDisplayUrl } from "./avatar-utils";

const avatarVersion = new Map<string, number>();

export function bumpAvatarVersion(userId: string): void {
  avatarVersion.set(userId, Date.now());
}

export function avatarSrc(url: string | undefined, userId: string): string {
  if (!url) return "";
  const v = avatarVersion.get(userId) ?? 0;
  return resolveAvatarDisplayUrl(url, userId, v || undefined);
}
