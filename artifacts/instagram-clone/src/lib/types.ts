export type CouplePrefs = {
  chatTheme: string;
  appTheme: string;
  readReceipts: boolean;
  showPresence: boolean;
  notifications: boolean;
  noteMe?: string;
  noteWife?: string;
  quickEmojis?: string[];
  customStickerz?: any[];
};

export interface ScheduledMessage {
  id: string;
  senderId: string;
  text?: string;
  type: "text" | "image" | "doodle" | "audio" | "sticker" | "gif" | "file" | "location" | "video" | "heart";
  audioData?: string;
  gifUrl?: string;
  imageData?: string;
  variant?: string;
  companionSticker?: string;
  scheduledAt: string;
  createdAt: string;
}
