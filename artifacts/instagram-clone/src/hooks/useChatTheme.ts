import { useState, useEffect } from "react";
import { getCachedChatTheme, CHAT_THEME_CHANGED } from "@/lib/couple-sync";
import { THEMES } from "@/lib/themes";

export function useChatTheme() {
  const [themeId, setThemeId] = useState(getCachedChatTheme);

  useEffect(() => {
    const handler = (e: CustomEvent<string>) => setThemeId(e.detail);
    window.addEventListener(CHAT_THEME_CHANGED as any, handler as any);
    return () => window.removeEventListener(CHAT_THEME_CHANGED as any, handler as any);
  }, []);

  const theme = THEMES.find((t) => t.id === themeId) || THEMES.find(t => t.id === "default") || THEMES[0];
  return { themeId, theme };
}
