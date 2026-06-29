import type { ApiUser } from "./api";

const SESSION_KEY = "grova_session_snapshot_v1";
const LOGIN_PROFILES_KEY = "grova_login_profiles_v1";

export type SessionSnapshot = {
  user: ApiUser;
  partner: ApiUser | null;
  updatedAt: number;
};

export type LoginProfileRow = { id: "me" | "wife"; name: string; avatar: string };

function storage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

export function readSessionSnapshot(): SessionSnapshot | null {
  const raw = storage()?.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionSnapshot;
    if (!parsed?.user?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSessionSnapshot(user: ApiUser, partner: ApiUser | null): void {
  try {
    const payload: SessionSnapshot = { user, partner, updatedAt: Date.now() };
    storage()?.setItem(SESSION_KEY, JSON.stringify(payload));
    
    const rows: LoginProfileRow[] = [{ id: user.id, name: user.name, avatar: user.avatar }];
    if (partner) {
      rows.push({ id: partner.id as "me" | "wife", name: partner.name, avatar: partner.avatar });
    }
    const existing = readLoginProfiles() || [];
    const merged = existing.map((p) => {
      const updated = rows.find((r) => r.id === p.id);
      return updated ? updated : p;
    });
    rows.forEach((r) => {
      if (!merged.find((m) => m.id === r.id)) merged.push(r);
    });
    writeLoginProfiles(merged);
  } catch {
    /* ignore */
  }
}

export function clearSessionSnapshot(): void {
  try {
    storage()?.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function readLoginProfiles(): LoginProfileRow[] | null {
  const raw = storage()?.getItem(LOGIN_PROFILES_KEY);
  if (!raw) return null;
  try {
    const rows = JSON.parse(raw) as LoginProfileRow[];
    if (!Array.isArray(rows) || rows.length === 0) return null;
    return rows.filter((r) => r.id === "me" || r.id === "wife");
  } catch {
    return null;
  }
}

export function writeLoginProfiles(rows: LoginProfileRow[]): void {
  try {
    storage()?.setItem(LOGIN_PROFILES_KEY, JSON.stringify(rows));
  } catch {
    /* ignore */
  }
}

export function clearLoginProfilesCache(): void {
  try {
    storage()?.removeItem(LOGIN_PROFILES_KEY);
  } catch {
    /* ignore */
  }
}
