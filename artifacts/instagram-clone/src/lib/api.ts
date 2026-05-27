const BASE = "/api";

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export type ApiUser = {
  id: "me" | "wife";
  username: string;
  name: string;
  avatar: string;
};

export type ApiMessage = {
  id: string;
  senderId: string;
  text?: string;
  type: "text" | "audio" | "heart";
  audioData?: string;
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

  updateCoupleCode: (currentCode: string, newCode: string): Promise<{ success: boolean }> =>
    apiFetch("/auth/couple-code", { method: "PUT", body: JSON.stringify({ currentCode, newCode }) }),

  getMessages: (since?: string): Promise<ApiMessage[]> =>
    apiFetch(since ? `/messages?since=${encodeURIComponent(since)}` : "/messages"),

  sendMessage: (msg: { senderId: string; text?: string; type?: string; audioData?: string }): Promise<ApiMessage> =>
    apiFetch("/messages", { method: "POST", body: JSON.stringify(msg) }),

  likeMessage: (id: string): Promise<ApiMessage> =>
    apiFetch(`/messages/${id}/like`, { method: "PATCH" }),

  deleteMessages: (): Promise<{ success: boolean }> =>
    apiFetch("/messages", { method: "DELETE" }),

  getDuas: (): Promise<ApiDua[]> =>
    apiFetch("/duas"),

  addDua: (dua: { arabic: string; translation?: string; author: string }): Promise<ApiDua> =>
    apiFetch("/duas", { method: "POST", body: JSON.stringify(dua) }),

  deleteDua: (id: string): Promise<{ success: boolean }> =>
    apiFetch(`/duas/${id}`, { method: "DELETE" }),
};
