import { useState, useEffect } from "react";
import { getCachedChatTheme, CHAT_THEME_CHANGED } from "@/lib/couple-sync";
import { THEMES } from "@/lib/themes";
import { getStoredAppTheme, APP_THEME_CHANGED } from "@/lib/app-theme";

export function useChatTheme() {
  const [themeId, setThemeId] = useState(getCachedChatTheme);
  const [appTheme, setAppTheme] = useState(getStoredAppTheme);

  useEffect(() => {
    const handler = (e: CustomEvent<string>) => setThemeId(e.detail);
    window.addEventListener(CHAT_THEME_CHANGED as any, handler as any);
    
    const appHandler = () => setAppTheme(getStoredAppTheme());
    window.addEventListener(APP_THEME_CHANGED as any, appHandler);
    
    return () => {
      window.removeEventListener(CHAT_THEME_CHANGED as any, handler as any);
      window.removeEventListener(APP_THEME_CHANGED as any, appHandler);
    };
  }, []);

  let theme = THEMES.find((t) => t.id === themeId) || THEMES.find(t => t.id === "default") || THEMES[0];
  
  if (appTheme === "floura") {
    theme = {
      ...theme,
      id: "floura-override",
      bubbleColor: "#F8A8C1",
      bubbleBorder: "#F8A8C1",
    };
  }

  return { themeId, theme };
}
