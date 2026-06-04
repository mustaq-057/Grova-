import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { bootstrapAppearance } from "@/lib/couple-sync";
import { purgeLegacyLocalStorageOnce } from "@/lib/client-memory";

purgeLegacyLocalStorageOnce();
bootstrapAppearance();

// Dev: remove stale service workers (cached JS can break React hooks)
if (import.meta.env.DEV && "serviceWorker" in navigator) {
  void navigator.serviceWorker.getRegistrations().then((regs) => {
    for (const reg of regs) void reg.unregister();
  });
}

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  document.body.innerHTML =
    '<div style="padding:24px;font-family:system-ui;color:#111">Missing #root — rebuild the app.</div>';
} else {
  createRoot(rootEl).render(<App />);
}
