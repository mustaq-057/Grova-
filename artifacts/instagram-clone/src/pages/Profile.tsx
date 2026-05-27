import { useState } from "react";
import { Grid3x3, Bookmark, Settings, Edit3, Check, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ME, WIFE, MY_PROFILE_POSTS, WIFE_PROFILE_POSTS, SAVED_POSTS } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";

type Tab = "posts" | "saved";

export default function Profile() {
  const { user } = useAuth();
  const [location] = useLocation();
  const isWife = location === "/profile/wife";
  const profileUser = isWife ? WIFE : ME;

  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profileUser.name);
  const [bio, setBio] = useState(profileUser.bio);
  const [pendingName, setPendingName] = useState(name);
  const [pendingBio, setPendingBio] = useState(bio);

  const posts = isWife ? WIFE_PROFILE_POSTS : MY_PROFILE_POSTS;
  const isMyProfile = user?.id !== undefined && (isWife ? user.id === "wife" : user.id === "me");

  const startEdit = () => { setPendingName(name); setPendingBio(bio); setEditing(true); };
  const saveEdit = () => { setName(pendingName); setBio(pendingBio); setEditing(false); };
  const cancelEdit = () => setEditing(false);

  const displayedPosts = activeTab === "saved" ? SAVED_POSTS : posts;

  return (
    <div className="max-w-[600px] mx-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="flex gap-2">
          <Link href="/profile">
            <button className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${!isWife ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`} data-testid="button-my-profile">
              {user?.id === "me" ? "My Profile" : "Mako's"}
            </button>
          </Link>
          <Link href="/profile/wife">
            <button className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${isWife ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`} data-testid="button-wife-profile">
              {user?.id === "wife" ? "My Profile" : "Luna's"}
            </button>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          {isMyProfile && !editing && (
            <button onClick={startEdit} className="text-muted-foreground hover:text-foreground p-2" data-testid="button-edit">
              <Edit3 className="w-4 h-4" />
            </button>
          )}
          <Link href="/settings">
            <button className="text-muted-foreground hover:text-foreground p-2" data-testid="button-settings">
              <Settings className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </Link>
        </div>
      </div>

      {/* Profile card */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-start gap-6 md:gap-10">
          <div className="story-ring hover:scale-105 transition-transform cursor-pointer shrink-0">
            <div className="bg-background rounded-full p-[3px]">
              <img src={profileUser.avatar} alt="" className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover" data-testid="img-avatar" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {/* Stats */}
            <div className="flex gap-6 mb-4">
              <div>
                <p className="font-bold text-base">{posts.length}</p>
                <p className="text-xs text-muted-foreground">posts</p>
              </div>
              <div>
                <p className="font-bold text-base">1</p>
                <p className="text-xs text-muted-foreground">{isWife ? (user?.id === "wife" ? "husband" : "following") : (user?.id === "me" ? "wife" : "following")}</p>
              </div>
              <div>
                <p className="font-bold text-base">1</p>
                <p className="text-xs text-muted-foreground">follower</p>
              </div>
            </div>

            {/* Bio / edit */}
            {isMyProfile && editing ? (
              <div className="space-y-2">
                <input value={pendingName} onChange={(e) => setPendingName(e.target.value)} className="w-full bg-secondary rounded-lg px-3 py-2 text-sm outline-none border border-border focus:border-primary transition-colors" placeholder="Name" data-testid="input-name" />
                <textarea value={pendingBio} onChange={(e) => setPendingBio(e.target.value)} rows={2} className="w-full bg-secondary rounded-lg px-3 py-2 text-sm outline-none resize-none border border-border focus:border-primary transition-colors" placeholder="Bio" data-testid="input-bio" />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg" data-testid="button-save-profile">
                    <Check className="w-3.5 h-3.5" /> Save
                  </button>
                  <button onClick={cancelEdit} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-sm font-semibold rounded-lg" data-testid="button-cancel-edit">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="font-semibold text-base">{name}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{bio}</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">@{profileUser.username}</p>
                {isMyProfile && (
                  <button onClick={startEdit} className="mt-3 px-4 py-1.5 bg-secondary text-sm font-semibold rounded-lg hover:bg-secondary/80 transition-colors" data-testid="button-edit-profile">
                    Edit profile
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-t border-border">
        {([{ id: "posts" as Tab, icon: Grid3x3, label: "Posts" }, { id: "saved" as Tab, icon: Bookmark, label: "Saved" }]).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-widest transition-colors relative ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`} data-testid={`button-tab-${tab.id}`}>
              {isActive && <motion.div layoutId="profile-tab" className="absolute top-0 left-0 right-0 h-px bg-foreground" />}
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <motion.div key={activeTab + location} className="grid grid-cols-3 gap-0.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        {displayedPosts.length === 0 ? (
          <div className="col-span-3 flex flex-col items-center py-16 gap-3">
            <Grid3x3 className="w-12 h-12 text-muted-foreground/20" />
            <p className="text-muted-foreground text-sm">No posts yet</p>
          </div>
        ) : (
          displayedPosts.map((post) => (
            <div key={post.id} className="relative aspect-square overflow-hidden group cursor-pointer" data-testid={`grid-post-${post.id}`}>
              <img src={post.image} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-sm font-semibold">♥ {post.likes}</span>
              </div>
            </div>
          ))
        )}
      </motion.div>
    </div>
  );
}
