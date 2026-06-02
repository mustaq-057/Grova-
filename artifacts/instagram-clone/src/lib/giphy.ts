/** Giphy API — free tier at https://developers.giphy.com (GIFs + Stickers) */

const GIPHY_KEY = import.meta.env.VITE_GIPHY_API_KEY ?? "";
console.log("[GIPHY] Initialized with key:", GIPHY_KEY ? `${GIPHY_KEY.substring(0, 10)}...` : "NOT SET");
const BASE = "https://api.giphy.com/v1";
const PAGE_SIZE = 50;
export const GIPHY_MAX_ITEMS = 2000;

export type GiphyMedia = {
  id: string;
  url: string;
  preview: string;
  title: string;
};

type GiphyImage = {
  fixed_height_small?: { url: string };
  downsized_still?: { url: string };
  fixed_width_small?: { url: string };
};

type GiphyItem = {
  id: string;
  title?: string;
  images: GiphyImage;
};

function mapItem(g: GiphyItem): GiphyMedia {
  const preview =
    g.images.fixed_height_small?.url ??
    g.images.fixed_width_small?.url ??
    g.images.downsized_still?.url ??
    "";
  return {
    id: g.id,
    url: `https://media.giphy.com/media/${g.id}/giphy.gif`,
    preview,
    title: g.title ?? "",
  };
}

export function hasGiphyKey(): boolean {
  return Boolean(GIPHY_KEY);
}

async function giphyFetch(path: string): Promise<GiphyItem[]> {
  if (!GIPHY_KEY) {
    console.warn("[GIPHY] No API key found");
    return [];
  }
  try {
    const fullUrl = `${BASE}${path}`;
    console.log("[GIPHY] Fetching:", fullUrl);
    const res = await fetch(fullUrl);
    console.log("[GIPHY] Response status:", res.status);
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[GIPHY] API Error:", res.status, errorText);
      return [];
    }
    const json = (await res.json()) as { data?: GiphyItem[] };
    console.log("[GIPHY] Items fetched:", json.data?.length ?? 0);
    return json.data ?? [];
  } catch (error) {
    console.error("[GIPHY] Fetch error:", error);
    return [];
  }
}

export async function fetchTrendingGifs(offset: number): Promise<GiphyMedia[]> {
  const items = await giphyFetch(
    `/gifs/trending?api_key=${GIPHY_KEY}&limit=${PAGE_SIZE}&offset=${offset}&rating=g`,
  );
  return items.map(mapItem);
}

export async function searchGifs(query: string, offset: number): Promise<GiphyMedia[]> {
  const items = await giphyFetch(
    `/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=${PAGE_SIZE}&offset=${offset}&rating=g`,
  );
  return items.map(mapItem);
}

export async function fetchTrendingStickers(offset: number): Promise<GiphyMedia[]> {
  const items = await giphyFetch(
    `/stickers/trending?api_key=${GIPHY_KEY}&limit=${PAGE_SIZE}&offset=${offset}&rating=g`,
  );
  return items.map(mapItem);
}

export async function searchStickers(query: string, offset: number): Promise<GiphyMedia[]> {
  const items = await giphyFetch(
    `/stickers/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=${PAGE_SIZE}&offset=${offset}&rating=g`,
  );
  return items.map(mapItem);
}

export const GIPHY_PAGE_SIZE = PAGE_SIZE;
