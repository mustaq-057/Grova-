import { memo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  APP_THEME_CHANGED,
  getPhotoScrimGradient,
  getStoredDarkMode,
  getThemeBackgroundOpacity,
  getThemeBackgroundUrl,
  themeUsesPhotoScrim,
  type AppThemeId,
} from "@/lib/app-theme";

type Props = { themeId: AppThemeId };

/** Full-screen themed photo behind app chrome — soft, never hides UI. */
export const ThemeBackgroundOverlay = memo(function ThemeBackgroundOverlay({ themeId }: Props) {
  const url = getThemeBackgroundUrl(themeId);
  const [hidden, setHidden] = useState(false);
  const [dark, setDark] = useState(() => getStoredDarkMode());

  useEffect(() => {
    const sync = () => setDark(getStoredDarkMode());
    sync();
    window.addEventListener(APP_THEME_CHANGED, sync);
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      window.removeEventListener(APP_THEME_CHANGED, sync);
      obs.disconnect();
    };
  }, []);

  if (!url || hidden) return null;

  const opacity = getThemeBackgroundOpacity(themeId);
  const scrim = themeUsesPhotoScrim(themeId);

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden
      style={{
        backgroundImage: `url(${url})`,
        backgroundSize: themeId === "floura" ? "100% 100%" : "cover",
        backgroundPosition: "center",
        opacity,
        filter: "brightness(0.9) saturate(1.05)",
      }}
    >
      <img src={url} alt="" className="hidden" onError={() => setHidden(true)} />
      {scrim ? (
        <div
          className="absolute inset-0"
          style={{ background: getPhotoScrimGradient(themeId, dark) }}
        />
      ) : null}
    </div>,
    document.body,
  );
});
