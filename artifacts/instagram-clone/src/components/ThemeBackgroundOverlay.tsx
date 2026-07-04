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

type Props = { themeId: AppThemeId; isChat?: boolean };

/** Full-screen themed photo behind app chrome — soft, never hides UI. */
export const ThemeBackgroundOverlay = memo(function ThemeBackgroundOverlay({ themeId, isChat }: Props) {
  const defaultUrl = getThemeBackgroundUrl(themeId);
  let url = (themeId === "mint" && isChat) ? "/mint-chat.jpg" : defaultUrl;
  if (themeId === "tangled" && !isChat) {
    url = null; // Solid dark green background for Tangled home screen
  }
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

  useEffect(() => {
    setHidden(false);
  }, [themeId]);

  if (!url || hidden) return null;

  const opacity = (themeId === "mint" && isChat) ? 0.8 : getThemeBackgroundOpacity(themeId);
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
