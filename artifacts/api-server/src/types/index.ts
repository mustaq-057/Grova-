import { Request } from "express";

// Database row types
export interface ProfileRow {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  avatar: string;
}

// Raw database row (before type conversion)
export interface RawProfileRow {
  id: string | number;
  username: string;
  name: string;
  bio: string | null;
  avatar: string;
}

export interface DeviceRow {
  id: string;
  user_id: string;
  user_agent: string;
  ip: string;
  created_at: number;
  last_seen: number;
}

export interface SessionRow {
  token: string;
  user_id: string;
  username: string;
  created_at: number;
  expires_at: number;
  csrf_token: string;
  refresh_token: string;
  refresh_token_expires_at: number;
  device_id: string;
}

// Extended Express Request with user info
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    username: string;
    deviceId: string;
  };
}

// Profile update payload
export interface ProfileUpdatePayload {
  name?: string;
  bio?: string;
  avatar?: string;
}

// Configuration types
export interface AppConfig {
  defaultCoupleCode: string;
  defaultProfiles: DefaultProfile[];
  partnerMapping: Record<string, string>;
}

export interface DefaultProfile {
  id: string;
  username: string;
  name: string;
  bio: string;
  avatar: string;
}
