const TOKEN_KEY = "grova_token";
const CSRF_KEY = "grova_csrf";
const REFRESH_KEY = "grova_refresh";

function storage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

const DEFAULT_EMAIL_KEY = "grova_default_email";

export function saveSession(token: string, csrfToken: string, refreshToken?: string) {
  const s = storage();
  if (!s) return;
  s.setItem(TOKEN_KEY, token);
  s.setItem(CSRF_KEY, csrfToken);
  if (refreshToken) s.setItem(REFRESH_KEY, refreshToken);
}

export function clearSession() {
  const s = storage();
  if (!s) return;
  s.removeItem(TOKEN_KEY);
  s.removeItem(CSRF_KEY);
  s.removeItem(REFRESH_KEY);
}

export function hasSession(): boolean {
  const s = storage();
  return Boolean(s?.getItem(TOKEN_KEY) || s?.getItem(REFRESH_KEY));
}

export function setDeviceId(id: string): void {
  try {
    storage()?.setItem("grova_device_id", id);
  } catch {
    /* ignore */
  }
}

export function getDeviceId(): string | null {
  return storage()?.getItem("grova_device_id") ?? null;
}

export function getRefreshToken(): string | null {
  return storage()?.getItem(REFRESH_KEY) ?? null;
}

export function getAccessToken(): string | null {
  return storage()?.getItem(TOKEN_KEY) ?? null;
}

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  headers["X-Client-Id"] = getOrCreateClientId();
  if (typeof window !== "undefined") {
    headers["X-Client-Origin"] = window.location.origin;
  }
  const s = storage();
  if (!s) return headers;
  const token = s.getItem(TOKEN_KEY);
  const csrf = s.getItem(CSRF_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;
  if (csrf) headers["X-CSRF-Token"] = csrf;
  return headers;
}

export function saveDefaultEmail(email: string) {
  try {
    storage()?.setItem(DEFAULT_EMAIL_KEY, email.trim().toLowerCase());
  } catch {
    /* ignore */
  }
}

export function getDefaultEmail(): string {
  return storage()?.getItem(DEFAULT_EMAIL_KEY) ?? "";
}

const CLIENT_ID_KEY = "grova_client_id";

/** Stable per-browser id — primary trust requires matching client + origin. */
export function getOrCreateClientId(): string {
  const s = storage();
  if (!s) return crypto.randomUUID();
  let id = s.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    s.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}
