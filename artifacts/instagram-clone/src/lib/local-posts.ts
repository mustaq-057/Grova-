import { api, type ApiPost } from "./api";

export type StoredPost = ApiPost;

export async function getPosts(userId: string): Promise<StoredPost[]> {
  const all = await api.getPosts();
  return all.filter((p) => p.authorId === userId);
}

export async function savePost(
  _userId: string,
  post: { image: string; images?: string[]; caption: string; location: string; ratio: string; at: string },
): Promise<StoredPost> {
  const urls = post.images?.length ? post.images : [post.image];
  return api.addPost({
    mediaUrl: urls[0]!,
    mediaUrls: urls.length > 1 ? urls : undefined,
    caption: post.caption,
    location: post.location,
    aspectRatio: post.ratio,
  });
}

export function clearLegacyLocalMedia(userId: string): void {
  try {
    localStorage.removeItem(`grova_posts_${userId}`);
    localStorage.removeItem(`grova_stories_${userId}`);
  } catch {
    /* ignore */
  }
}
