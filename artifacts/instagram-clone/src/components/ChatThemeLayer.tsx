import { memo } from "react";
import { isPremiumAnimatedTheme, type AppThemeId } from "@/lib/app-theme";

type Props = { variant: AppThemeId };

/** In-chat premium theme layer — single pass, no global duplicate. */
export const ChatThemeLayer = memo(function ChatThemeLayer({ variant }: Props) {
  if (!isPremiumAnimatedTheme(variant)) return null;

  return (
    <div
      className={`chat-theme-layer pointer-events-none absolute inset-0 z-0 overflow-hidden premium-scene premium-scene--${variant}`}
      aria-hidden
    >
      <div className="premium-scene-base" />
      <div className="premium-ribbon premium-ribbon-1" />
      <div className="premium-ribbon premium-ribbon-2" />
      <div className="premium-particles" />
      {variant === "moonlit-blossom" && (
        <>
          <div className="premium-moon" aria-hidden />
          <div className="premium-bees" aria-hidden>
            <span className="premium-bee premium-bee-1">🐝</span>
            <span className="premium-bee premium-bee-2">🐝</span>
            <span className="premium-bee premium-bee-3">🐝</span>
            <span className="premium-bee premium-bee-4">🐝</span>
            <span className="premium-bee premium-bee-5">🐝</span>
            <span className="premium-bee premium-bee-6">🐝</span>
            <span className="premium-bee premium-bee-7">🐝</span>
            <span className="premium-bee premium-bee-8">🐝</span>
          </div>
        </>
      )}
      <div className="chat-theme-scrim" />
    </div>
  );
});
