import { useState } from "react";
import { X, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { MOCK_POSTS, ME, WIFE } from "@/lib/mock-data";

export default function Memories() {
  const [selected, setSelected] = useState<number | null>(null);

  const posts = MOCK_POSTS;

  const prev = () => setSelected(s => (s !== null && s > 0 ? s - 1 : s));
  const next = () => setSelected(s => (s !== null && s < posts.length - 1 ? s + 1 : s));

  return (
    <div className="max-w-[600px] mx-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="px-4 py-5 border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <h1 className="font-semibold text-base">Memories</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Your shared moments together</p>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-around py-4 border-b border-border bg-card/20">
        <div className="text-center">
          <p className="font-bold text-lg">{posts.length}</p>
          <p className="text-xs text-muted-foreground">memories</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center">
          <p className="font-bold text-lg">{posts.filter(p => p.isLiked).length}</p>
          <p className="text-xs text-muted-foreground">loved</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center">
          <p className="font-bold text-lg">{posts.filter(p => p.isSaved).length}</p>
          <p className="text-xs text-muted-foreground">saved</p>
        </div>
      </div>

      {/* Masonry grid */}
      <div className="flex gap-0.5 p-0.5">
        {[0, 1, 2].map((col) => (
          <div key={col} className="flex-1 flex flex-col gap-0.5">
            {posts.filter((_, i) => i % 3 === col).map((post) => {
              const idx = posts.indexOf(post);
              const isMe = post.user.id === "me";
              return (
                <div
                  key={post.id}
                  className="relative aspect-square overflow-hidden group cursor-pointer"
                  onClick={() => setSelected(idx)}
                  data-testid={`memory-${post.id}`}
                >
                  <img
                    src={post.image}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                    <div className="flex items-center gap-1">
                      <img src={post.user.avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                      <span className="text-white text-[10px] font-medium">{isMe ? "You" : "Luna"}</span>
                    </div>
                  </div>
                  {post.isLiked && (
                    <div className="absolute top-1.5 right-1.5">
                      <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500 drop-shadow" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selected !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          data-testid="memory-lightbox"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-4 shrink-0">
            <div className="flex items-center gap-2">
              <img src={posts[selected].user.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
              <span className="text-white text-sm font-medium">
                {posts[selected].user.id === "me" ? "You" : "Luna"}
              </span>
              <span className="text-white/50 text-xs">· {posts[selected].timeAgo}</span>
            </div>
            <button onClick={() => setSelected(null)} className="text-white/70 hover:text-white p-1" data-testid="button-close-lightbox">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Image */}
          <div className="flex-1 flex items-center justify-center px-4 relative">
            {selected > 0 && (
              <button onClick={prev} className="absolute left-2 text-white/70 hover:text-white p-2 z-10" data-testid="button-prev-memory">
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            <motion.img
              key={selected}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              src={posts[selected].image}
              alt=""
              className="max-h-full max-w-full object-contain rounded-lg"
            />
            {selected < posts.length - 1 && (
              <button onClick={next} className="absolute right-2 text-white/70 hover:text-white p-2 z-10" data-testid="button-next-memory">
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </div>

          {/* Caption */}
          <div className="px-4 py-4 shrink-0">
            <p className="text-white/80 text-sm leading-relaxed">{posts[selected].caption}</p>
            <div className="flex items-center gap-3 mt-2">
              <Heart className={`w-5 h-5 ${posts[selected].isLiked ? "fill-red-500 text-red-500" : "text-white/50"}`} />
              <span className="text-white/50 text-xs">{selected + 1} / {posts.length}</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
