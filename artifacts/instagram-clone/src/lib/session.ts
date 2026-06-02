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

const PRIMARY_TOKEN_KEY = "grova_primary_token";
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
  const s = storage();
  if (!s) return headers;
  const token = s.getItem(TOKEN_KEY);
  const csrf = s.getItem(CSRF_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;
  if (csrf) headers["X-CSRF-Token"] = csrf;
  const primaryToken = s.getItem(PRIMARY_TOKEN_KEY);
  if (primaryToken) headers["X-Primary-Token"] = primaryToken;
  return headers;
}

export function savePrimaryToken(primaryToken: string) {
  const s = storage();
  if (!s) return;
  s.setItem(PRIMARY_TOKEN_KEY, primaryToken);
}

export function getPrimaryToken(): string | null {
  return storage()?.getItem(PRIMARY_TOKEN_KEY) ?? null;
}

export function clearPrimaryToken() {
  storage()?.removeItem(PRIMARY_TOKEN_KEY);
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
