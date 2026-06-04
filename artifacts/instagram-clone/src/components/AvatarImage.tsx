import { memo, useState, useEffect, useMemo } from "react";
import { defaultAvatar } from "@/lib/avatars";
import { avatarSrc } from "@/lib/avatar-display";
import { isStockAvatar } from "@/lib/avatar-utils";

type Props = {
  src?: string;
  userId: string;
  alt: string;
  className?: string;
};

function resolveAvatarUrl(src: string | undefined, userId: string, failed: boolean, retry: number): string {
  const stock = defaultAvatar(userId);
  const raw = src?.trim();
  if (!raw) return stock;

  if (raw.startsWith("data:image/")) return raw;

  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("/")) {
    const absolute = raw.startsWith("/") ? `${window.location.origin}${raw}` : raw;
    if (failed) {
      // Never swap a failed custom upload for the stock Unsplash photo.
      if (!isStockAvatar(absolute, userId)) {
        if (retry < 1) {
          const sep = absolute.includes("?") ? "&" : "?";
          return `${absolute}${sep}retry=${retry + 1}`;
        }
        return absolute;
      }
      return stock;
    }
    return avatarSrc(absolute, userId) || stock;
  }

  return stock;
}

export const AvatarImage = memo(function AvatarImage({ src, userId, alt, className }: Props) {
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    setFailed(false);
    setRetry(0);
  }, [src, userId]);

  const displaySrc = useMemo(
    () => resolveAvatarUrl(src, userId, failed, retry),
    [src, userId, failed, retry],
  );

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        if (!failed) {
          setFailed(true);
          setRetry((r) => r + 1);
        }
      }}
    />
  );
});
