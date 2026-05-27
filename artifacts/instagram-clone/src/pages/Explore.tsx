import { useState } from "react";
import { Search, Heart, MessageCircle, Play } from "lucide-react";
import { motion } from "framer-motion";
import { MOCK_EXPLORE_GRID, MOCK_HASHTAGS } from "@/lib/mock-data";

export default function Explore() {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const items = MOCK_EXPLORE_GRID;

  // Build masonry-like 3-column layout
  const col1 = items.filter((_, i) => i % 3 === 0);
  const col2 = items.filter((_, i) => i % 3 === 1);
  const col3 = items.filter((_, i) => i % 3 === 2);

  function GridItem({ item }: { item: typeof items[0] }) {
    const [hovered, setHovered] = useState(false);
    return (
      <motion.div
        className="relative overflow-hidden cursor-pointer"
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
        data-testid={`card-explore-${item.id}`}
      >
        <img src={item.image} alt="" className="w-full object-cover block" loading="lazy" />
        {item.isVideo && (
          <div className="absolute top-2 right-2">
            <Play className="w-4 h-4 text-white fill-white drop-shadow" />
          </div>
        )}
        <motion.div
          className="absolute inset-0 bg-black/50 flex items-center justify-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="flex items-center gap-1 text-white font-semibold text-sm">
            <Heart className="w-5 h-5 fill-white" />
            <span>{item.likes.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 text-white font-semibold text-sm">
            <MessageCircle className="w-5 h-5 fill-white" />
            <span>{item.comments}</span>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="pb-16 md:pb-4">
      {/* Search bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-secondary rounded-lg pl-9 pr-4 py-2 text-sm outline-none placeholder:text-muted-foreground text-foreground"
            data-testid="input-search"
          />
        </div>

        {/* Hashtag pills */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
          {MOCK_HASHTAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                activeTag === tag
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
              data-testid={`button-tag-${tag.replace("#", "")}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Masonry grid */}
      <div className="flex gap-0.5 p-0.5">
        {[col1, col2, col3].map((col, ci) => (
          <div key={ci} className="flex-1 flex flex-col gap-0.5">
            {col.map((item) => (
              <GridItem key={item.id} item={item} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
