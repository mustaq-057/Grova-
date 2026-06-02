const avatarVersion = new Map<string, number>();

export function bumpAvatarVersion(userId: string): void {
  avatarVersion.set(userId, Date.now());
}

export function avatarSrc(url: string | undefined, userId: string): string {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  const v = avatarVersion.get(userId) ?? 0;
  if (!v) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${v}`;
}
