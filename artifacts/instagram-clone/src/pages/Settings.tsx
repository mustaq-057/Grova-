import { useState } from "react";
import { ChevronRight, User, Lock, Bell, Moon, Sun, Info, LogOut, Heart, Shield, Smartphone, Eye, EyeOff, Check, Edit3, X } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Link } from "wouter";

function Toggle({ on, toggle }: { on: boolean; toggle: () => void }) {
  return (
    <button onClick={toggle} className={`relative w-11 h-6 rounded-full transition-colors ${on ? "bg-primary" : "bg-border"}`}>
      <motion.div layout className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow"
        animate={{ left: on ? "calc(100% - 1.375rem)" : "0.125rem" }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
    </button>
  );
}

export default function Settings() {
  const { user, setUser, logout } = useAuth();

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("grova_theme") !== "light");
  const [notifications, setNotifications] = useState(() => localStorage.getItem("grova_notifs") !== "off");
  const [readReceipts, setReadReceipts] = useState(() => localStorage.getItem("grova_receipts") !== "off");

  // Name/bio editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [pendingName, setPendingName] = useState(user?.name || "");
  const [pendingBio, setPendingBio] = useState(user?.bio || "");
  const [savingProfile, setSavingProfile] = useState(false);

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
    setDarkMode(d => {
      const next = !d;
      if (next) { document.documentElement.classList.add("dark"); localStorage.setItem("grova_theme", "dark"); }
      else { document.documentElement.classList.remove("dark"); localStorage.setItem("grova_theme", "light"); }
      return next;
    });
  };

  const toggleNotifs = () => setNotifications(n => { const v = !n; localStorage.setItem("grova_notifs", v ? "on" : "off"); return v; });
  const toggleReceipts = () => setReadReceipts(r => { const v = !r; localStorage.setItem("grova_receipts", v ? "on" : "off"); return v; });

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const updated = await api.updateProfile(user.id, { name: pendingName.trim(), bio: pendingBio.trim() });
      setUser({ ...user, name: updated.name, bio: updated.bio });
      setEditingProfile(false);
    } catch { /* ignore */ }
    finally { setSavingProfile(false); }
  };

  const handleChangeCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError("");
    if (newCode !== confirmCode) { setCodeError("New codes don't match"); return; }
    if (newCode.length < 4) { setCodeError("Min 4 characters"); return; }
    setSavingCode(true);
    try {
      await api.updateCoupleCode(currentCode, newCode);
      setCodeSuccess(true);
      setCurrentCode(""); setNewCode(""); setConfirmCode("");
      setTimeout(() => { setCodeSuccess(false); setShowCodeModal(false); }, 1500);
    } catch (err: unknown) {
      setCodeError(err instanceof Error ? err.message : "Wrong current code");
    } finally { setSavingCode(false); }
  };

  return (
    <div className="max-w-[600px] mx-auto pb-20 md:pb-6">
      <div className="px-4 py-5 border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <h1 className="text-lg font-semibold">Settings</h1>
        {user && <p className="text-xs text-muted-foreground mt-0.5">Signed in as {user.name}</p>}
      </div>

      {/* ── Profile section ── */}
      <div className="py-2 border-b border-border">
        <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Profile</p>

        {editingProfile ? (
          <div className="px-4 py-3 space-y-3">
            <input value={pendingName} onChange={e => setPendingName(e.target.value)}
              placeholder="Display name" className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary" data-testid="input-name" />
            <textarea value={pendingBio} onChange={e => setPendingBio(e.target.value)} rows={2}
              placeholder="Bio" className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary resize-none" data-testid="input-bio" />
            <div className="flex gap-2">
              <button onClick={saveProfile} disabled={savingProfile || !pendingName.trim()}
                className="flex-1 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-1" data-testid="button-save-profile">
                <Check className="w-3.5 h-3.5" />{savingProfile ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setEditingProfile(false)} className="px-4 py-2 bg-secondary text-sm font-semibold rounded-xl flex items-center gap-1" data-testid="button-cancel-edit">
                <X className="w-3.5 h-3.5" />Cancel
              </button>
            </div>
          </div>
        ) : (
          <motion.div whileTap={{ scale: 0.99 }} onClick={() => { setPendingName(user?.name || ""); setPendingBio(user?.bio || ""); setEditingProfile(true); }}
            className="flex items-center gap-4 px-4 py-3.5 hover:bg-secondary/40 transition-colors cursor-pointer" data-testid="button-edit-profile">
            <div className="relative shrink-0">
              <img src={user?.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-secondary rounded-full flex items-center justify-center border border-border">
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

      {/* ── Account ── */}
      <div className="py-2 border-b border-border">
        <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account</p>
        <motion.div whileTap={{ scale: 0.99 }} onClick={() => setShowCodeModal(true)}
          className="flex items-center gap-4 px-4 py-3.5 hover:bg-secondary/40 transition-colors cursor-pointer" data-testid="button-change-code">
          <div className="w-9 h-9 bg-secondary rounded-xl flex items-center justify-center"><Lock className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.5} /></div>
          <div className="flex-1"><p className="text-sm font-medium">Change couple code</p><p className="text-xs text-muted-foreground">Default: grova2024</p></div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </motion.div>
        <div className="flex items-center gap-4 px-4 py-3.5">
          <div className="w-9 h-9 bg-secondary rounded-xl flex items-center justify-center"><Smartphone className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.5} /></div>
          <div className="flex-1"><p className="text-sm font-medium">Connected devices</p><p className="text-xs text-muted-foreground">This device is authorized</p></div>
        </div>
      </div>

      {/* ── Privacy ── */}
      <div className="py-2 border-b border-border">
        <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Privacy</p>
        <div className="flex items-center gap-4 px-4 py-3.5">
          <div className="w-9 h-9 bg-secondary rounded-xl flex items-center justify-center"><Shield className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.5} /></div>
          <div className="flex-1"><p className="text-sm font-medium">Read receipts</p><p className="text-xs text-muted-foreground">Let each other see when messages are read</p></div>
          <Toggle on={readReceipts} toggle={toggleReceipts} />
        </div>
      </div>

      {/* ── Notifications ── */}
      <div className="py-2 border-b border-border">
        <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notifications</p>
        <div className="flex items-center gap-4 px-4 py-3.5">
          <div className="w-9 h-9 bg-secondary rounded-xl flex items-center justify-center"><Bell className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.5} /></div>
          <div className="flex-1"><p className="text-sm font-medium">Push notifications</p><p className="text-xs text-muted-foreground">Alerts for messages and posts</p></div>
          <Toggle on={notifications} toggle={toggleNotifs} />
        </div>
      </div>

      {/* ── Appearance ── */}
      <div className="py-2 border-b border-border">
        <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Appearance</p>
        <div className="flex items-center gap-4 px-4 py-3.5">
          <div className="w-9 h-9 bg-secondary rounded-xl flex items-center justify-center">
            {darkMode ? <Moon className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.5} /> : <Sun className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.5} />}
          </div>
          <div className="flex-1"><p className="text-sm font-medium">Dark mode</p><p className="text-xs text-muted-foreground">{darkMode ? "Currently dark" : "Currently light"}</p></div>
          <Toggle on={darkMode} toggle={toggleDark} />
        </div>
      </div>

      {/* ── About ── */}
      <div className="py-2 border-b border-border">
        <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">About</p>
        <div className="flex items-center gap-4 px-4 py-3.5">
          <div className="w-9 h-9 bg-secondary rounded-xl flex items-center justify-center"><Heart className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.5} /></div>
          <div className="flex-1"><p className="text-sm font-medium">Grova v1.0</p><p className="text-xs text-muted-foreground">Built just for two ♥</p></div>
        </div>
      </div>

      {/* ── Logout ── */}
      <div className="py-2">
        <motion.div whileTap={{ scale: 0.99 }} onClick={logout} className="flex items-center gap-4 px-4 py-3.5 hover:bg-secondary/40 transition-colors cursor-pointer" data-testid="button-logout">
          <div className="w-9 h-9 bg-destructive/10 rounded-xl flex items-center justify-center"><LogOut className="w-[18px] h-[18px] text-destructive" strokeWidth={1.5} /></div>
          <p className="text-sm font-medium text-destructive">Log out</p>
        </motion.div>
      </div>

      {/* ── Change Code Modal ── */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-6" data-testid="modal-change-code">
          <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Change Couple Code</h3>
              <button onClick={() => { setShowCodeModal(false); setCodeError(""); setCurrentCode(""); setNewCode(""); setConfirmCode(""); }} className="text-muted-foreground">✕</button>
            </div>
            {codeSuccess ? (
              <div className="flex flex-col items-center gap-2 py-4"><Check className="w-10 h-10 text-green-500" /><p className="font-semibold">Code updated!</p></div>
            ) : (
              <form onSubmit={handleChangeCode} className="space-y-3">
                <div className="relative">
                  <input type={showCurrent ? "text" : "password"} value={currentCode} onChange={e => setCurrentCode(e.target.value)} placeholder="Current code"
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary pr-9" />
                  <button type="button" onClick={() => setShowCurrent(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <input type={showNew ? "text" : "password"} value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="New code (min 4 chars)"
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary pr-9" />
                  <button type="button" onClick={() => setShowNew(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <input type="password" value={confirmCode} onChange={e => setConfirmCode(e.target.value)} placeholder="Confirm new code"
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary" />
                {codeError && <p className="text-destructive text-xs">{codeError}</p>}
                <button type="submit" disabled={savingCode || !currentCode || !newCode || !confirmCode}
                  className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl disabled:opacity-50 text-sm">
                  {savingCode ? "Saving..." : "Update Code"}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
