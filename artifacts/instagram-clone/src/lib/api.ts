import { getAuthHeaders, saveSession, clearSession, getRefreshToken, setDeviceId } from "./session";
import type { CouplePrefs } from "./types";

const BASE = "/api";
const FETCH_TIMEOUT_MS = 45_000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function mergeAbortSignal(userSignal: AbortSignal | null | undefined, timeoutMs: number): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  const timeoutCtrl = new AbortController();
  const timer = setTimeout(() => timeoutCtrl.abort(), timeoutMs);
  if (!userSignal) {
    return { signal: timeoutCtrl.signal, cleanup: () => clearTimeout(timer) };
  }
  if (userSignal.aborted) {
    clearTimeout(timer);
    return { signal: userSignal, cleanup: () => {} };
  }
  const merged = new AbortController();
  const onAbort = () => merged.abort();
  userSignal.addEventListener("abort", onAbort);
  timeoutCtrl.signal.addEventListener("abort", onAbort);
  return {
    signal: merged.signal,
    cleanup: () => {
      clearTimeout(timer);
      userSignal.removeEventListener("abort", onAbort);
      timeoutCtrl.signal.removeEventListener("abort", onAbort);
    },
  };
}

let refreshInFlight: Promise<boolean> | null = null;

export async function tryRefreshSession(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { token: string; csrfToken: string; refreshToken: string };
      saveSession(data.token, data.csrfToken, data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function apiFetch<T = unknown>(path: string, options?: RequestInit, attempt = 0): Promise<T> {
  const method = options?.method ?? "GET";
  const isRead = method === "GET" || method === "HEAD";
  const maxAttempts = isRead ? 4 : 2;

  const { signal, cleanup } = mergeAbortSignal(options?.signal ?? undefined, FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      signal,
      credentials: "include",
      cache: "no-store",
      headers: {
        ...getAuthHeaders(),
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        ...options?.headers,
      },
    });

    if (res.status === 401 && attempt === 0 && !path.includes("/auth/login")) {
      const refreshed = await tryRefreshSession();
      if (refreshed) return apiFetch<T>(path, options, attempt + 1);
    }

    if (!res.ok) {
      const retryable = res.status >= 502 && res.status <= 504;
      if (retryable && isRead && attempt < maxAttempts - 1) {
        await sleep(600 * (attempt + 1));
        return apiFetch<T>(path, options, attempt + 1);
      }
      const err = await res.json().catch(() => ({ error: "Request failed" })) as {
        error?: string;
        attemptsRemaining?: number;
      };
      const attemptsSuffix =
        typeof err.attemptsRemaining === "number"
          ? ` Attempts remaining: ${err.attemptsRemaining}.`
          : "";
      throw new Error(`${err.error || "Request failed"}${attemptsSuffix}`);
    }

    return res.json() as Promise<T>;
  } catch (err) {
    const isNetwork =
      err instanceof TypeError ||
      (err instanceof DOMException && err.name === "AbortError") ||
      (err instanceof Error && /fetch|network|failed|abort/i.test(err.message));
    if (isNetwork && isRead && attempt < maxAttempts - 1) {
      await sleep(800 * (attempt + 1));
      return apiFetch<T>(path, options, attempt + 1);
    }
    if (isNetwork) {
      throw new Error("Failed to fetch — is the API running? Use pnpm dev:grova and open http://localhost:5000");
    }
    throw err;
  } finally {
    cleanup();
  }
}

export type ApiUser = {
  id: "me" | "wife";
  username: string;
  name: string;
  bio: string;
  avatar: string;
};

export type ApiMessage = {
  id: string;
  senderId: string;
  text?: string;
  type: "text" | "audio" | "heart" | "sticker" | "gif" | "image" | "video" | "file" | "location";
  audioData?: string;
  gifUrl?: string;
  imageData?: string;
  imageUrl?: string;
  fileData?: string;
  fileType?: string;
  fileSize?: number;
  location?: { lat: number; lng: number };
  timestamp: string;
  liked: boolean;
  likedBy?: string;
  deleted?: boolean;
  deletedAt?: string;
  variant?: "cute" | "default";
  companionSticker?: string;
  encrypted?: boolean;
  read?: boolean;
  readAt?: string;
  seenByPartner?: boolean;
  reaction?: string;
  pinned?: boolean;
  threadId?: string;
  threadParentId?: string;
  threadReplyCount?: number;
  mediaViewMode?: "keep" | "once" | "twice";
  mediaOpenCount?: number;
  mediaOpenedAt?: string;
};

export type ApiDua = {
  id: string;
  arabic: string;
  translation: string;
  author: string;
  timestamp: string;
};

export type ApiEvent = {
  id: string;
  title: string;
  date: string;
  time?: string;
  description?: string;
  type: "date" | "anniversary" | "reminder";
  author: string;
  timestamp: string;
};

export type ApiCheckin = {
  id: string;
  question: string;
  answer: string;
  mood: "happy" | "neutral" | "sad";
  author: string;
  timestamp: string;
};

export type ApiTask = {
  id: string;
  title: string;
  assignedTo: "me" | "wife" | "both";
  priority: "low" | "medium" | "high";
  completed: boolean;
  author: string;
  timestamp: string;
};

export type ApiMilestone = {
  id: string;
  title: string;
  date: string;
  description?: string;
  type: "anniversary" | "first_date" | "special_moment" | "achievement" | "travel" | "memory";
  author: string;
  timestamp: string;
};

export type ApiSecretNote = {
  id: string;
  content: string;
  author: string;
  timestamp: string;
};

export type ApiPost = {
  id: string;
  authorId: string;
  mediaUrl: string;
  caption: string;
  location: string;
  aspectRatio: string;
  createdAt: string;
  likeCount?: number;
  likedByMe?: boolean;
  commentCount?: number;
  myReaction?: string;
  reactionCounts?: Record<string, number>;
};

export type ApiPostComment = {
  id: string;
  postId: string;
  authorId: string;
  text: string;
  createdAt: string;
};

export type ApiStory = {
  id: string;
  authorId: string;
  mediaUrl: string;
  kind: "story" | "reel";
  createdAt: string;
  expiresAt: string;
};

export type ScheduledMessage = {
  id: string;
  senderId: string;
  text?: string;
  type: string;
  scheduledAt: string;
  createdAt: string;
};

export type PresenceMap = Record<string, number>;

type LoginResponse = {
  token: string;
  csrfToken: string;
  refreshToken: string;
  deviceId?: string;
  encryptionKey?: string;
  user: ApiUser;
};

type SessionResponse = {
  user: ApiUser;
  partner: ApiUser | null;
};

export type AppNotification = {
  id: string;
  type: "like" | "comment" | "story" | "dua" | "call" | "location" | "message";
  actorId?: string;
  fromName: string;
  text: string;
  timestamp: string;
  read: boolean;
};

export type { CouplePrefs } from "./types";

export const api = {
  primaryLogin: async (email: string, password: string): Promise<void> => {
    await apiFetch("/auth/primary-login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  validatePrimarySession: async (): Promise<boolean> => {
    try {
      await apiFetch<{ ok: boolean }>("/auth/primary-session");
      return true;
    } catch {
      return false;
    }
  },

  revokeTrustedDevice: () =>
    apiFetch<{ success: boolean }>("/auth/revoke-trust", { method: "POST", body: JSON.stringify({}) }),

  login: async (userId: string, code: string): Promise<{ user: ApiUser; encryptionKey: string }> => {
    const data = (await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ userId, code }),
    })) as LoginResponse;
    if (data.token) saveSession(data.token, data.csrfToken, data.refreshToken);
    if (data.deviceId) setDeviceId(data.deviceId);
    return { user: data.user, encryptionKey: data.encryptionKey || code };
  },

  restoreSession: () => apiFetch<SessionResponse>("/auth/session"),

  logout: async () => {
    try {
      await apiFetch<{ success: boolean }>("/auth/logout", { method: "POST", body: JSON.stringify({}) });
    } catch {
      /* noop */
    } finally {
      clearSession();
    }
  },

  unlock: (code: string) =>
    apiFetch<{ ok: boolean }>("/auth/unlock", { method: "POST", body: JSON.stringify({ code }) }),

  getLoginProfiles: () =>
    apiFetch<{ id: string; name: string; avatar: string }[]>("/auth/profiles"),

  updateCoupleCode: (currentCode: string, newCode: string) =>
    apiFetch<{ success: boolean }>("/auth/couple-code", { method: "PUT", body: JSON.stringify({ currentCode, newCode }) }),

  getUsers: () => apiFetch<ApiUser[]>("/users"),

  updateProfile: (id: string, data: { name?: string; bio?: string; avatar?: string }) =>
    apiFetch<ApiUser>(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  getMessages: (params?: { offset?: number; cursor?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.offset != null && params.offset > 0) q.set("offset", String(params.offset));
    if (params?.cursor) q.set("cursor", params.cursor);
    if (params?.limit != null && params.limit > 0) q.set("limit", String(params.limit));
    const suffix = q.toString() ? `?${q.toString()}` : "";
    return apiFetch<{
      messages: ApiMessage[];
      pagination: { total: number; limit: number; offset: number; hasMore: boolean; nextCursor: string | null };
    }>(`/messages${suffix}`);
  },

  getUnreadChatCount: (since?: string) => {
    const q = since ? `?since=${encodeURIComponent(since)}` : "";
    return apiFetch<{ count: number }>(`/messages/unread-count${q}`);
  },

  sendMessage: (msg: Partial<ApiMessage>) =>
    apiFetch<ApiMessage>("/messages", { method: "POST", body: JSON.stringify(msg) }),

  openMediaMessage: (id: string) =>
    apiFetch<{ ok: true; url: string; kind: "image" | "video"; mediaOpenCount: number; mediaOpenedAt?: string }>(
      `/messages/${encodeURIComponent(id)}/open-media`,
      { method: "POST" },
    ),

  postMessage: (msg: Partial<ApiMessage>) =>
    apiFetch<ApiMessage>("/messages", { method: "POST", body: JSON.stringify(msg) }),

  likeMessage: (id: string) =>
    apiFetch<ApiMessage>(`/messages/${id}/like`, { method: "PATCH" }),

  deleteMessage: (id: string) =>
    apiFetch<ApiMessage>(`/messages/${encodeURIComponent(id)}`, { method: "DELETE" }),

  editMessage: (id: string, text: string, userId: string) =>
    apiFetch<{ success: boolean; text: string }>(`/messages/${id}/edit`, { method: "PATCH", body: JSON.stringify({ text, userId }) }),

  reactMessage: (messageId: string, userId: string, emoji: string) =>
    apiFetch<{ success: boolean; reactions: { emoji: string; userId: string }[] }>(
      "/reactions",
      { method: "POST", body: JSON.stringify({ messageId, userId, emoji }) },
    ),

  markMessageRead: (messageId: string, userId: string) =>
    apiFetch<{ success: boolean }>("/read-receipts", {
      method: "POST",
      body: JSON.stringify({ messageId, userId }),
    }),

  markMessagesReadBatch: (messageIds: string[], userId: string) =>
    apiFetch<{ success: boolean; marked: number; readAt: string }>("/read-receipts/batch", {
      method: "POST",
      body: JSON.stringify({ messageIds, userId }),
    }),

  /** Hide all chat history for this user only; partner's messages stay. */
  clearChatForMe: () =>
    apiFetch<{ success: boolean; clearedAt: string }>("/hidden-messages/clear-chat", {
      method: "POST",
      body: JSON.stringify({}),
    }),

  sendCallSignal: (data: {
    type: "offer" | "answer" | "ice" | "end" | "reject";
    senderId: string;
    [k: string]: unknown;
  }) => apiFetch<{ ok: boolean }>("/call/signal", { method: "POST", body: JSON.stringify(data) }),

  getCallRtcConfig: () =>
    apiFetch<{ iceServers: RTCIceServer[] }>("/call/rtc-config"),

  heartbeat: (userId: string) =>
    apiFetch<{ success: boolean }>("/presence/heartbeat", { method: "POST", body: JSON.stringify({ userId }) }),

  getPresence: () => apiFetch<PresenceMap>("/presence"),

  getDuas: () => apiFetch<ApiDua[]>("/duas"),

  addDua: (dua: { arabic: string; translation?: string; author: string }) =>
    apiFetch<ApiDua>("/duas", { method: "POST", body: JSON.stringify(dua) }),

  deleteDua: (id: string) => apiFetch<{ success: boolean }>(`/duas/${id}`, { method: "DELETE" }),

  getEvents: () => apiFetch<ApiEvent[]>("/calendar/events"),

  addEvent: (event: { title: string; date: string; time?: string; description?: string; type: "date" | "anniversary" | "reminder"; author: string }) =>
    apiFetch<ApiEvent>("/calendar/events", { method: "POST", body: JSON.stringify(event) }),

  updateEvent: (id: string, data: { title?: string; date?: string; time?: string; description?: string; type?: "date" | "anniversary" | "reminder" }) =>
    apiFetch<ApiEvent>(`/calendar/events/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteEvent: (id: string) => apiFetch<{ success: boolean }>(`/calendar/events/${id}`, { method: "DELETE" }),

  getCheckins: () => apiFetch<ApiCheckin[]>("/checkins"),

  addCheckin: (checkin: { question: string; answer: string; mood: "happy" | "neutral" | "sad"; author: string }) =>
    apiFetch<ApiCheckin>("/checkins", { method: "POST", body: JSON.stringify(checkin) }),

  deleteCheckin: (id: string) => apiFetch<{ success: boolean }>(`/checkins/${id}`, { method: "DELETE" }),

  getTasks: () => apiFetch<ApiTask[]>("/tasks"),

  addTask: (task: { title: string; assignedTo: "me" | "wife" | "both"; priority: "low" | "medium" | "high"; author: string }) =>
    apiFetch<ApiTask>("/tasks", { method: "POST", body: JSON.stringify(task) }),

  updateTask: (id: string, data: { completed?: boolean }) =>
    apiFetch<ApiTask>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteTask: (id: string) => apiFetch<{ success: boolean }>(`/tasks/${id}`, { method: "DELETE" }),

  getMilestones: () => apiFetch<ApiMilestone[]>("/milestones"),

  addMilestone: (milestone: { title: string; date: string; description?: string; type: "anniversary" | "first_date" | "special_moment" | "achievement" | "travel" | "memory"; author: string }) =>
    apiFetch<ApiMilestone>("/milestones", { method: "POST", body: JSON.stringify(milestone) }),

  deleteMilestone: (id: string) => apiFetch<{ success: boolean }>(`/milestones/${id}`, { method: "DELETE" }),

  getSecretNotes: () => apiFetch<ApiSecretNote[]>("/secret-notes"),

  addSecretNote: (note: { content: string; author: string }) =>
    apiFetch<ApiSecretNote>("/secret-notes", { method: "POST", body: JSON.stringify(note) }),

  deleteSecretNote: (id: string) => apiFetch<{ success: boolean }>(`/secret-notes/${id}`, { method: "DELETE" }),

  downloadChat: async (userId: string) => {
    const res = await fetch(`${BASE}/export/${userId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Export failed");
    return res.json();
  },

  getCouplePrefs: () => apiFetch<CouplePrefs>("/couple/prefs"),

  updateCouplePrefs: (data: Partial<Pick<CouplePrefs, "chatTheme" | "appTheme" | "readReceipts" | "showPresence" | "quickEmojis">>) =>
    apiFetch<CouplePrefs>("/couple/prefs", { method: "PUT", body: JSON.stringify(data) }),

  getCoupleNotes: () => apiFetch<{ me: string; wife: string }>("/couple/notes"),

  updateCoupleNote: (text: string) =>
    apiFetch<{ me: string; wife: string }>("/couple/notes", { method: "PUT", body: JSON.stringify({ text }) }),

  getActivityFeed: () => apiFetch<{ notifications: AppNotification[] }>("/couple/activity"),

  postActivity: (data: { type: AppNotification["type"]; fromName: string; text: string }) =>
    apiFetch<{ success: boolean }>("/couple/activity", { method: "POST", body: JSON.stringify(data) }),

  markActivityReadAll: () =>
    apiFetch<{ success: boolean }>("/couple/activity/read-all", { method: "PUT" }),

  clearActivityFeed: () =>
    apiFetch<{ success: boolean }>("/couple/activity", { method: "DELETE" }),

  scheduleMessage: (data: {
    senderId: string;
    text?: string;
    type: string;
    scheduledAt: string;
    audioData?: string;
    gifUrl?: string;
    imageData?: string;
    variant?: string;
    companionSticker?: string;
  }) => apiFetch<{ success: boolean; id: string; scheduledAt: string }>("/schedule", { method: "POST", body: JSON.stringify(data) }),

  getScheduledMessages: (userId: string) =>
    apiFetch<ScheduledMessage[]>(`/schedule/${userId}`),

  deleteScheduledMessage: (id: string) =>
    apiFetch<{ success: boolean }>(`/schedule/${id}`, { method: "DELETE" }),

  uploadMedia: (data: string, contentType?: string) =>
    apiFetch<{ url: string; key: string }>("/media/upload", {
      method: "POST",
      body: JSON.stringify({ data, contentType }),
    }),

  getPosts: () => apiFetch<ApiPost[]>("/posts"),

  addPost: (post: { mediaUrl: string; caption?: string; location?: string; aspectRatio?: string }) =>
    apiFetch<ApiPost>("/posts", { method: "POST", body: JSON.stringify(post) }),

  deletePost: (id: string) => apiFetch<{ success: boolean }>(`/posts/${id}`, { method: "DELETE" }),

  reactToPost: (postId: string, emoji: string) =>
    apiFetch<ApiPost>(`/posts/${postId}/react`, { method: "POST", body: JSON.stringify({ emoji }) }),

  togglePostLike: (id: string) => apiFetch<ApiPost>(`/posts/${id}/like`, { method: "POST" }),

  getPostComments: (postId: string) => apiFetch<ApiPostComment[]>(`/posts/${postId}/comments`),

  addPostComment: (postId: string, text: string) =>
    apiFetch<ApiPostComment>(`/posts/${postId}/comments`, { method: "POST", body: JSON.stringify({ text }) }),

  getStories: () => apiFetch<ApiStory[]>("/stories"),

  addStory: (story: { mediaUrl: string; kind?: "story" | "reel" }) =>
    apiFetch<ApiStory>("/stories", { method: "POST", body: JSON.stringify(story) }),

  deleteStory: (id: string) => apiFetch<{ success: boolean }>(`/stories/${id}`, { method: "DELETE" }),

  pinMessage: (userId: string, messageId: string) =>
    apiFetch<{ success: boolean; pinnedAt: string }>("/pin", {
      method: "POST",
      body: JSON.stringify({ userId, messageId }),
    }),

  unpinMessage: (userId: string, messageId: string) =>
    apiFetch<{ success: boolean }>("/pin", {
      method: "DELETE",
      body: JSON.stringify({ userId, messageId }),
    }),

  getPinnedMessages: (userId: string) => apiFetch<ApiMessage[]>(`/pin/${userId}`),

  hideMessage: (userId: string, messageId: string) =>
    apiFetch<{ success: boolean }>("/hidden-messages", {
      method: "POST",
      body: JSON.stringify({ userId, messageId }),
    }),

  getHiddenMessageIds: (userId: string) =>
    apiFetch<{ messageIds: string[]; clearedAt?: string | null }>(`/hidden-messages/${userId}`),

  sendTyping: (userId: string, partnerId: string, typing: boolean) =>
    apiFetch<{ success: boolean }>("/typing", {
      method: "POST",
      body: JSON.stringify({ userId, partnerId, typing }),
    }),
};
