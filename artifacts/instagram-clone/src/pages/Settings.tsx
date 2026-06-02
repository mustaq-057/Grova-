import { useState, memo } from "react";
import { ChevronRight, User, Lock, Bell, Moon, Sun, LogOut, Heart, Shield, Smartphone, Eye, EyeOff, Check, Edit3, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { AvatarImage } from "@/components/AvatarImage";
import { api } from "@/lib/api";
import { ImageCropModal } from "@/components/ImageCropModal";
import { useProfileAvatarCrop } from "@/hooks/useProfileAvatarCrop";
import {
  isReadReceiptsEnabled,
  isShowPresenceEnabled,
  areNotificationsEnabled,
  applyCouplePrefs,
} from "@/lib/couple-sync";
import { initEncryption } from "@/lib/crypto";
import { hydrateNotifications } from "@/lib/notifications-feed";
import { Link } from "wouter";
import { applyColorMode, applyAppTheme, getStoredAppTheme, getStoredDarkMode, type AppThemeId } from "@/lib/app-theme";
import { AppThemeModal } from "@/components/AppThemeModal";

function Toggle({ on, toggle }: { on: boolean; toggle: () => void }) {
  return (
    <button onClick={toggle} className={`relative w-12 h-7 rounded-full transition-all shadow-sm ${on ? "bg-gradient-to-r from-primary to-primary/80" : "bg-secondary"}`}>
      <motion.div layout className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md"
        animate={{ left: on ? "calc(100% - 1.625rem)" : "0.125rem" }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
    </button>
  );
}

export default memo(function Settings() {
  const { user, partner, setUser, logout, refreshProfiles } = useAuth();

  const [darkMode, setDarkMode] = useState(() => getStoredDarkMode());
  const [appTheme, setAppTheme] = useState<AppThemeId>(() => getStoredAppTheme());
  const [showAppThemes, setShowAppThemes] = useState(false);
  const [notifications, setNotifications] = useState(() => areNotificationsEnabled());

  // Name/bio editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [pendingName, setPendingName] = useState(user?.name || "");
  const [pendingBio, setPendingBio] = useState(user?.bio || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const avatarCrop = useProfileAvatarCrop();

  // Change code modal
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [currentCode, setCurrentCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [codeSuccess, setCodeSuccess] = useState(false);
  const [savingCode, setSavingCode] = useState(false);

  const toggleDark = () => {
    setDarkMode((d: boolean) => {
      const next = !d;
      applyColorMode(next);
      applyAppTheme(appTheme);
      return next;
    });
  };

  const [readReceipts, setReadReceipts] = useState(() => isReadReceiptsEnabled());
  const [showPresence, setShowPresence] = useState(() => isShowPresenceEnabled());

  const syncPref = async (patch: {
    readReceipts?: boolean;
    showPresence?: boolean;
    notifications?: boolean;
    appTheme?: AppThemeId;
  }) => {
    try {
      const prefs = await api.updateCouplePrefs(patch);
      applyCouplePrefs(prefs);
    } catch (err) {
      console.error("Failed to sync preference:", err);
    }
  };

  const toggleNotifs = () => {
    setNotifications((n) => {
      const v = !n;
      syncPref({ notifications: v });
      return v;
    });
  };
  const toggleReceipts = () => {
    setReadReceipts((r) => {
      const v = !r;
      syncPref({ readReceipts: v });
      return v;
    });
  };
  const togglePresence = () => {
    setShowPresence((p) => {
      const v = !p;
      syncPref({ showPresence: v });
      return v;
    });
  };

  const saveProfile = async () => {
    if (!user) return;
    const trimmedName = pendingName.trim();
    if (!trimmedName) {
      toast.error("Name cannot be empty");
      return;
    }
    setSavingProfile(true);
    try {
      const updated = await api.updateProfile(user.id, { name: trimmedName, bio: pendingBio.trim() });
      setUser({ ...user, name: updated.name, bio: updated.bio, avatar: updated.avatar, username: updated.username });
      await refreshProfiles();
      await hydrateNotifications();
      setEditingProfile(false);
      toast.success("Profile saved");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error(error instanceof Error ? error.message : "Could not save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangeCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError("");
    if (newCode !== confirmCode) { setCodeError("New codes don't match"); return; }
    if (newCode.length < 4) { setCodeError("Min 4 characters"); return; }
    setSavingCode(true);
    try {
      await api.updateCoupleCode(currentCode, newCode);
      await initEncryption(newCode);
      setCodeSuccess(true);
      setCurrentCode(""); setNewCode(""); setConfirmCode("");
      toast.success(`Code updated. You and ${partner?.name ?? "your partner"} both use this same code to unlock.`);
      setTimeout(() => { setCodeSuccess(false); setShowCodeModal(false); }, 1500);
    } catch (err: unknown) {
      console.error('Failed to change code:', err);
      setCodeError(err instanceof Error ? err.message : 'Wrong current code');
    } finally { setSavingCode(false); }
  };

  return (
    <div className="max-w-[600px] mx-auto pb-20 md:pb-6">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-4 py-5 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur z-10"
      >
        <h1 className="text-lg font-semibold">Settings</h1>
        {user && <p className="text-xs text-muted-foreground mt-0.5">Signed in as {user.name}</p>}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="p-4 space-y-4"
      >
        {/* ── Profile section card ── */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden shadow-sm">
          <p className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50">Profile</p>

          {editingProfile ? (
            <div className="px-4 py-4 space-y-3">
              <div className="flex flex-col items-center gap-2 pb-2">
                <div className="relative">
                  <AvatarImage src={user?.avatar} userId={user?.id ?? "me"} alt="" className="w-20 h-20 rounded-full object-cover ring-2 ring-border" />
                  <button
                    type="button"
                    onClick={() => document.getElementById("settings-avatar-upload")?.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg"
                    aria-label="Change profile photo"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input id="settings-avatar-upload" type="file" accept="image/*" className="hidden" onChange={avatarCrop.handleAvatarFileChange} disabled={avatarCrop.uploading} />
                <p className="text-xs text-primary font-medium">Change profile photo</p>
              </div>
              <input 
                value={pendingName} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPendingName(e.target.value)}
                placeholder="Display name" 
                className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 transition-all glass-input" 
                data-testid="input-name"
                aria-label="Display name"
              />
              <textarea 
                value={pendingBio} 
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPendingBio(e.target.value)} 
                rows={2}
                placeholder="Bio" 
                className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 transition-all resize-none glass-input" 
                data-testid="input-bio"
                aria-label="Bio"
              />
              <div className="flex gap-2">
                <button 
                  onClick={saveProfile} 
                  disabled={savingProfile || !pendingName.trim()}
                  className="flex-1 py-2.5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 active:scale-95 glass-button" 
                  data-testid="button-save-profile"
                  aria-label="Save profile changes"
                >
                  <Check className="w-3.5 h-3.5" />{savingProfile ? "Saving..." : "Save"}
                </button>
                <button 
                  onClick={() => setEditingProfile(false)} 
                  className="px-4 py-2.5 bg-secondary text-sm font-semibold rounded-xl flex items-center gap-1 hover:bg-secondary/80 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 active:scale-95" 
                  data-testid="button-cancel-edit"
                  aria-label="Cancel profile edit"
                >
                  <X className="w-3.5 h-3.5" />Cancel
                </button>
              </div>
            </div>
          ) : (
            <motion.div whileTap={{ scale: 0.99 }} onClick={() => { setPendingName(user?.name || ""); setPendingBio(user?.bio || ""); setEditingProfile(true); }}
              className="flex items-center gap-4 px-4 py-3.5 hover:bg-secondary/30 transition-colors cursor-pointer" data-testid="button-edit-profile">
              <div className="relative shrink-0">
                <AvatarImage src={user?.avatar} userId={user?.id ?? "me"} alt={`Profile picture of ${user?.name}`} className="w-12 h-12 rounded-full object-cover shadow-md" />
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-secondary rounded-full flex items-center justify-center border border-border shadow-sm">
                  <Edit3 className="w-3 h-3 text-muted-foreground" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.bio || "Tap to add a bio"}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </motion.div>
          )}
        </div>

        {/* ── Account card ── */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden shadow-sm">
          <p className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50">Account</p>
          <motion.div whileTap={{ scale: 0.99 }} onClick={() => setShowCodeModal(true)}
            className="flex items-center gap-4 px-4 py-3.5 hover:bg-secondary/30 transition-colors cursor-pointer" data-testid="button-change-code">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><Lock className="w-5 h-5 text-primary" strokeWidth={1.5} /></div>
            <div className="flex-1"><p className="text-sm font-medium">Change code</p><p className="text-xs text-muted-foreground">One shared code for both of you</p></div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.div>
          <div className="flex items-center gap-4 px-4 py-3.5">
            <div className="w-10 h-10 bg-secondary/50 rounded-xl flex items-center justify-center"><Smartphone className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} /></div>
            <div className="flex-1"><p className="text-sm font-medium">Connected devices</p><p className="text-xs text-muted-foreground">This device is authorized</p></div>
          </div>
        </div>

        {/* ── Privacy card ── */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden shadow-sm">
          <p className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50">Privacy</p>
          <div className="flex items-center gap-4 px-4 py-3.5">
            <div className="w-10 h-10 bg-secondary/50 rounded-xl flex items-center justify-center"><Shield className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} /></div>
            <div className="flex-1"><p className="text-sm font-medium">Read receipts</p><p className="text-xs text-muted-foreground">Let each other see when messages are read</p></div>
            <Toggle on={readReceipts} toggle={toggleReceipts} />
          </div>
          <div className="flex items-center gap-4 px-4 py-3.5 border-t border-border/50">
            <div className="w-10 h-10 bg-secondary/50 rounded-xl flex items-center justify-center"><User className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} /></div>
            <div className="flex-1"><p className="text-sm font-medium">Activity status</p><p className="text-xs text-muted-foreground">Show when you&apos;re active online</p></div>
            <Toggle on={showPresence} toggle={togglePresence} />
          </div>
        </div>

        {/* ── Notifications card ── */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden shadow-sm">
          <p className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50">Notifications</p>
          <div className="flex items-center gap-4 px-4 py-3.5">
            <div className="w-10 h-10 bg-secondary/50 rounded-xl flex items-center justify-center"><Bell className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} /></div>
            <div className="flex-1"><p className="text-sm font-medium">Push notifications</p><p className="text-xs text-muted-foreground">Alerts for messages and posts</p></div>
            <Toggle on={notifications} toggle={toggleNotifs} />
          </div>
        </div>

        {/* ── Activity notifications ── */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden shadow-sm">
          <p className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50">
            Activity
          </p>
          <Link href="/notifications">
            <button
              type="button"
              className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-secondary/30 text-left"
            >
              <div className="w-10 h-10 bg-secondary/50 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Notifications</p>
                <p className="text-xs text-muted-foreground">Likes & comments on photos</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </Link>
        </div>

        {/* ── Appearance card ── */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden shadow-sm">
          <p className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50">Appearance</p>
          <div className="flex items-center gap-4 px-4 py-3.5">
            <div className="w-10 h-10 bg-secondary/50 rounded-xl flex items-center justify-center">
              {darkMode ? <Moon className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} /> : <Sun className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />}
            </div>
            <div className="flex-1"><p className="text-sm font-medium">Dark mode</p><p className="text-xs text-muted-foreground">{darkMode ? "Currently dark" : "Currently light"}</p></div>
            <Toggle on={darkMode} toggle={toggleDark} />
          </div>
          <button
            type="button"
            onClick={() => setShowAppThemes(true)}
            className="w-full flex items-center gap-4 px-4 py-3.5 border-t border-border/50 hover:bg-secondary/30 text-left"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500/30 to-violet-500/30 rounded-xl" />
            <div className="flex-1">
              <p className="text-sm font-medium">App theme</p>
              <p className="text-xs text-muted-foreground">Rose Love, Ocean, Midnight & more</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <AppThemeModal
          show={showAppThemes}
          onClose={() => setShowAppThemes(false)}
          current={appTheme}
          onSelect={(themeId) => {
            setAppTheme(themeId);
            applyAppTheme(themeId);
            syncPref({ appTheme: themeId });
          }}
        />

        {avatarCrop.avatarToCrop && (
          <ImageCropModal
            imageSrc={avatarCrop.avatarToCrop}
            title="Crop profile photo"
            initialAspect="1:1"
            onCancel={avatarCrop.cancelCrop}
            onApply={avatarCrop.applyCrop}
          />
        )}

        {/* ── About card ── */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden shadow-sm">
          <p className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50">About</p>
          <div className="flex items-center gap-4 px-4 py-3.5">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl flex items-center justify-center"><Heart className="w-5 h-5 text-pink-500" strokeWidth={1.5} /></div>
            <div className="flex-1"><p className="text-sm font-medium">Grova v1.1</p><p className="text-xs text-muted-foreground">Built just for two ♥</p></div>
          </div>
        </div>

        {/* ── Logout button ── */}
        <motion.div whileTap={{ scale: 0.99 }} onClick={logout} className="flex items-center justify-center gap-2 px-4 py-3.5 bg-destructive/10 border border-destructive/20 rounded-2xl hover:bg-destructive/20 transition-colors cursor-pointer" data-testid="button-logout">
          <LogOut className="w-5 h-5 text-destructive" strokeWidth={1.5} />
          <p className="text-sm font-medium text-destructive">Log out</p>
        </motion.div>
      </motion.div>

      {/* ── Change Code Modal ── */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-6" data-testid="modal-change-code">
          <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Change Code</h3>
              <button onClick={() => { setShowCodeModal(false); setCodeError(""); setCurrentCode(""); setNewCode(""); setConfirmCode(""); }} className="text-muted-foreground hover:text-foreground w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary/50 transition-all">✕</button>
            </div>
            {codeSuccess ? (
              <div className="flex flex-col items-center gap-2 py-4"><Check className="w-10 h-10 text-green-500" /><p className="font-semibold">Code updated!</p></div>
            ) : (
              <form onSubmit={handleChangeCode} className="space-y-3">
                <div className="relative">
                  <input 
                    type={showCurrent ? "text" : "password"} 
                    value={currentCode} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentCode(e.target.value)} 
                    placeholder="Current code"
                    className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 transition-all pr-9 glass-input" 
                    aria-label="Current code"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowCurrent((s: boolean) => !s)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 rounded p-1"
                    aria-label={showCurrent ? "Hide current code" : "Show current code"}
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type={showNew ? "text" : "password"} 
                    value={newCode} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCode(e.target.value)} 
                    placeholder="New code (min 4 chars)"
                    className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 transition-all pr-9 glass-input" 
                    aria-label="New code"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowNew((s: boolean) => !s)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 rounded p-1"
                    aria-label={showNew ? "Hide new code" : "Show new code"}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <input 
                  type="password" 
                  value={confirmCode} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmCode(e.target.value)} 
                  placeholder="Confirm new code"
                  className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 transition-all glass-input" 
                  aria-label="Confirm new code"
                />
                {codeError && <p className="text-destructive text-xs font-medium">{codeError}</p>}
                <button 
                  type="submit" 
                  disabled={savingCode || !currentCode || !newCode || !confirmCode}
                  className="w-full py-2.5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 active:scale-95 glass-button"
                >
                  {savingCode ? "Saving..." : "Update Code"}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
});
