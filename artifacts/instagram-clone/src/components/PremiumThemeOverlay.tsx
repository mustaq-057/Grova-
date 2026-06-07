import { memo } from "react";
import { isPremiumAnimatedTheme, type AppThemeId } from "@/lib/app-theme";

type Props = { themeId: AppThemeId };

/** Full-screen animated premium themes — one lightweight layer per variant. */
export const PremiumThemeOverlay = memo(function PremiumThemeOverlay({ themeId }: Props) {
  if (!isPremiumAnimatedTheme(themeId)) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden premium-scene premium-scene--${themeId}`}
      aria-hidden
    >
      <div className="premium-scene-base" />
      <div className="premium-ribbon premium-ribbon-1" />
      <div className="premium-ribbon premium-ribbon-2" />
      <div className="premium-ribbon premium-ribbon-3" />
      <div className="premium-particles" />
      <div className="premium-scene-scrim" />
    </div>
  );
});
