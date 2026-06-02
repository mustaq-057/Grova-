import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import type { ApiUser, ApiMessage } from "./api";
import { clearEncryption, loadEncryptionKey } from "./crypto";
import { api } from "./api";
import {
  hydrateNotifications,
  markAllReadLocal,
  setNotificationViewer,
  clearAllNotifications,
  syncChatBadgeFromServer,
} from "./notifications-feed";
import {
  alertIncomingChatMessage,
  alertIncomingChatReaction,
  alertIncomingChatLike,
  type ChatNotifyContext,
} from "./chat-notifications";
import { requestNotificationPermission } from "./notifications";
import { hydrateNotes } from "./notes";
import { applyQuickReactions } from "./quick-reactions";
import {
  applyCouplePrefs,
  applyChatTheme,
  type CouplePrefs,
  PARTNER_CHANGED,
} from "./couple-sync";
import { applyAppTheme, type AppThemeId } from "./app-theme";
import { clearClientMemory, purgeLegacyLocalStorage } from "./client-memory";
import { clearSession } from "./session";
import { bumpAvatarVersion } from "./avatar-display";

/** After this idle time, profile session ends — user picks profile + enters code again. */
export const PROFILE_INACTIVITY_MS = 60 * 60 * 1000;

type AuthContextType = {
  user: ApiUser | null;
  partner: ApiUser | null;
  chatThemeId: string;
  authReady: boolean;
  trustedDevice: boolean;
  setUser: (u: ApiUser | null) => void;
  refreshProfiles: () => Promise<void>;
  refreshCouplePrefs: () => Promise<void>;
  updateChatTheme: (themeId: string) => Promise<void>;
  logout: () => void;
  signOutEverywhere: () => void;
  lockProfileSession: () => void;
  refreshTrustedDevice: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<ApiUser | null>(null);
  const [partner, setPartner] = useState<ApiUser | null>(null);
  const [chatThemeId, setChatThemeId] = useState("default");
  const [authReady, setAuthReady] = useState(false);
  const [trustedDevice, setTrustedDevice] = useState(false);
  const userRef = useRef(user);
  userRef.current = user;
  const partnerRef = useRef(partner);
  partnerRef.current = partner;

  const refreshTrustedDevice = useCallback(async () => {
    const ok = await api.validatePrimarySession();
    setTrustedDevice(ok);
    return ok;
  }, []);

  const setUser = useCallback((u: ApiUser | null) => {
    setUserState(u);
    if (!u) {
      setPartner(null);
      setNotificationViewer(null);
    } else {
      setNotificationViewer(u.id, u.name);
    }
  }, []);

  const applyPrefs = useCallback((prefs: CouplePrefs) => {
    applyCouplePrefs(prefs);
    setChatThemeId(prefs.chatTheme || "default");
    if (prefs.appTheme) applyAppTheme(prefs.appTheme as AppThemeId);
    if (prefs.quickEmojis?.length) applyQuickReactions(prefs.quickEmojis);
  }, []);

  const refreshCouplePrefs = useCallback(async () => {
    const prefs = await api.getCouplePrefs();
    applyPrefs(prefs);
  }, [applyPrefs]);

  const updateChatTheme = useCallback(
    async (themeId: string) => {
      setChatThemeId(themeId);
      applyChatTheme(themeId);
      const prefs = await api.updateCouplePrefs({ chatTheme: themeId });
      applyPrefs(prefs);
    },
    [applyPrefs],
  );

  const refreshProfiles = useCallback(async () => {
    const current = userRef.current;
    if (!current) return;
    const users = await api.getUsers();
    const me = users.find((u) => u.id === current.id);
    const p = users.find((u) => u.id !== current.id);
    if (me) {
      if (me.avatar !== userRef.current?.avatar) bumpAvatarVersion(me.id);
      setUser(me);
    }
    if (p) {
      if (p.avatar !== partnerRef.current?.avatar) bumpAvatarVersion(p.id);
      setPartner(p);
      window.dispatchEvent(new CustomEvent(PARTNER_CHANGED, { detail: p }));
    }
  }, [setUser]);

  /** End profile session only — next step is profile pick + code (email session kept). */
  const lockProfileSession = useCallback(() => {
    clearEncryption();
    void api.logout();
    clearSession();
    setUser(null);
    try {
      sessionStorage.removeItem("grova_e2e_key");
      localStorage.removeItem("grova_last_profile");
    } catch {
      /* ignore */
    }
  }, [setUser]);

  /** Logout: end profile session — trusted device keeps email; next login is profile + code only. */
  const logout = useCallback(() => {
    lockProfileSession();
    setNotificationViewer(null);
  }, [lockProfileSession]);

  /** New browser / forgot trust — requires email + password again. */
  const signOutEverywhere = useCallback(() => {
    clearEncryption();
    void api.revokeTrustedDevice().catch(() => {});
    void api.logout();
    clearSession();
    clearClientMemory();
    setTrustedDevice(false);
    setNotificationViewer(null);
    setUser(null);
    try {
      sessionStorage.removeItem("grova_e2e_key");
      localStorage.removeItem("grova_last_profile");
    } catch {
      /* ignore */
    }
  }, [setUser]);

  useEffect(() => {
    let cancelled = false;
    purgeLegacyLocalStorage();
    try {
      localStorage.removeItem("grova_primary_token");
    } catch {
      /* ignore */
    }

    (async () => {
      const trusted = await api.validatePrimarySession();
      if (cancelled) return;
      setTrustedDevice(trusted);
      clearSession();
      if (!cancelled) setAuthReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (user) loadEncryptionKey();
  }, [user]);

  useEffect(() => {
    if (!user || !authReady) return;

    let mounted = true;
    let es: EventSource | null = null;

    const init = async () => {
      setNotificationViewer(user.id, user.name);
      await clearAllNotifications();
      await hydrateNotifications();
      await hydrateNotes();
      try {
        const prefs = await api.getCouplePrefs();
        if (mounted) applyPrefs(prefs);
      } catch {
        /* ignore */
      }
      await refreshProfiles();
      await syncChatBadgeFromServer();
      void requestNotificationPermission();
    };
    init();

    es = new EventSource(`/api/sse?userId=${user.id}`, { withCredentials: true });

    es.addEventListener("profile-updated", (e) => {
      try {
        const d = JSON.parse((e as MessageEvent).data) as ApiUser & { userId: string };
        const id = d.userId || d.id;
        if (d.avatar) bumpAvatarVersion(id);
        if (id === userRef.current?.id) {
          setUser({
            ...userRef.current!,
            ...(d.name != null && d.name !== "" ? { name: d.name } : {}),
            ...(d.bio != null ? { bio: d.bio } : {}),
            ...(d.avatar != null ? { avatar: d.avatar } : {}),
            ...(d.username != null && d.username !== "" ? { username: d.username } : {}),
          });
          if (d.name) setNotificationViewer(id, d.name);
        } else {
          const p: ApiUser = {
            id: id as "me" | "wife",
            username: d.username ?? partnerRef.current?.username ?? (id === "wife" ? "sara" : "mustaq"),
            name: d.name ?? partnerRef.current?.name ?? (id === "wife" ? "Sara" : "Mustaq"),
            bio: d.bio ?? partnerRef.current?.bio ?? "",
            avatar: d.avatar ?? partnerRef.current?.avatar ?? "",
          };
          setPartner(p);
          window.dispatchEvent(new CustomEvent(PARTNER_CHANGED, { detail: p }));
        }
      } catch {
        refreshProfiles();
      }
    });

    es.addEventListener("prefs-updated", (e) => {
      try {
        applyPrefs(JSON.parse((e as MessageEvent).data) as CouplePrefs);
      } catch {
        refreshCouplePrefs();
      }
    });

    es.addEventListener("note-updated", () => {
      hydrateNotes();
    });

    const chatNotifyCtx = (): ChatNotifyContext | null => {
      const me = userRef.current?.id;
      const p = partnerRef.current;
      if (!me) return null;
      const partnerId = me === "me" ? "wife" : "me";
      return {
        myId: me,
        partnerId,
        partnerName: p?.name ?? (partnerId === "wife" ? "Sara" : "Mustaq"),
        partnerAvatar: p?.avatar ?? "",
      };
    };

    es.addEventListener("new-message", (e) => {
      void (async () => {
        try {
          const msg = JSON.parse((e as MessageEvent).data) as ApiMessage;
          const ctx = chatNotifyCtx();
          if (!ctx || msg.senderId !== ctx.partnerId) return;
          window.dispatchEvent(new CustomEvent("grova-partner-message", { detail: msg }));
          await alertIncomingChatMessage(msg, ctx);
        } catch {
          /* ignore */
        }
      })();
    });

    es.addEventListener("message-reaction", (e) => {
      try {
        const d = JSON.parse((e as MessageEvent).data) as {
          reactions: { emoji: string; userId: string }[];
          byUserId?: string;
        };
        const ctx = chatNotifyCtx();
        if (!ctx || d.byUserId !== ctx.partnerId) return;
        const emoji = d.reactions.find((r) => r.userId === ctx.partnerId)?.emoji;
        if (emoji) alertIncomingChatReaction(emoji, ctx);
      } catch {
        /* ignore */
      }
    });

    es.addEventListener("message-liked", (e) => {
      try {
        const msg = JSON.parse((e as MessageEvent).data) as ApiMessage & { likedBy?: string };
        const ctx = chatNotifyCtx();
        if (!ctx || msg.likedBy !== ctx.partnerId || msg.senderId !== ctx.myId || !msg.liked) return;
        alertIncomingChatLike(ctx);
      } catch {
        /* ignore */
      }
    });

    es.addEventListener("activity-added", () => {
      if (userRef.current) setNotificationViewer(userRef.current.id, userRef.current.name);
      hydrateNotifications();
    });

    es.addEventListener("activity-read-all", () => {
      markAllReadLocal();
    });

    const poll = setInterval(() => {
      refreshProfiles();
      refreshCouplePrefs();
      if (!window.location.pathname.includes("/chat")) {
        void syncChatBadgeFromServer();
      }
    }, 30_000);

    return () => {
      mounted = false;
      es?.close();
      clearInterval(poll);
    };
  }, [user?.id, authReady, refreshProfiles, refreshCouplePrefs, applyPrefs, setUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        partner,
        chatThemeId,
        authReady,
        trustedDevice,
        setUser,
        refreshProfiles,
        refreshCouplePrefs,
        updateChatTheme,
        logout,
        signOutEverywhere,
        lockProfileSession,
        refreshTrustedDevice,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
