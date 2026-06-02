import { memo, useState, useEffect, useMemo } from "react";
import { defaultAvatar } from "@/lib/avatars";
import { avatarSrc } from "@/lib/avatar-display";

type Props = {
  src?: string;
  userId: string;
  alt: string;
  className?: string;
};

function resolveAvatarUrl(src: string | undefined, userId: string, failed: boolean): string {
  const fallback = defaultAvatar(userId);
  if (failed) return fallback;
  const raw = src?.trim();
  if (!raw) return fallback;
  if (raw.startsWith("data:image/")) return raw;
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return avatarSrc(raw, userId) || fallback;
  }
  if (raw.startsWith("/")) {
    const absolute = `${window.location.origin}${raw}`;
    return avatarSrc(absolute, userId) || fallback;
  }
  return fallback;
}

export const AvatarImage = memo(function AvatarImage({ src, userId, alt, className }: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src, userId]);

  const displaySrc = useMemo(() => resolveAvatarUrl(src, userId, failed), [src, userId, failed]);

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
});
