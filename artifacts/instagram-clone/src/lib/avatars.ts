/** Default profile photos — same everywhere (login, chat, home, DB). */
export const AVATARS = {
  me: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=150&h=150&fit=crop",
  wife: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&h=150&fit=crop",
} as const;

export function defaultAvatar(userId: string): string {
  return userId === "wife" ? AVATARS.wife : AVATARS.me;
}
