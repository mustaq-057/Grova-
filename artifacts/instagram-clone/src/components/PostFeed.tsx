import { useCallback, useEffect, useState } from "react";
import { useFeatureLoading } from "@/hooks/useFeatureLoading";
import { Heart, MessageCircle, Send, MapPin, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { toast } from "sonner";
import { api, type ApiPost, type ApiPostComment } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { openLiveChannel } from "@/lib/sse-client";
import { askPartner, partnerHimHer, partnerIsFemale } from "@/lib/partner-words";
import { AvatarImage } from "@/components/AvatarImage";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PostCarousel } from "@/components/PostCarousel";
import { getPostMediaUrls } from "@/lib/post-media";
import { resolvePostMediaUrl } from "@/lib/media-url";

export function PostFeed() {
  const { user, partner } = useAuth();
  const partnerId = user?.id === "me" ? "wife" : "me";
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const { showLoading, finishLoading } = useFeatureLoading(posts.length === 0);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Record<string, ApiPostComment[]>>({});
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      const list = await Promise.race([
        api.getPosts(),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error("timeout")), 12_000);
        }),
      ]);
      setPosts(list);
    } catch (err) {
      console.error("Failed to load posts:", err);
    } finally {
      finishLoading();
    }
  }, [finishLoading]);

  useEffect(() => {
    if (!user) {
      finishLoading();
      return;
    }
    loadPosts();
    let es: EventSource | null = null;
    let pollStop: (() => void) | null = null;

    void openLiveChannel(user.id, loadPosts).then((channel) => {
      if (!channel) return;
      if (channel.mode === "poll") {
        pollStop = channel.stop;
        return;
      }
      es = channel.eventSource;
      wirePostEvents(es);
    });

    function wirePostEvents(source: EventSource) {
    source.addEventListener("post-added", () => loadPosts());
    source.addEventListener("post-liked", (e) => {
      try {
        const updated = JSON.parse((e as MessageEvent).data) as ApiPost;
        setPosts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
      } catch {
        loadPosts();
      }
    });
    source.addEventListener("post-reacted", (e) => {
      try {
        const updated = JSON.parse((e as MessageEvent).data) as ApiPost;
        setPosts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
      } catch {
        loadPosts();
      }
    });
    source.addEventListener("post-deleted", (e) => {
      try {
        const { id } = JSON.parse((e as MessageEvent).data) as { id: string };
        setPosts((prev) => prev.filter((p) => p.id !== id));
      } catch {
        loadPosts();
      }
    });
    source.addEventListener("post-commented", (e) => {
      try {
        const c = JSON.parse((e as MessageEvent).data) as ApiPostComment;
        setComments((prev) => ({
          ...prev,
          [c.postId]: [...(prev[c.postId] ?? []), c],
        }));
        loadPosts();
      } catch {
        loadPosts();
      }
    });
    }

    const poll = setInterval(loadPosts, 60_000);
    return () => {
      es?.close();
      pollStop?.();
      clearInterval(poll);
    };
  }, [user?.id, loadPosts, finishLoading]);

  const toggleLike = async (postId: string) => {
    const snapshot = posts.find((p) => p.id === postId);
    if (!snapshot) return;

    const nextLiked = !snapshot.likedByMe;
    const nextCount = Math.max(0, (snapshot.likeCount ?? 0) + (nextLiked ? 1 : -1));
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, likedByMe: nextLiked, likeCount: nextCount } : p,
      ),
    );

    try {
      const updated = await api.togglePostLike(postId);
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
    } catch {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likedByMe: snapshot.likedByMe, likeCount: snapshot.likeCount }
            : p,
        ),
      );
      toast.error("Could not update like.");
    }
  };

  const confirmDeletePost = async () => {
    if (!deletePostId) return;
    setDeleting(true);
    try {
      await api.deletePost(deletePostId);
      setPosts((prev) => prev.filter((p) => p.id !== deletePostId));
      toast.success("Post deleted for you.");
    } catch {
      toast.error("Could not delete post.");
    } finally {
      setDeleting(false);
      setDeletePostId(null);
    }
  };

  const openComments = async (postId: string) => {
    setCommentPostId(postId);
    if (!comments[postId]) {
      try {
        const list = await api.getPostComments(postId);
        setComments((prev) => ({ ...prev, [postId]: list }));
      } catch {
        /* ignore */
      }
    }
  };

  const submitComment = async (postId: string) => {
    if (!commentText.trim()) return;
    try {
      const c = await api.addPostComment(postId, commentText.trim());
      setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] ?? []), c] }));
      setCommentText("");
      loadPosts();
    } catch {
      toast.error("Could not post comment.");
    }
  };

  const shareToChat = async (post: ApiPost) => {
    if (!user) return;
    const authorName = post.authorId === user.id ? "I" : partner?.name ?? (partnerIsFemale(partnerId) ? "She" : "He");
    const msg = `📷 ${authorName} shared a post${post.caption ? `: "${post.caption.slice(0, 80)}"` : ""}\n→ grova://post/${post.id}`;
    try {
      await api.sendMessage({
        senderId: user.id,
        type: "image",
        imageUrl: resolvePostMediaUrl(getPostMediaUrls(post)[0]) ?? getPostMediaUrls(post)[0],
        text: msg,
      });
      toast.success("Sent to chat!");
    } catch {
      toast.error("Could not share to chat.");
    }
  };

  if (showLoading) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
        Loading posts…
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="px-4 py-10 text-center border-t border-border/50">
        <p className="font-semibold text-sm">No posts yet</p>
        <p className="text-xs text-muted-foreground mt-1 mb-4">Share a photo — it appears here for you</p>
        <Link href="/create">
          <button type="button" className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl">
            Upload photo
          </button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="border-t border-border/50">
        <div className="px-4 py-3 flex items-center gap-2">
          <Heart className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">Your feed</h2>
        </div>
        <ul className="divide-y divide-border/50">
          {posts.map((post) => {
            const authorName =
              post.authorId === user?.id ? user.name : partner?.name ?? "Partner";
            const isMine = post.authorId === user?.id;
            const ratioClass =
              post.aspectRatio === "16:9"
                ? "aspect-video"
                : post.aspectRatio === "1:1"
                  ? "aspect-square"
                  : "aspect-[4/5]";

            return (
              <li key={post.id} className="pb-4">
                <div className="flex items-center gap-2 px-4 py-3">
                  <AvatarImage
                    src={post.authorId === user?.id ? user?.avatar : partner?.avatar}
                    userId={post.authorId}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{authorName}</p>
                    {post.location ? (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" /> {post.location}
                      </p>
                    ) : null}
                  </div>
                  {isMine ? (
                    <button
                      type="button"
                      onClick={() => setDeletePostId(post.id)}
                      className="p-2 text-muted-foreground hover:text-destructive rounded-full hover:bg-destructive/10"
                      aria-label="Delete post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
                <PostCarousel
                  urls={getPostMediaUrls(post)}
                  alt={post.caption || "Post"}
                  ratioClass={ratioClass}
                />

                <div className="px-4 pt-2 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => toggleLike(post.id)}
                    className="flex items-center gap-1.5 text-sm"
                    aria-pressed={post.likedByMe ? "true" : "false"}
                  >
                    <Heart className={`w-5 h-5 ${post.likedByMe ? "fill-red-500 text-red-500" : ""}`} />
                    <span>{post.likeCount ?? 0}</span>
                  </button>
                  <button type="button" onClick={() => openComments(post.id)} className="flex items-center gap-1.5 text-sm">
                    <MessageCircle className="w-5 h-5" />
                    <span>{post.commentCount ?? 0}</span>
                  </button>
                  {/* Removed share to chat button per user request */}
                </div>
                {post.caption ? (
                  <p className="px-4 pt-2 text-sm">
                    <span className="font-semibold mr-1">{authorName.split(" ")[0]}</span>
                    {post.caption}
                  </p>
                ) : null}
                {commentPostId === post.id && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-3 space-y-2">
                    {(comments[post.id] ?? []).map((c) => (
                      <p key={c.id} className="text-xs">
                        <span className="font-semibold">{c.authorId === user?.id ? "You" : partner?.name?.split(" ")[0]}</span>{" "}
                        {c.text}
                      </p>
                    ))}
                    <div className="flex gap-2">
                      <input
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add a comment…"
                        className="flex-1 text-sm px-3 py-2 bg-secondary/50 rounded-full border border-border/50 outline-none"
                        onKeyDown={(e) => e.key === "Enter" && submitComment(post.id)}
                      />
                      <button
                        type="button"
                        onClick={() => submitComment(post.id)}
                        className="px-3 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-full"
                      >
                        Post
                      </button>
                    </div>
                  </motion.div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <ConfirmDialog
        open={deletePostId !== null}
        onOpenChange={(open) => !open && setDeletePostId(null)}
        title="Delete this post?"
        description="This removes the photo for you. It cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={confirmDeletePost}
      />
    </>
  );
}
