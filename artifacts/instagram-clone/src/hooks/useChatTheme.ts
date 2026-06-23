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

  if (appTheme === "mint") {
    theme = {
      ...theme,
      id: "mint",
      bubbleColor: "#354A21",
      bubbleBorder: "#354A21",
      textColor: "#EBE2CD",
      partnerTextColor: "#EBE2CD"
    };
  }

  if (appTheme === "library") {
    theme = {
      ...theme,
      id: "library",
      bubbleColor: "#3b2a22", // Espresso Brown
      bubbleBorder: "#3b2a22",
      textColor: "#f8f1e7", // Cream
      partnerTextColor: "#f8f1e7"
    };
  }

  if (appTheme === "vintage-polaroid") {
    theme = {
      ...theme,
      id: "vintage-polaroid",
      bubbleColor: "#9c3b3b", // Faded polaroid red
      bubbleBorder: "#9c3b3b",
      textColor: "#f4f1ea", // Paper white
      partnerTextColor: "#f4f1ea"
    };
  }

  if (appTheme === "sara-lavender") {
    theme = {
      ...theme,
      id: "sara-lavender",
      bubbleColor: "#9b72aa", // Soft lavender
      bubbleBorder: "#8e659b",
      textColor: "#f8f4fa", // Whiteish-pink text
      partnerTextColor: "#f8f4fa"
    };
  }

  return { themeId, theme };
}
