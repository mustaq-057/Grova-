import { useCallback, useEffect, useState, useRef } from "react";
import { useFeatureLoading } from "@/hooks/useFeatureLoading";
import { Heart, MessageSquare, Send, MapPin, Trash2, Reply } from "lucide-react";
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

async function waitForElement(
  selector: string,
  maxAttempts = 50,
  intervalMs = 100,
): Promise<Element | null> {
  for (let i = 0; i < maxAttempts; i++) {
    const el = document.querySelector(selector);
    if (el) return el;
    await new Promise((r) => window.setTimeout(r, intervalMs));
  }
  return null;
}

export function PostFeed({
  focusPostId,
  focusCommentId,
}: {
  focusPostId?: string | null;
  focusCommentId?: string | null;
} = {}) {
  const { user, partner } = useAuth();
  const partnerId = user?.id === "me" ? "wife" : "me";
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const { showLoading, finishLoading } = useFeatureLoading(posts.length === 0);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Record<string, ApiPostComment[]>>({});
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const commentHighlightRef = useRef<HTMLDivElement | null>(null);
  const focusHandledRef = useRef<string | null>(null);

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
      source.addEventListener("post-comment-deleted", (e) => {
        try {
          const { id, postId } = JSON.parse((e as MessageEvent).data) as { id: string; postId: string };
          setComments((prev) => ({
            ...prev,
            [postId]: (prev[postId] ?? []).filter((c) => c.id !== id),
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

  const deleteComment = async (postId: string, commentId: string) => {
    setDeletingCommentId(commentId);
    try {
      await api.deletePostComment(postId, commentId);
      setComments((prev) => ({
        ...prev,
        [postId]: (prev[postId] ?? []).filter((c) => c.id !== commentId),
      }));
      loadPosts();
      toast.success("Comment deleted");
    } catch {
      toast.error("Could not delete comment");
    } finally {
      setDeletingCommentId(null);
    }
  };

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


  useEffect(() => {
    focusHandledRef.current = null;
  }, [focusPostId, focusCommentId]);

  useEffect(() => {
    if (!focusPostId || posts.length === 0) return;
    const focusKey = `${focusPostId}:${focusCommentId ?? ""}`;
    if (focusHandledRef.current === focusKey) return;

    let cancelled = false;
    void (async () => {
      if (!posts.some((p) => p.id === focusPostId)) {
        try {
          const post = await api.getPostById(focusPostId);
          setPosts(prev => [...prev, post].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch {
          await loadPosts();
        }
        if (cancelled) return;
      }

      await openComments(focusPostId);
      if (cancelled) return;

      const postEl = await waitForElement(`[data-testid="post-${focusPostId}"]`);
      if (cancelled) return;
      postEl?.scrollIntoView({ behavior: "smooth", block: "center" });

      if (focusCommentId) {
        for (let i = 0; i < 30; i++) {
          if (cancelled) return;
          if (commentHighlightRef.current) {
            commentHighlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            break;
          }
          await new Promise((r) => window.setTimeout(r, 10));
        }
      }

      focusHandledRef.current = focusKey;
      window.history.replaceState({}, "", "/");
      window.dispatchEvent(new Event("grova-search-changed"));
    })();

    return () => {
      cancelled = true;
    };
  }, [focusPostId, focusCommentId, posts, comments[focusPostId ?? ""]?.length, loadPosts]);

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
              <li key={post.id} data-testid={`post-${post.id}`} className="pb-4">
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
                  <button type="button" onClick={() => openComments(post.id)} className="flex items-center gap-1.5 text-sm hover:text-primary transition-colors">
                    <MessageSquare className="w-5 h-5" />
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
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="px-4 pt-3 space-y-2.5">
                    {(comments[post.id] ?? []).map((c) => {
                      const isMine = c.authorId === user?.id;
                      const authorLabel = isMine ? "You" : partner?.name?.split(" ")[0] ?? "Partner";
                      const isFocused = focusCommentId === c.id;
                      return (
                        <div
                          key={c.id}
                          ref={isFocused ? commentHighlightRef : undefined}
                          className={`flex gap-2.5 items-start rounded-xl px-2.5 py-2 ${isFocused ? "bg-primary/10 ring-1 ring-primary/25" : "bg-secondary/30"}`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isMine ? "bg-primary/15 text-primary" : "bg-sky-500/15 text-sky-600"}`}>
                            <Reply className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs leading-relaxed">
                              <span className="font-semibold">{authorLabel}</span>{" "}
                              <span className="text-foreground/90">{c.text}</span>
                            </p>
                          </div>
                          {isMine ? (
                            <button
                              type="button"
                              onClick={() => deleteComment(post.id, c.id)}
                              disabled={deletingCommentId === c.id}
                              className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 shrink-0"
                              aria-label="Delete comment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                    <div className="flex gap-2 items-center pt-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-4 h-4 text-primary" />
                      </div>
                      <input
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment…"
                        className="flex-1 text-sm px-3 py-2.5 bg-secondary/50 rounded-full border border-border/50 outline-none focus:border-primary/40"
                        onKeyDown={(e) => e.key === "Enter" && submitComment(post.id)}
                      />
                      <button
                        type="button"
                        onClick={() => submitComment(post.id)}
                        className="w-9 h-9 bg-primary text-primary-foreground flex items-center justify-center rounded-full shrink-0"
                        aria-label="Post comment"
                      >
                        <Send className="w-4 h-4" />
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
