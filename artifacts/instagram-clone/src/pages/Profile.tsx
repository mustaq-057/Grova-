import { useState } from "react";
import { Grid3x3, Film, Tag, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { MOCK_USERS, MOCK_PROFILE_POSTS } from "@/lib/mock-data";

const ME = MOCK_USERS[0];

type Tab = "posts" | "reels" | "tagged";

export default function Profile() {
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [following, setFollowing] = useState(false);

  const tabs: { id: Tab; icon: typeof Grid3x3; label: string }[] = [
    { id: "posts", icon: Grid3x3, label: "Posts" },
    { id: "reels", icon: Film, label: "Reels" },
    { id: "tagged", icon: Tag, label: "Tagged" },
  ];

  const displayedPosts = activeTab === "tagged"
    ? MOCK_PROFILE_POSTS.slice(0, 9)
    : MOCK_PROFILE_POSTS;

  return (
    <div className="pb-16 md:pb-4 max-w-[935px] mx-auto">
      {/* Profile header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-start gap-6 md:gap-16">
          {/* Avatar */}
          <div className="shrink-0">
            <div className="story-ring">
              <div className="bg-background rounded-full p-[3px]">
                <img
                  src={ME.avatar}
                  alt={ME.username}
                  className="w-20 h-20 md:w-36 md:h-36 rounded-full object-cover"
                  data-testid="img-avatar"
                />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Username row */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <h1 className="text-xl font-light" data-testid="text-username">{ME.username}</h1>
              <div className="flex gap-2">
                {following ? (
                  <button
                    onClick={() => setFollowing(false)}
                    className="px-4 py-1.5 rounded-lg bg-secondary text-sm font-semibold hover:bg-secondary/80 transition-colors"
                    data-testid="button-following"
                  >
                    Following
                  </button>
                ) : (
                  <button
                    onClick={() => setFollowing(true)}
                    className="px-5 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                    data-testid="button-follow"
                  >
                    Follow
                  </button>
                )}
                <button
                  className="px-4 py-1.5 rounded-lg bg-secondary text-sm font-semibold hover:bg-secondary/80 transition-colors"
                  data-testid="button-message"
                >
                  Message
                </button>
              </div>
              <button className="text-muted-foreground hover:text-foreground" data-testid="button-settings">
                <Settings className="w-5 h-5" />
              </button>
            </div>

            {/* Stats — desktop */}
            <div className="hidden md:flex gap-8 mb-4">
              <div className="text-sm">
                <span className="font-semibold">{MOCK_PROFILE_POSTS.length}</span>{" "}
                <span className="text-muted-foreground">posts</span>
              </div>
              <div className="text-sm" data-testid="text-followers">
                <span className="font-semibold">{ME.followers.toLocaleString()}</span>{" "}
                <span className="text-muted-foreground">followers</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold">{ME.following.toLocaleString()}</span>{" "}
                <span className="text-muted-foreground">following</span>
              </div>
            </div>

            {/* Bio — desktop */}
            <div className="hidden md:block">
              <p className="font-semibold text-sm">{ME.name}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{ME.bio}</p>
            </div>
          </div>
        </div>

        {/* Bio — mobile */}
        <div className="md:hidden mt-3">
          <p className="font-semibold text-sm">{ME.name}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{ME.bio}</p>
        </div>

        {/* Stats — mobile */}
        <div className="md:hidden flex justify-around border-t border-border mt-4 pt-4 text-center">
          <div>
            <p className="font-semibold text-sm">{MOCK_PROFILE_POSTS.length}</p>
            <p className="text-xs text-muted-foreground">posts</p>
          </div>
          <div>
            <p className="font-semibold text-sm" data-testid="text-followers-mobile">{ME.followers.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">followers</p>
          </div>
          <div>
            <p className="font-semibold text-sm">{ME.following.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">following</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-t border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold uppercase tracking-widest transition-colors relative ${
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`button-tab-${tab.id}`}
            >
              {isActive && (
                <motion.div
                  layoutId="profile-tab-indicator"
                  className="absolute top-0 left-0 right-0 h-px bg-foreground"
                />
              )}
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Photo grid */}
      <motion.div
        key={activeTab}
        className="grid grid-cols-3 gap-0.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {displayedPosts.map((post, i) => (
          <div
            key={post.id}
            className="relative aspect-square overflow-hidden group cursor-pointer"
            data-testid={`card-post-${post.id}`}
          >
            <img
              src={post.image}
              alt=""
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            {post.isVideo && (
              <div className="absolute top-2 right-2">
                <Film className="w-4 h-4 text-white fill-white/70 drop-shadow" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <div className="flex items-center gap-1 text-white font-semibold text-sm">
                <span>♥</span> {post.likes.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 text-white font-semibold text-sm">
                <span>◯</span> {post.comments}
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
