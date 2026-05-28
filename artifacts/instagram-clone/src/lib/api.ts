const BASE = "/api";

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error((err as { error: string }).error || "Request failed");
  }
  return res.json();
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
  type: "text" | "audio" | "heart" | "sticker" | "gif" | "image";
  audioData?: string;
  gifUrl?: string;
  imageData?: string;
  timestamp: string;
  liked: boolean;
};

export type ApiDua = {
  id: string;
  arabic: string;
  translation: string;
  author: string;
  timestamp: string;
};

export const api = {
  login: (userId: string, code: string): Promise<{ user: ApiUser }> =>
    apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ userId, code }) }),

  updateCoupleCode: (currentCode: string, newCode: string) =>
    apiFetch("/auth/couple-code", { method: "PUT", body: JSON.stringify({ currentCode, newCode }) }),

  getUsers: (): Promise<ApiUser[]> => apiFetch("/users"),

  updateProfile: (id: string, data: { name?: string; bio?: string }) =>
    apiFetch(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  getMessages: (): Promise<ApiMessage[]> => apiFetch("/messages"),

  sendMessage: (msg: Partial<ApiMessage>): Promise<ApiMessage> =>
    apiFetch("/messages", { method: "POST", body: JSON.stringify(msg) }),

  likeMessage: (id: string): Promise<ApiMessage> =>
    apiFetch(`/messages/${id}/like`, { method: "PATCH" }),

  deleteMessages: (): Promise<{ success: boolean }> =>
    apiFetch("/messages", { method: "DELETE" }),

  sendCallSignal: (data: {
    type: "offer" | "answer" | "ice" | "end" | "reject";
    senderId: string;
    [k: string]: unknown;
  }) => apiFetch("/call/signal", { method: "POST", body: JSON.stringify(data) }),

  getDuas: (): Promise<ApiDua[]> => apiFetch("/duas"),

  addDua: (dua: { arabic: string; translation?: string; author: string }): Promise<ApiDua> =>
    apiFetch("/duas", { method: "POST", body: JSON.stringify(dua) }),

  deleteDua: (id: string) => apiFetch(`/duas/${id}`, { method: "DELETE" }),
};
