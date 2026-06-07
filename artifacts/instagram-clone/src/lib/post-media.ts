import type { ApiPost } from "./api";

/** All media URLs for a post (carousel-aware). */
export function getPostMediaUrls(post: ApiPost): string[] {
  if (post.mediaUrls?.length) return post.mediaUrls;
  if (post.mediaUrl) return [post.mediaUrl];
  return [];
}

export function postHasCarousel(post: ApiPost): boolean {
  return getPostMediaUrls(post).length > 1;
}
