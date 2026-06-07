import type { ApiPost } from "./api";

/** All media URLs for a post (carousel-aware). */
export function getPostMediaUrls(post: ApiPost): string[] {
  if (Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0) {
    return post.mediaUrls.filter((u): u is string => typeof u === "string" && u.length > 0);
  }
  if (post.mediaUrl) return [post.mediaUrl];
  return [];
}

export function postHasCarousel(post: ApiPost): boolean {
  return getPostMediaUrls(post).length > 1;
}
