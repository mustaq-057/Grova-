import { memo, useState } from "react";
import { createPortal } from "react-dom";
import { getThemeBackgroundUrl, type AppThemeId } from "@/lib/app-theme";

type Props = { themeId: AppThemeId };

/** Full-screen themed photo behind app chrome (subtle, readable UI on top). */
export const ThemeBackgroundOverlay = memo(function ThemeBackgroundOverlay({ themeId }: Props) {
  const url = getThemeBackgroundUrl(themeId);
  const [hidden, setHidden] = useState(false);
  if (!url || hidden) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden
      style={{
        backgroundImage: `url(${url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        opacity: 0.28,
        filter: "saturate(1.08)",
      }}
    >
      <img src={url} alt="" className="hidden" onError={() => setHidden(true)} />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, hsl(var(--background) / 0.55) 0%, hsl(var(--background) / 0.88) 55%, hsl(var(--background) / 0.95) 100%)",
        }}
      />
    </div>,
    document.body,
  );
});
