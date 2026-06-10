import { useState, useEffect, memo } from "react";
import { Settings, Bell, Edit3, Check, X, Camera, Grid3X3, Layers } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { ImageCropModal } from "@/components/ImageCropModal";
import { useProfileAvatarCrop } from "@/hooks/useProfileAvatarCrop";
import { unreadCount, NOTIFY_CHANGED } from "@/lib/notifications-feed";
import { AvatarImage } from "@/components/AvatarImage";
import { getPosts, clearLegacyLocalMedia, type StoredPost } from "@/lib/local-posts";
import { resolvePostMediaUrl } from "@/lib/media-url";
import { getPostMediaUrls, postHasCarousel } from "@/lib/post-media";

export default memo(function Profile() {
  const { user, setUser, partner, refreshProfiles, trustedDevice } = useAuth();
  const [editing, setEditing] = useState(false);
  const [pendingName, setPendingName] = useState("");
  const [pendingBio, setPendingBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarZoom, setAvatarZoom] = useState(false);
  const [notifCount, setNotifCount] = useState(() => unreadCount());
  const [posts, setPosts] = useState<StoredPost[]>([]);
  const [codes, setCodes] = useState<{ me: string; wife: string } | null>(null);
  const partnerId = user?.id === "me" ? "wife" : "me";
  const avatarCrop = useProfileAvatarCrop();

  useEffect(() => {
    if (trustedDevice) {
      api.getProfileCodes()
        .then(setCodes)
        .catch(console.error);
    }
  }, [trustedDevice]);


  useEffect(() => {
    const refresh = () => setNotifCount(unreadCount());
    window.addEventListener(NOTIFY_CHANGED, refresh);
    return () => window.removeEventListener(NOTIFY_CHANGED, refresh);
  }, []);

  useEffect(() => {
    if (!user) return;
    clearLegacyLocalMedia(user.id);
    clearLegacyLocalMedia(partnerId);
    getPosts(user.id)
      .then(setPosts)
      .catch(console.error);
  }, [user?.id, partnerId]);

  if (!user) return null;

  const startEdit = () => {
    setPendingName(user.name);
    setPendingBio(user.bio);
    setEditing(true);
  };

  const saveEdit = async () => {
    const trimmedName = pendingName.trim();
    if (!trimmedName) {
      toast.error("Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      const updated = await api.updateProfile(user.id, {
        name: trimmedName,
        bio: pendingBio.trim(),
      });
      setUser({ ...user, name: updated.name, bio: updated.bio, avatar: updated.avatar, username: updated.username });
      void refreshProfiles();
      setEditing(false);
      toast.success("Profile saved");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error(error instanceof Error ? error.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[600px] mx-auto pb-20 md:pb-6 app-chrome">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-4 py-4 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur z-10"
      >
        <h1 className="font-semibold text-lg">{user.name}</h1>
        <div className="flex items-center gap-1">
          <Link href="/notifications">
            <button
              type="button"
              className="relative w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary/50"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-[10px] text-white rounded-full flex items-center justify-center">
                  {notifCount}
                </span>
              )}
            </button>
          </Link>
          {!editing && (
            <button
              type="button"
              onClick={startEdit}
              className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary/50"
              aria-label="Edit profile"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
          <Link href="/settings">
            <button
              type="button"
              className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary/50"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </motion.div>

      <div className="px-4 pt-10 pb-8 flex flex-col items-center text-center">
        <div className="flex items-center justify-center gap-8 mb-6 w-full">
          <div className="flex flex-col items-center gap-1">
            <AvatarImage src={partner?.avatar} userId={partnerId} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-border" />
            <span className="text-[10px] text-muted-foreground truncate max-w-[64px]">{partner?.name?.split(" ")[0] ?? "…"}</span>
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setAvatarZoom(true)}
              className="rounded-full"
            >
              <AvatarImage
                src={user.avatar}
                userId={user.id}
                alt={user.name}
                className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover ring-2 ring-border"
              />
            </button>
            <button
              type="button"
              onClick={() => document.getElementById("avatar-upload")?.click()}
              className="absolute bottom-0 right-0 w-9 h-9 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg ring-2 ring-background"
              title="Change photo"
              aria-label="Change profile photo"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={avatarCrop.handleAvatarFileChange} disabled={avatarCrop.uploading} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4 -mt-2">Tap photo to enlarge · camera to change</p>

        {editing ? (
          <div className="w-full max-w-sm space-y-3">
            <div className="flex flex-col items-center gap-2 pb-2">
              <div className="relative">
                <AvatarImage
                  src={user.avatar}
                  userId={user.id}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-border"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("avatar-upload-edit")?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg"
                  aria-label="Change profile photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <input id="avatar-upload-edit" type="file" accept="image/*" className="hidden" onChange={avatarCrop.handleAvatarFileChange} disabled={avatarCrop.uploading} />
              <p className="text-xs text-primary font-medium">Change profile photo</p>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider text-center">Profile</p>
            <input
              value={pendingName}
              onChange={(e) => setPendingName(e.target.value)}
              className="w-full bg-secondary/50 rounded-xl px-4 py-2.5 text-sm outline-none border border-border/50 text-center"
            />
            <textarea
              value={pendingBio}
              onChange={(e) => setPendingBio(e.target.value)}
              rows={2}
              className="w-full bg-secondary/50 rounded-xl px-4 py-2.5 text-sm outline-none resize-none border border-border/50 text-center"
            />
            <div className="flex gap-2 justify-center">
              <button
                onClick={saveEdit}
                disabled={saving || !pendingName.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setEditing(false)} className="px-4 py-2 bg-secondary text-sm font-semibold rounded-xl">
                <X className="w-3.5 h-3.5 inline" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="font-semibold text-xl">{user.name}</p>
            <p className="text-sm text-muted-foreground mt-1">{user.bio}</p>
            <p className="text-xs text-muted-foreground/50 mt-1">@{user.username}</p>
          </>
        )}
      </div>

      {trustedDevice && codes && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 mb-6 w-full max-w-sm mx-auto p-4 rounded-2xl border border-primary/25 bg-primary/5 backdrop-blur-sm shadow-sm flex flex-col items-center gap-3"
        >
          <div className="flex items-center gap-2 text-primary font-medium text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Authorized Device
          </div>
          <div className="flex items-center justify-between w-full gap-4 px-2">
            <div className="flex-1 flex flex-col items-center p-2 bg-background/60 rounded-xl border border-border/45">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">My Code</span>
              <span className="font-mono text-sm font-semibold text-foreground mt-0.5">{codes[user.id]}</span>
            </div>
            <div className="flex-1 flex flex-col items-center p-2 bg-background/60 rounded-xl border border-border/45">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{partner?.name || "Partner"}'s Code</span>
              <span className="font-mono text-sm font-semibold text-foreground mt-0.5">{codes[partnerId]}</span>
            </div>
          </div>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            ✓ Autoentering enabled
          </p>
        </motion.div>
      )}


      {posts.length > 0 && (
        <div className="border-t border-border px-1 pb-8">
          <div className="flex items-center gap-2 px-3 py-3">
            <Grid3X3 className="w-4 h-4" />
            <span className="text-sm font-semibold">Posts</span>
            <span className="text-xs text-muted-foreground">{posts.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-0.5">
            {posts.map((post) => (
              <div key={post.id} className="relative aspect-square bg-secondary/30 overflow-hidden">
                <img
                  src={resolvePostMediaUrl(getPostMediaUrls(post)[0]) ?? getPostMediaUrls(post)[0]}
                  alt={post.caption || "Post"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {postHasCarousel(post) && (
                  <span className="absolute top-1.5 right-1.5 text-white drop-shadow-md">
                    <Layers className="w-4 h-4" strokeWidth={2.5} />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {avatarCrop.avatarToCrop && (
        <ImageCropModal
          imageSrc={avatarCrop.avatarToCrop}
          title="Crop profile photo"
          initialAspect="1:1"
          onCancel={avatarCrop.cancelCrop}
          onApply={avatarCrop.applyCrop}
        />
      )}

      {avatarZoom && (
        <div
          className="fixed inset-0 z-[90] bg-black/90 flex items-center justify-center p-6"
          onClick={() => setAvatarZoom(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <AvatarImage
              src={user.avatar}
              userId={user.id}
              alt=""
              className="max-w-full max-h-full rounded-2xl object-contain"
            />
          </motion.div>
        </div>
      )}
    </div>
  );
});
