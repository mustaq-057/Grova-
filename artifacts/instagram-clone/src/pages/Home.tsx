import { useState } from "react";
import { Heart, MessageCircle, Bookmark, Send, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { MOCK_STORIES, MOCK_POSTS } from "@/lib/mock-data";

function StoriesRow() {
  return (
    <div className="flex gap-4 px-4 py-4 overflow-x-auto scrollbar-hide border-b border-border">
      {MOCK_STORIES.map((story) => (
        <div key={story.id} className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0" data-testid={`story-${story.id}`}>
          <div className={`story-ring ${story.viewed ? "opacity-40 grayscale" : ""} transition-all hover:scale-105`}>
            <div className="bg-background rounded-full p-[2px]">
              <img
                src={story.user.avatar}
                alt={story.user.username}
                className="w-14 h-14 rounded-full object-cover"
              />
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground truncate w-16 text-center">{story.user.username}</span>
        </div>
      ))}
    </div>
  );
}

function PostCard({ post }: { post: typeof MOCK_POSTS[0] }) {
  const [liked, setLiked] = useState(post.isLiked);
  const [saved, setSaved] = useState(post.isSaved);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [showHeart, setShowHeart] = useState(false);
  const [comment, setComment] = useState("");

  const handleLike = () => {
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  const handleDoubleTap = () => {
    if (!liked) {
      setLiked(true);
      setLikeCount((prev) => prev + 1);
    }
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 900);
  };

  return (
    <article className="border-b border-border pb-4" data-testid={`post-${post.id}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="story-ring">
            <div className="bg-background rounded-full p-[2px]">
              <img src={post.user.avatar} alt={post.user.username} className="w-8 h-8 rounded-full object-cover" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold" data-testid={`text-username-${post.id}`}>{post.user.username}</p>
            <p className="text-[11px] text-muted-foreground">{post.timeAgo}</p>
          </div>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors p-1" data-testid={`button-more-${post.id}`}>
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Image */}
      <div className="relative cursor-pointer select-none" onDoubleClick={handleDoubleTap} data-testid={`img-post-${post.id}`}>
        <img src={post.image} alt="Post" className="w-full object-cover max-h-[600px]" />
        {showHeart && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1.2 }}
            transition={{ duration: 0.3 }}
          >
            <Heart className="w-24 h-24 fill-white text-white drop-shadow-2xl" />
          </motion.div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 1.3 }}
              onClick={handleLike}
              className="transition-colors"
              data-testid={`button-like-${post.id}`}
            >
              <Heart
                className={`w-6 h-6 transition-all ${liked ? "fill-red-500 text-red-500" : "text-foreground"}`}
                strokeWidth={1.5}
              />
            </motion.button>
            <button className="hover:text-muted-foreground transition-colors" data-testid={`button-comment-${post.id}`}>
              <MessageCircle className="w-6 h-6" strokeWidth={1.5} />
            </button>
            <button className="hover:text-muted-foreground transition-colors" data-testid={`button-share-${post.id}`}>
              <Send className="w-6 h-6" strokeWidth={1.5} />
            </button>
          </div>
          <motion.button whileTap={{ scale: 1.2 }} onClick={() => setSaved((s) => !s)} data-testid={`button-save-${post.id}`}>
            <Bookmark
              className={`w-6 h-6 transition-all ${saved ? "fill-foreground text-foreground" : "text-foreground"}`}
              strokeWidth={1.5}
            />
          </motion.button>
        </div>

        <p className="text-sm font-semibold mb-1" data-testid={`text-likes-${post.id}`}>{likeCount.toLocaleString()} likes</p>

        <p className="text-sm leading-relaxed">
          <span className="font-semibold mr-1">{post.user.username}</span>
          {post.caption}
        </p>

        {post.comments.length > 0 && (
          <div className="mt-1.5 space-y-0.5">
            {post.comments.slice(0, 2).map((c) => (
              <p key={c.id} className="text-sm">
                <span className="font-semibold mr-1">{c.user.username}</span>
                <span className="text-foreground/80">{c.text}</span>
              </p>
            ))}
          </div>
        )}

        {/* Comment input */}
        <div className="flex items-center gap-2 mt-3 border-t border-border pt-3">
          <input
            type="text"
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="flex-1 bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/50 outline-none"
            data-testid={`input-comment-${post.id}`}
          />
          {comment && (
            <button
              onClick={() => setComment("")}
              className="text-primary text-sm font-semibold"
              data-testid={`button-post-comment-${post.id}`}
            >
              Post
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  return (
    <div className="max-w-[470px] mx-auto pb-16 md:pb-4">
      <StoriesRow />
      <div className="mt-2">
        {MOCK_POSTS.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
