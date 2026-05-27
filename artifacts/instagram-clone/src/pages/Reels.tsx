import { useState } from "react";
import { Heart, MessageCircle, Send, Bookmark, Music, Play, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";
import { MOCK_REELS } from "@/lib/mock-data";

function ReelCard({ reel, isActive }: { reel: typeof MOCK_REELS[0]; isActive: boolean }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(reel.likes);
  const [muted, setMuted] = useState(true);

  const handleLike = () => {
    setLiked((p) => !p);
    setLikeCount((p) => (liked ? p - 1 : p + 1));
  };

  return (
    <div
      className={`relative h-screen w-full flex-shrink-0 overflow-hidden bg-black`}
      data-testid={`card-reel-${reel.id}`}
    >
      {/* Background gradient + thumbnail */}
      <div className={`absolute inset-0 bg-gradient-to-b ${reel.gradient}`} />
      <img
        src={reel.thumbnail}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />

      {/* Play icon overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0.6, scale: 0.9 }}
          animate={{ opacity: isActive ? 0 : 0.4, scale: 1 }}
          className="bg-black/30 rounded-full p-5"
        >
          <Play className="w-12 h-12 text-white fill-white" />
        </motion.div>
      </div>

      {/* Mute button */}
      <button
        onClick={() => setMuted((m) => !m)}
        className="absolute top-16 right-4 bg-black/30 rounded-full p-2 text-white"
        data-testid={`button-mute-${reel.id}`}
      >
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>

      {/* Right actions */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <motion.button
            whileTap={{ scale: 1.3 }}
            onClick={handleLike}
            className="text-white"
            data-testid={`button-like-${reel.id}`}
          >
            <Heart
              className={`w-7 h-7 transition-all ${liked ? "fill-red-500 text-red-500" : "text-white"}`}
              strokeWidth={1.5}
            />
          </motion.button>
          <span className="text-white text-xs font-medium">{likeCount.toLocaleString()}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button className="text-white" data-testid={`button-comment-${reel.id}`}>
            <MessageCircle className="w-7 h-7" strokeWidth={1.5} />
          </button>
          <span className="text-white text-xs font-medium">{reel.comments.toLocaleString()}</span>
        </div>

        <button className="text-white" data-testid={`button-share-${reel.id}`}>
          <Send className="w-7 h-7" strokeWidth={1.5} />
        </button>

        <motion.button whileTap={{ scale: 1.2 }} onClick={() => setSaved((s) => !s)} className="text-white" data-testid={`button-save-${reel.id}`}>
          <Bookmark className={`w-7 h-7 ${saved ? "fill-white" : ""}`} strokeWidth={1.5} />
        </motion.button>

        {/* Spinning disc */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 rounded-full border-2 border-white/40 overflow-hidden"
        >
          <img src={reel.user.avatar} alt="" className="w-full h-full object-cover" />
        </motion.div>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-20 left-4 right-16 text-white">
        <div className="flex items-center gap-2 mb-2">
          <img src={reel.user.avatar} alt="" className="w-8 h-8 rounded-full border border-white/40 object-cover" />
          <span className="font-semibold text-sm" data-testid={`text-username-${reel.id}`}>{reel.user.username}</span>
          <button className="text-xs border border-white/50 rounded px-2 py-0.5 font-medium ml-1">Follow</button>
        </div>
        <p className="text-sm leading-snug line-clamp-2 mb-2">{reel.caption}</p>
        <div className="flex items-center gap-1.5">
          <Music className="w-3.5 h-3.5 shrink-0" />
          <p className="text-xs text-white/80 truncate">{reel.audio}</p>
        </div>
      </div>
    </div>
  );
}

export default function Reels() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide" data-testid="reels-container">
      {MOCK_REELS.map((reel, i) => (
        <div
          key={reel.id}
          className="snap-start h-screen"
          onMouseEnter={() => setActiveIndex(i)}
        >
          <ReelCard reel={reel} isActive={activeIndex === i} />
        </div>
      ))}
    </div>
  );
}
