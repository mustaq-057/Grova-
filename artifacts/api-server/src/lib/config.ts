import { AppConfig, DefaultProfile } from "../types";

function resolveDefaultCoupleCode(): string {
  const fromEnv = process.env.DEFAULT_COUPLE_CODE?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    throw new Error("DEFAULT_COUPLE_CODE must be set in production");
  }
  return "change-me-before-hosting";
}

export const appConfig: AppConfig = {
  defaultCoupleCode: resolveDefaultCoupleCode(),
  defaultProfiles: [
    {
      id: "me",
      username: process.env.DEFAULT_USER1_USERNAME || "mustaq",
      name: process.env.DEFAULT_USER1_NAME || "Mustaq",
      bio: process.env.DEFAULT_USER1_BIO || "Just us two ♥",
      avatar: process.env.DEFAULT_USER1_AVATAR || "",
    },
    {
      id: "wife",
      username: process.env.DEFAULT_USER2_USERNAME || "sara",
      name: process.env.DEFAULT_USER2_NAME || "Sara",
      bio: process.env.DEFAULT_USER2_BIO || "My person ♥",
      avatar: process.env.DEFAULT_USER2_AVATAR || "",
    },
  ],
  partnerMapping: {
    me: "wife",
    wife: "me",
  },
};
