import { useState, useEffect } from "react";
import { Grid3x3, Bookmark, Settings, Edit3, Check, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { MY_PROFILE_POSTS, WIFE_PROFILE_POSTS, SAVED_POSTS } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { api, type ApiUser } from "@/lib/api";

type Tab = "posts" | "saved";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [location] = useLocation();
  const isWife = location === "/profile/wife";

  const [tab, setTab] = useState<Tab>("posts");
  const [editing, setEditing] = useState(false);
  const [pendingName, setPendingName] = useState("");
  const [pendingBio, setPendingBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<Pick<ApiUser, "name" | "bio" | "avatar"> | null>(null);

  const myId = user?.id ?? "me";
  const partnerId = myId === "me" ? "wife" : "me";
  const isViewingMine = (myId === "me" && !isWife) || (myId === "wife" && isWife);

  // Load partner info from API (so both see each other's latest name)
  useEffect(() => {
    api.getUsers().then(users => {
      const p = users.find(u => u.id === partnerId);
      if (p) setPartnerInfo({ name: p.name, bio: p.bio, avatar: p.avatar });
    }).catch(() => {});
  }, [partnerId]);

  // Current displayed profile
  const displayedUser = isViewingMine
    ? { id: myId, name: user?.name ?? "", bio: user?.bio ?? "", avatar: user?.avatar ?? "", username: user?.username ?? "" }
    : partnerInfo
      ? { id: partnerId, name: partnerInfo.name, bio: partnerInfo.bio, avatar: partnerInfo.avatar, username: partnerId === "me" ? "mustaq" : "sara" }
      : { id: partnerId, name: partnerId === "me" ? "Mustaq" : "Sara", bio: "", avatar: `https://picsum.photos/seed/${partnerId === "me" ? "mustaq" : "sara"}/150/150`, username: partnerId === "me" ? "mustaq" : "sara" };

  const posts = isWife ? WIFE_PROFILE_POSTS : MY_PROFILE_POSTS;
  const displayedPosts = tab === "saved" ? SAVED_POSTS : posts;

  const startEdit = () => { setPendingName(displayedUser.name); setPendingBio(displayedUser.bio); setEditing(true); };
  const cancelEdit = () => setEditing(false);

  const saveEdit = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await api.updateProfile(user.id, { name: pendingName.trim(), bio: pendingBio.trim() });
      setUser({ ...user, name: updated.name, bio: updated.bio });
      setEditing(false);
    } catch { /**/ }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-[600px] mx-auto pb-20 md:pb-6">
      {/* Header tabs */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="flex gap-2">
          <Link href="/profile">
            <button className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${!isWife ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              data-testid="button-my-profile">
              {myId === "me" ? "Mustaq" : "Sara"} (Me)
            </button>
          </Link>
          <Link href="/profile/wife">
            <button className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${isWife ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              data-testid="button-partner-profile">
              {myId === "me" ? "Sara" : "Mustaq"}
            </button>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          {isViewingMine && !editing && (
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
              <img src={displayedUser.avatar} alt="" className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover" data-testid="img-avatar" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex gap-6 mb-4">
              <div><p className="font-bold text-base">{posts.length}</p><p className="text-xs text-muted-foreground">posts</p></div>
              <div><p className="font-bold text-base">1</p><p className="text-xs text-muted-foreground">following</p></div>
              <div><p className="font-bold text-base">1</p><p className="text-xs text-muted-foreground">follower</p></div>
            </div>

            {isViewingMine && editing ? (
              <div className="space-y-2">
                <input value={pendingName} onChange={e => setPendingName(e.target.value)} placeholder="Name"
                  className="w-full bg-secondary rounded-lg px-3 py-2 text-sm outline-none border border-border focus:border-primary" data-testid="input-name" />
                <textarea value={pendingBio} onChange={e => setPendingBio(e.target.value)} rows={2} placeholder="Bio"
                  className="w-full bg-secondary rounded-lg px-3 py-2 text-sm outline-none resize-none border border-border focus:border-primary" data-testid="input-bio" />
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={saving || !pendingName.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg disabled:opacity-50" data-testid="button-save-profile">
                    <Check className="w-3.5 h-3.5" />{saving ? "Saving..." : "Save"}
                  </button>
                  <button onClick={cancelEdit} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-sm font-semibold rounded-lg" data-testid="button-cancel-edit">
                    <X className="w-3.5 h-3.5" />Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="font-semibold text-base">{displayedUser.name}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{displayedUser.bio}</p>
                <p className="text-xs text-muted-foreground/50 mt-0.5">@{displayedUser.username}</p>
                {isViewingMine && (
                  <button onClick={startEdit} className="mt-3 px-4 py-1.5 bg-secondary text-sm font-semibold rounded-lg hover:bg-secondary/80 transition-colors" data-testid="button-edit-inline">
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
        {([{ id: "posts" as Tab, icon: Grid3x3, label: "Posts" }, { id: "saved" as Tab, icon: Bookmark, label: "Saved" }]).map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-widest transition-colors relative ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              data-testid={`button-tab-${t.id}`}>
              {active && <motion.div layoutId="profile-tab" className="absolute top-0 left-0 right-0 h-px bg-foreground" />}
              <Icon className="w-4 h-4" /><span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <motion.div key={tab + location} className="grid grid-cols-3 gap-0.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        {displayedPosts.length === 0 ? (
          <div className="col-span-3 flex flex-col items-center py-16 gap-3">
            <Grid3x3 className="w-12 h-12 text-muted-foreground/20" />
            <p className="text-muted-foreground text-sm">No posts yet</p>
            {isViewingMine && <Link href="/create"><button className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl">Share your first moment</button></Link>}
          </div>
        ) : displayedPosts.map(post => (
          <div key={post.id} className="relative aspect-square overflow-hidden group cursor-pointer" data-testid={`grid-post-${post.id}`}>
            <img src={post.image} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-semibold">♥ {post.likes}</span>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
