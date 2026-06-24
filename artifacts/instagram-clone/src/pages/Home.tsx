import { useEffect, useState, memo } from "react";
import { Link } from "wouter";
import { MessageCircle, BookOpen, Heart, Shield, Clock, Plus, X, Camera, Eye, StickyNote } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { api, type ApiUser, type ApiStory, type ApiAvatarNote } from "@/lib/api";
import { isEncryptionReady } from "@/lib/crypto";
import { AvatarImage } from "@/components/AvatarImage";
import { PostFeed } from "@/components/PostFeed";
import { useAppSearchParams } from "@/lib/app-search";
import { PARTNER_CHANGED } from "@/lib/couple-sync";
import { getStoredAppTheme, APP_THEME_CHANGED } from "@/lib/app-theme";
import { readSessionSnapshot } from "@/lib/profile-cache";
import { parsePresenceResponse } from "@/lib/presence-api";
import { USER_TIMEZONES } from "@/lib/timezones";
import { CameraOverlay } from "@/components/CameraOverlay";
import { StoryViewer } from "@/components/StoryViewer";
import { AvatarNoteModal } from "@/components/AvatarNoteModal";


export default memo(function Home() {
  const { user, partner: authPartner } = useAuth();
  const searchParams = useAppSearchParams();
  const focusPostId = searchParams.get("post");
  const focusCommentId = searchParams.get("comment");
  const [partner, setPartner] = useState<ApiUser | null>(() => authPartner ?? readSessionSnapshot()?.partner ?? null);
  const [moroccoTime, setMoroccoTime] = useState("");
  const [indiaTime, setIndiaTime] = useState("");
  const [appTheme, setAppTheme] = useState(getStoredAppTheme);
  const [loadingPartner, setLoadingPartner] = useState(() => !authPartner && !readSessionSnapshot()?.partner);
  const [stories, setStories] = useState<ApiStory[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [viewingStories, setViewingStories] = useState<ApiStory[] | null>(null);
  const [showMyStoryOptions, setShowMyStoryOptions] = useState(false);
  const [initialStoryIndex, setInitialStoryIndex] = useState(0);

  const [notes, setNotes] = useState<ApiAvatarNote[]>([]);
  const [selectedNoteUser, setSelectedNoteUser] = useState<ApiUser | null>(null);
  const [noteMode] = useState<"view">("view");

  const partnerId = user?.id === "me" ? "wife" : "me";

  useEffect(() => {
    if (authPartner) {
      setPartner(authPartner);
      setLoadingPartner(false);
    }
  }, [authPartner]);

  useEffect(() => {
    const onPartner = (e: Event) => {
      setPartner((e as CustomEvent<ApiUser>).detail);
      setLoadingPartner(false);
    };
    window.addEventListener(PARTNER_CHANGED, onPartner);
    
    const onTheme = () => setAppTheme(getStoredAppTheme());
    window.addEventListener(APP_THEME_CHANGED as any, onTheme);
    
    return () => {
      window.removeEventListener(PARTNER_CHANGED, onPartner);
      window.removeEventListener(APP_THEME_CHANGED as any, onTheme);
    };
  }, []);

  useEffect(() => {
    if (authPartner) {
      setPartner(authPartner);
      setLoadingPartner(false);
      return;
    }
    if (partner) {
      setLoadingPartner(false);
      return;
    }
    let cancelled = false;
    const safety = window.setTimeout(() => {
      if (!cancelled) setLoadingPartner(false);
    }, 10_000);
    setLoadingPartner(true);
    api.getUsers().then((users) => {
      if (cancelled) return;
      const p = users.find((u) => u.id === partnerId);
      if (p) setPartner(p);
      setLoadingPartner(false);
    }).catch((error) => {
      if (cancelled) return;
      console.error('Failed to fetch partner data:', error);
      setLoadingPartner(false);
    }).finally(() => {
      window.clearTimeout(safety);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(safety);
    };
  }, [authPartner, partnerId, partner]);

  useEffect(() => {
    api.getPresence().then((raw) => {
      const { lastSeen } = parsePresenceResponse(raw);
      const partnerOnline = lastSeen[partnerId];
      setPartnerOnline(partnerOnline !== undefined && Date.now() - partnerOnline < 30000);
    }).catch((error) => {
      console.error('Failed to fetch presence data:', error);
    });
  }, [partnerId]);

  const [partnerOnline, setPartnerOnline] = useState(false);

  // Update live time for Morocco and India
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeOpts: Intl.DateTimeFormatOptions = {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      };
      setMoroccoTime(now.toLocaleTimeString("en-US", { ...timeOpts, timeZone: USER_TIMEZONES.me }));
      setIndiaTime(now.toLocaleTimeString("en-US", { ...timeOpts, timeZone: USER_TIMEZONES.wife }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Ensure library focus mode is disabled when returning to home (keep fullscreen if user enabled it)
  useEffect(() => {
    if (localStorage.getItem("libraryMode") === "true") {
      localStorage.setItem("libraryMode", "false");
      window.dispatchEvent(new Event("LIBRARY_MODE_CHANGED"));
    }
    
    // Fetch stories
    api.getStories().then(data => {
      setStories(data);
      // Auto-open specific story if URL has storyId
      const params = new URLSearchParams(window.location.search);
      const storyId = params.get("storyId");
      if (storyId) {
        const idx = data.findIndex(s => s.id === storyId);
        if (idx !== -1) {
          setInitialStoryIndex(idx);
          setViewingStories(data);
        }
        // Clean up URL
        window.history.replaceState({}, "", "/");
      }
    }).catch(console.error);

    api.getAvatarNotes().then(setNotes).catch(console.error);
  }, []);

  const handleStoryComplete = (uploaded?: boolean, story?: any) => {
    setShowCamera(false);
    api.getStories().then(setStories).catch(console.error);
    if (uploaded) {
      api.postActivity({ type: "story", fromName: user?.name ?? "You", text: "Added a new story", targetPath: story ? `/?storyId=${story.id}` : undefined }).catch(console.error);
    }
  };

  const myStories = stories.filter(s => s.authorId === user?.id);
  const partnerStories = partner ? stories.filter(s => s.authorId === partner.id) : [];

  const myNote = notes.find(n => n.userId === user?.id);
  const partnerNote = partner ? notes.find(n => n.userId === partner.id) : null;

  const shortcuts = [
    { href: "/chat", icon: MessageCircle, label: "Chat", desc: "Messages & calls" },
    { href: "/dua", icon: BookOpen, label: "Duas", desc: "Shared prayers" },
    { href: "/memories", icon: Heart, label: "Memories", desc: "Your moments" },
    { href: "/library", icon: BookOpen, label: "Library", desc: "Shared books" },
  ];

  return (
    <div className="max-w-[470px] mx-auto pb-20 md:pb-6">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 py-3 flex items-center justify-between border-b border-border/50"
      >
        <span className={`font-serif italic text-xl font-bold text-primary ${appTheme === 'library' ? 'library-home-title' : ''}`} aria-label="Grova app logo">Grova</span>
        {isEncryptionReady() && (
          <span className="flex items-center gap-1 text-[10px] text-green-500 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20" role="status" aria-label="End-to-end encryption active">
            <Shield className="w-3 h-3" aria-hidden="true" /> Encrypted
          </span>
        )}
      </motion.div>



      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="px-4 py-4 text-center"
      >
        <p className={`text-sm text-muted-foreground ${appTheme === 'library' ? 'library-home-subtitle' : ''}`}>Welcome back</p>
        <h1 className={`text-2xl font-bold mt-1 ${appTheme === 'library' ? 'library-home-name' : ''}`}>{user?.name ?? "You"}</h1>
        {loadingPartner ? (
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="w-16 h-16 rounded-full bg-secondary/50 animate-pulse" />
            <Heart className="w-6 h-6 text-primary fill-primary" />
            <div className="w-16 h-16 rounded-full bg-secondary/50 animate-pulse" />
          </div>
        ) : partner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className={`relative flex items-center justify-center gap-5 sm:gap-7 mt-8 mb-3 w-full max-w-[340px] mx-auto ${appTheme === 'library' ? 'library-locket-container' : ''} ${appTheme === 'mint' ? 'home-avatar-mint-glow' : ''}`}
            >
              <div className="relative">
                {/* Note Bubble - View Only */}
                {myNote && (
                  <button
                    type="button"
                    className="absolute -top-14 left-1/2 -translate-x-1/2 z-40 transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
                    onClick={() => { if (user) { setSelectedNoteUser(user); } }}
                    aria-label="View your note"
                  >
                    <div className="relative group">
                      <div className="absolute inset-0 bg-primary/25 blur-md rounded-2xl scale-110 opacity-70" />
                      <div className="relative bg-gradient-to-br from-white via-white to-primary/10 text-foreground px-3.5 py-2 rounded-2xl rounded-bl-[4px] text-[13px] shadow-lg shadow-black/10 max-w-[130px] font-semibold leading-snug line-clamp-2">
                        {myNote.text}
                      </div>
                    </div>
                  </button>
                )}

                {/* My avatar — tap to view/add story */}
                <button
                  type="button"
                  className={`relative z-10 p-0.5 rounded-full cursor-pointer transition-transform active:scale-95 ${myStories.length > 0 ? "bg-gradient-to-tr from-yellow-400 to-primary" : ""}`}
                  onClick={() => {
                    if (myStories.length > 0) setShowMyStoryOptions(true);
                    else setShowCamera(true);
                  }}
                >
                <AvatarImage
                  src={user?.avatar}
                  userId={user?.id ?? "me"}
                  alt=""
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-[3px] shadow-[0_0_20px_rgba(var(--primary),0.25)] bg-background ${myStories.length > 0 ? "border-background" : "border-primary/40"} ${appTheme === 'library' ? 'library-locket' : ''}`}
                />
                {myStories.length === 0 ? (
                  <div className="absolute bottom-0 right-0 w-6 h-6 sm:w-7 sm:h-7 bg-blue-500 rounded-full border-[3px] border-background flex items-center justify-center z-20">
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-white" strokeWidth={3} />
                  </div>
                ) : (
                  <div className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full border-[3px] border-background z-20 shadow-sm" aria-label="You are online" />
                )}
                {/* Story count badge */}
                {myStories.length > 1 && (
                  <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 z-30 shadow border-2 border-background">
                    {myStories.length}
                  </div>
                )}
              </button>
              </div>

              {/* Animated heart in the middle — tap to go to chat */}
              <Link href="/chat">
                <motion.div
                  animate={{ scale: [1, 1.18, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="relative z-[7] flex items-center justify-center cursor-pointer"
                  aria-label="Open chat"
                >
                  <div className="absolute w-20 h-20 sm:w-24 sm:h-24 bg-primary/25 rounded-full blur-[28px] animate-pulse" />
                  <div className="absolute w-14 h-14 sm:w-16 sm:h-16 bg-primary/40 rounded-full blur-[16px]" />
                  <div
                    className="absolute w-10 h-10 sm:w-12 sm:h-12 bg-primary/60 rounded-full blur-[8px]"
                    style={{ boxShadow: "0 0 32px rgba(var(--primary), 0.9), 0 0 64px rgba(var(--primary), 0.5)" }}
                  />
                  <Heart
                    className="relative w-8 h-8 sm:w-10 sm:h-10 text-primary fill-primary"
                    style={{
                      filter: "drop-shadow(0 0 8px rgba(var(--primary), 1)) drop-shadow(0 0 20px rgba(var(--primary), 0.85)) drop-shadow(0 0 40px rgba(var(--primary), 0.5))",
                    }}
                  />
                </motion.div>
              </Link>

              <div className="relative">
                {/* Partner Note Bubble */}
                {partnerNote && (
                  <button
                    type="button"
                    className="absolute -top-14 left-1/2 -translate-x-1/2 z-40 transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
                    onClick={() => { setSelectedNoteUser(partner); }}
                    aria-label={`View ${partner.name}'s note`}
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 blur-md rounded-2xl scale-110 opacity-60" />
                      <div className="relative bg-gradient-to-br from-white via-white to-rose-50 text-foreground px-3.5 py-2 rounded-2xl rounded-br-[4px] text-[13px] shadow-lg shadow-black/10 max-w-[130px] font-semibold leading-snug line-clamp-2">
                        {partnerNote.text}
                      </div>
                    </div>
                  </button>
                )}

                {/* Partner avatar — tap to view story if they have one, else do nothing */}
                <button
                  type="button"
                  className={`relative z-10 p-0.5 rounded-full transition-transform ${partnerStories.length > 0 ? "cursor-pointer active:scale-95 bg-gradient-to-tr from-yellow-400 to-primary" : "cursor-default"}`}
                  onClick={() => {
                    if (partnerStories.length > 0) {
                      setInitialStoryIndex(0);
                      setViewingStories(partnerStories);
                    }
                  }}
                  disabled={partnerStories.length === 0}
                >
                <AvatarImage
                  src={partner.avatar}
                  userId={partner.id}
                  alt=""
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-[3px] shadow-[0_0_20px_rgba(var(--primary),0.25)] bg-background ${partnerStories.length > 0 ? "border-background" : "border-primary/40"} ${appTheme === 'library' ? 'library-locket' : ''}`}
                />
                <div
                  className={`absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-[3px] border-background z-20 shadow-sm ${partnerOnline ? "bg-green-500" : "bg-gray-400"}`}
                  aria-label={partnerOnline ? "Partner is online" : "Partner is offline"}
                />
                {/* Story count badge */}
                {partnerStories.length > 1 && (
                  <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 z-30 shadow border-2 border-background">
                    {partnerStories.length}
                  </div>
                )}
              </button>
              </div>
            </motion.div>
        )}
        {partner && (
          <p className={`text-base sm:text-lg font-medium mt-1 drop-shadow-sm flex items-center justify-center gap-1.5 text-foreground/90 ${appTheme === 'library' ? 'library-home-text' : ''}`}>
            You & {partner.name}
            <Heart className={`w-4 h-4 text-primary ${appTheme === 'library' ? 'hidden' : ''}`} strokeWidth={2.5} />
          </p>
        )}

        {!partner && !loadingPartner && (
          <p className={`text-base sm:text-lg font-medium mt-4 drop-shadow-sm text-foreground/90 ${appTheme === 'library' ? 'library-home-text' : ''}`}>
            Your private space
          </p>
        )}
        
        {/* Live Time Display */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="flex items-center justify-center gap-4 mt-6"
        >
          <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-full">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium">Morocco: {moroccoTime}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-full">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium">India: {indiaTime}</span>
          </div>
        </motion.div>
      </motion.div>


      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="grid grid-cols-2 gap-3 px-4"
      >
        {shortcuts.map((s, i) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href}>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + (i * 0.05) }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-2xl hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${appTheme === 'library' ? 'library-shortcut-card' : ''}`}
                role="button"
                tabIndex={0}
                aria-label={`Navigate to ${s.label}: ${s.desc}`}
              >
                <div className={`w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors ${appTheme === 'library' ? 'library-shortcut-icon-wrapper' : ''}`}>
                  <Icon className={`w-5 h-5 text-primary ${appTheme === 'library' ? 'library-shortcut-icon' : ''}`} aria-hidden="true" />
                </div>
                <p className={`font-semibold text-sm ${appTheme === 'library' ? 'library-shortcut-title' : ''}`}>{s.label}</p>
                <p className={`text-xs text-muted-foreground mt-0.5 ${appTheme === 'library' ? 'library-shortcut-desc' : ''}`}>{s.desc}</p>
              </motion.div>
            </Link>
          );
        })}
      </motion.div>

      <PostFeed focusPostId={focusPostId} focusCommentId={focusCommentId} />

      {showCamera && (
        <CameraOverlay mode="story" onClose={handleStoryComplete} />
      )}

      {viewingStories && (
        <StoryViewer 
          stories={viewingStories}
          initialIndex={initialStoryIndex}
          onClose={() => setViewingStories(null)} 
          onStoriesChanged={handleStoryComplete}
        />
      )}

      {/* "View or Add Story" bottom sheet */}
      <AnimatePresence>
        {showMyStoryOptions && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[400] bg-black/50 backdrop-blur-sm"
              onClick={() => setShowMyStoryOptions(false)}
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-[401] bg-background rounded-t-2xl shadow-2xl overflow-hidden"
              style={{ paddingBottom: "max(5rem, env(safe-area-inset-bottom))" }}
            >
              {/* Handle bar */}
              <div className="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto mt-3 mb-2" />

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-3 border-b border-border/50">
                <div>
                  <p className="font-semibold text-sm">Your Stories</p>
                </div>
                <button
                  onClick={() => setShowMyStoryOptions(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Options */}
              <button
                onClick={() => {
                  setShowMyStoryOptions(false);
                  setInitialStoryIndex(0);
                  setViewingStories(myStories);
                }}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-base">View my story</p>
                </div>
              </button>

              <div className="border-t border-border/30 mx-4" />

              <button
                onClick={() => {
                  setShowMyStoryOptions(false);
                  setShowCamera(true);
                }}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-base">Add to story</p>
                </div>
              </button>


            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Avatar Note Modal */}
      {selectedNoteUser && user && (
        <AvatarNoteModal
          mode={noteMode}
          user={selectedNoteUser}
          note={notes.find(n => n.userId === selectedNoteUser.id)}
          onClose={() => setSelectedNoteUser(null)}
          onNoteAdded={note => setNotes(prev => [...prev.filter(n => n.userId !== note.userId), note])}
          onNoteDeleted={id => setNotes(prev => prev.filter(n => n.id !== id))}
        />
      )}
    </div>
  );
});
