import { memo, useState } from "react";
import { createPortal } from "react-dom";
import {
  getThemeBackgroundUrl,
  getThemeBackgroundOpacity,
  themeUsesPhotoScrim,
  type AppThemeId,
} from "@/lib/app-theme";

type Props = { themeId: AppThemeId };

/** Full-screen themed photo behind app chrome. */
export const ThemeBackgroundOverlay = memo(function ThemeBackgroundOverlay({ themeId }: Props) {
  const url = getThemeBackgroundUrl(themeId);
  const [hidden, setHidden] = useState(false);
  if (!url || hidden) return null;

  const opacity = getThemeBackgroundOpacity(themeId);
  const scrim = themeUsesPhotoScrim(themeId);

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden
      style={{
        backgroundImage: `url(${url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        opacity,
        filter: themeId === "book-bouquet" ? "none" : "saturate(1.06)",
      }}
    >
      <img src={url} alt="" className="hidden" onError={() => setHidden(true)} />
      {scrim ? (
        <div
          className="absolute inset-0"
          style={{
            background:
              themeId === "sara-lavender"
                ? "linear-gradient(180deg, hsl(var(--background) / 0.12) 0%, hsl(var(--background) / 0.35) 100%)"
                : "linear-gradient(180deg, hsl(var(--background) / 0.55) 0%, hsl(var(--background) / 0.88) 55%, hsl(var(--background) / 0.95) 100%)",
          }}
        />
      ) : null}
    </div>,
    document.body,
  );
});
