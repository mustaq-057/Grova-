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
  { id: "pookie-1", url: "/stickerz/imagecopy1.png", caption: "Umbrella", category: "Forest Romance" },
  { id: "pookie-2", url: "/stickerz/imagecopy2.png", caption: "Flower crown", category: "Forest Romance" },
  { id: "pookie-3", url: "/stickerz/imagecopy3.png", caption: "Tree branch", category: "Forest Romance" },
  { id: "pookie-4", url: "/stickerz/imagecopy4.png", caption: "Firefly heart", category: "Forest Romance" },
  { id: "pookie-5", url: "/stickerz/imagecopy5.png", caption: "Hot chocolate", category: "Forest Romance" },
  { id: "pookie-6", url: "/stickerz/imagecopy6.png", caption: "Forest walk", category: "Forest Romance" },
  { id: "pookie-7", url: "/stickerz/imagecopy7.png", caption: "Carrying", category: "Forest Romance" },
  { id: "pookie-8", url: "/stickerz/imagecopy8.png", caption: "Reading", category: "Forest Romance" },

  // Cozy Night
  { id: "pookie-9", url: "/stickerz/imagecopy9.png", caption: "Sleepy shoulder", category: "Cozy Night" },
  { id: "pookie-10", url: "/stickerz/imagecopy10.png", caption: "Tucking in", category: "Cozy Night" },
  { id: "pookie-11", url: "/stickerz/imagecopy11.png", caption: "Moonlight picnic", category: "Cozy Night" },
  { id: "pookie-12", url: "/stickerz/imagecopy12.png", caption: "Star gazing", category: "Cozy Night" },
  { id: "pookie-13", url: "/stickerz/imagecopy13.png", caption: "One blanket", category: "Cozy Night" },
  { id: "pookie-14", url: "/stickerz/imagecopy14.png", caption: "Lanterns", category: "Cozy Night" },
  { id: "pookie-15", url: "/stickerz/imagecopy15.png", caption: "Forehead kiss", category: "Cozy Night" },
  { id: "pookie-16", url: "/stickerz/imagecopy16.png", caption: "Sweet dreams", category: "Cozy Night" },

  // Islamic Couple
  { id: "pookie-17", url: "/stickerz/imagecopy17.png", caption: "Making dua", category: "Islamic Couple" },
  { id: "pookie-18", url: "/stickerz/imagecopy18.png", caption: "Iftar together", category: "Islamic Couple" },
  { id: "pookie-19", url: "/stickerz/imagecopy19.png", caption: "Quran together", category: "Islamic Couple" },
  { id: "pookie-20", url: "/stickerz/imagecopy20.png", caption: "Ramadan moon", category: "Islamic Couple" },
  { id: "pookie-21", url: "/stickerz/imagecopy21.png", caption: "Pray for me", category: "Islamic Couple" },
  { id: "pookie-22", url: "/stickerz/imagecopy22.png", caption: "May Allah bless us", category: "Islamic Couple" },

  // Funny Couple
  { id: "pookie-23", url: "/stickerz/imagecopy23.png", caption: "Angry Pookie", category: "Funny Couple" },
  { id: "pookie-24", url: "/stickerz/imagecopy24.png", caption: "Sorry Batman", category: "Funny Couple" },
  { id: "pookie-25", url: "/stickerz/imagecopy25.png", caption: "Stole hoodie", category: "Funny Couple" },
  { id: "pookie-26", url: "/stickerz/imagecopy26.png", caption: "Where were you?", category: "Funny Couple" },
  { id: "pookie-27", url: "/stickerz/imagecopy27.png", caption: "500 unread", category: "Funny Couple" },
  { id: "pookie-28", url: "/stickerz/imagecopy28.png", caption: "1000 hearts", category: "Funny Couple" },
  { id: "pookie-29", url: "/stickerz/imagecopy29.png", caption: "Jealous Pookie", category: "Funny Couple" },
  { id: "pookie-30", url: "/stickerz/imagecopy30.png", caption: "I'm not mad", category: "Funny Couple" },

  // Matching Profile
  { id: "pookie-31", url: "/stickerz/imagecopy31.png", caption: "Half heart (Batman)", category: "Matching Profile" },
  { id: "pookie-32", url: "/stickerz/imagecopy32.png", caption: "Half heart (Pookie)", category: "Matching Profile" },
];
