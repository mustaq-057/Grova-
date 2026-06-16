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
  { id: "pookie-1", url: "/stickerz/imagecopy1.png", caption: "umbrella", category: "Forest Romance" },
  { id: "pookie-2", url: "/stickerz/imagecopy2.png", caption: "flower crown", category: "Forest Romance" },
  { id: "pookie-3", url: "/stickerz/imagecopy3.png", caption: "moonlight picnic", category: "Forest Romance" },
  { id: "pookie-4", url: "/stickerz/imagecopy4.png", caption: "star gazing", category: "Forest Romance" },
  { id: "pookie-5", url: "/stickerz/imagecopy5.png", caption: "hot chocolate", category: "Forest Romance" },
  { id: "pookie-6", url: "/stickerz/imagecopy6.png", caption: "forest walk", category: "Forest Romance" },
  { id: "pookie-7", url: "/stickerz/imagecopy7.png", caption: "carrying", category: "Forest Romance" },
  { id: "pookie-8", url: "/stickerz/imagecopy8.png", caption: "reading", category: "Forest Romance" },

  // Cozy Night
  { id: "pookie-9", url: "/stickerz/imagecopy9.png", caption: "one blanket", category: "Cozy Night" },
  { id: "pookie-10", url: "/stickerz/imagecopy10.png", caption: "lanterns", category: "Cozy Night" },
  { id: "pookie-11", url: "/stickerz/imagecopy11.png", caption: "forehead kiss", category: "Cozy Night" },
  { id: "pookie-12", url: "/stickerz/imagecopy12.png", caption: "sweet dreams", category: "Cozy Night" },
  { id: "pookie-13", url: "/stickerz/imagecopy13.png", caption: "dua together", category: "Cozy Night" },
  { id: "pookie-14", url: "/stickerz/imagecopy14.png", caption: "iftar together", category: "Cozy Night" },

  // Islamic Couple
  { id: "pookie-15", url: "/stickerz/imagecopy15.png", caption: "flowers", category: "Islamic Couple" },
  { id: "pookie-16", url: "/stickerz/imagecopy16.png", caption: "angry pookie", category: "Islamic Couple" },
  { id: "pookie-17", url: "/stickerz/imagecopy17.png", caption: "stolen hoodie", category: "Islamic Couple" },
  { id: "pookie-18", url: "/stickerz/imagecopy18.png", caption: "where were you", category: "Islamic Couple" },
  { id: "pookie-19", url: "/stickerz/imagecopy19.png", caption: "reading quran together", category: "Islamic Couple" },
  { id: "pookie-20", url: "/stickerz/imagecopy20.png", caption: "pray for me", category: "Islamic Couple" },

  // Funny Couple
  { id: "pookie-21", url: "/stickerz/imagecopy21.png", caption: "i am not mad", category: "Funny Couple" },
  { id: "pookie-22", url: "/stickerz/imagecopy22.png", caption: "1000 hearts", category: "Funny Couple" },
  { id: "pookie-23", url: "/stickerz/imagecopy23.png", caption: "unread messages", category: "Funny Couple" },
  { id: "pookie-24", url: "/stickerz/imagecopy24.png", caption: "may allah bless us", category: "Funny Couple" },
  { id: "pookie-25", url: "/stickerz/imagecopy25.png", caption: "king and queen", category: "Funny Couple" },
  { id: "pookie-26", url: "/stickerz/imagecopy26.png", caption: "sun and moon", category: "Funny Couple" },

  // Matching Profile
  { id: "pookie-27", url: "/stickerz/imagecopy27.png", caption: "half heart pookie", category: "Matching Profile" },
  { id: "pookie-28", url: "/stickerz/imagecopy28.png", caption: "half heart batman", category: "Matching Profile" },
  { id: "pookie-29", url: "/stickerz/imagecopy29.png", caption: "key and lock", category: "Matching Profile" },
  { id: "pookie-30", url: "/stickerz/imagecopy30.png", caption: "bee and flower", category: "Matching Profile" },
  { id: "pookie-31", url: "/stickerz/imagecopy31.png", caption: "cloud and moon", category: "Matching Profile" },
  { id: "pookie-32", url: "/stickerz/imagecopy32.png", caption: "fox and buuny", category: "Matching Profile" },
];

let preloaded = false;

export function preloadStickerz() {
  if (typeof window === "undefined" || preloaded) return;
  preloaded = true;
  
  // Immediately inject preload links into the head so the browser's native network stack handles it optimally
  const doPreload = () => {
    CUSTOM_STICKERZ.forEach((sticker) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = sticker.url;
      document.head.appendChild(link);
    });
  };

  // Run instantly on next tick
  setTimeout(doPreload, 0);
}
