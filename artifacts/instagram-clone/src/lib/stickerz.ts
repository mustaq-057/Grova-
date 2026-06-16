export type StickerCategory = 
  | "Forest Romance"
  | "Cozy Night"
  | "Islamic Couple"
  | "Funny Couple"
  | "Matching Profile";

export interface CustomSticker {
  id: string;
  url: string;
  caption: string;
  category: StickerCategory;
}

export const CUSTOM_STICKERZ: CustomSticker[] = [
  // Forest Romance
  { id: "pookie-1", url: "/stickerz/1.png", caption: "Umbrella", category: "Forest Romance" },
  { id: "pookie-2", url: "/stickerz/2.png", caption: "Flower crown", category: "Forest Romance" },
  { id: "pookie-3", url: "/stickerz/3.png", caption: "Tree branch", category: "Forest Romance" },
  { id: "pookie-4", url: "/stickerz/4.png", caption: "Firefly heart", category: "Forest Romance" },
  { id: "pookie-5", url: "/stickerz/5.png", caption: "Hot chocolate", category: "Forest Romance" },
  { id: "pookie-6", url: "/stickerz/6.png", caption: "Forest walk", category: "Forest Romance" },
  { id: "pookie-7", url: "/stickerz/7.png", caption: "Carrying", category: "Forest Romance" },
  { id: "pookie-8", url: "/stickerz/8.png", caption: "Reading", category: "Forest Romance" },

  // Cozy Night
  { id: "pookie-9", url: "/stickerz/9.png", caption: "Sleepy shoulder", category: "Cozy Night" },
  { id: "pookie-10", url: "/stickerz/10.png", caption: "Tucking in", category: "Cozy Night" },
  { id: "pookie-11", url: "/stickerz/11.png", caption: "Moonlight picnic", category: "Cozy Night" },
  { id: "pookie-12", url: "/stickerz/12.png", caption: "Star gazing", category: "Cozy Night" },
  { id: "pookie-13", url: "/stickerz/13.png", caption: "One blanket", category: "Cozy Night" },
  { id: "pookie-14", url: "/stickerz/14.png", caption: "Lanterns", category: "Cozy Night" },
  { id: "pookie-15", url: "/stickerz/15.png", caption: "Forehead kiss", category: "Cozy Night" },
  { id: "pookie-16", url: "/stickerz/16.png", caption: "Sweet dreams", category: "Cozy Night" },

  // Islamic Couple
  { id: "pookie-17", url: "/stickerz/17.png", caption: "Making dua", category: "Islamic Couple" },
  { id: "pookie-18", url: "/stickerz/18.png", caption: "Iftar together", category: "Islamic Couple" },
  { id: "pookie-21", url: "/stickerz/21.png", caption: "Quran together", category: "Islamic Couple" },
  { id: "pookie-22", url: "/stickerz/22.png", caption: "Ramadan moon", category: "Islamic Couple" },
  { id: "pookie-23", url: "/stickerz/23.png", caption: "Pray for me", category: "Islamic Couple" },
  { id: "pookie-24", url: "/stickerz/24.png", caption: "May Allah bless us", category: "Islamic Couple" },

  // Funny Couple
  { id: "pookie-25", url: "/stickerz/25.png", caption: "Angry Pookie", category: "Funny Couple" },
  { id: "pookie-26", url: "/stickerz/26.png", caption: "Sorry Batman", category: "Funny Couple" },
  { id: "pookie-27", url: "/stickerz/27.png", caption: "Stole hoodie", category: "Funny Couple" },
  { id: "pookie-28", url: "/stickerz/28.png", caption: "Where were you?", category: "Funny Couple" },
  { id: "pookie-29", url: "/stickerz/29.png", caption: "500 unread", category: "Funny Couple" },
  { id: "pookie-30", url: "/stickerz/30.png", caption: "1000 hearts", category: "Funny Couple" },
  { id: "pookie-31", url: "/stickerz/31.png", caption: "Jealous Pookie", category: "Funny Couple" },
  { id: "pookie-32", url: "/stickerz/32.png", caption: "I'm not mad", category: "Funny Couple" },

  // Matching Profile
  { id: "pookie-33", url: "/stickerz/33.png", caption: "Half heart (Batman)", category: "Matching Profile" },
  { id: "pookie-34", url: "/stickerz/34.png", caption: "Half heart (Pookie)", category: "Matching Profile" },
  { id: "pookie-35", url: "/stickerz/35.png", caption: "Sun & Moon", category: "Matching Profile" },
  { id: "pookie-36", url: "/stickerz/36.png", caption: "King & Queen", category: "Matching Profile" },
  { id: "pookie-37", url: "/stickerz/37.png", caption: "Lock & Key", category: "Matching Profile" },
  { id: "pookie-38", url: "/stickerz/38.png", caption: "Bee & Flower", category: "Matching Profile" },
  { id: "pookie-39", url: "/stickerz/39.png", caption: "Cloud & Moon", category: "Matching Profile" },
  { id: "pookie-40", url: "/stickerz/40.png", caption: "Fox & Bunny", category: "Matching Profile" },
];
