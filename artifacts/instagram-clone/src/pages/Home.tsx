import { useEffect, useState, memo } from "react";
import { Link } from "wouter";
import { MessageCircle, BookOpen, Heart, ImagePlus, Shield, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { api, type ApiUser } from "@/lib/api";
import { isEncryptionReady } from "@/lib/crypto";
import { AvatarImage } from "@/components/AvatarImage";
import { PostFeed } from "@/components/PostFeed";
import { useAppSearchParams } from "@/lib/app-search";
import { PARTNER_CHANGED } from "@/lib/couple-sync";
import { getStoredAppTheme, APP_THEME_CHANGED } from "@/lib/app-theme";
import { readSessionSnapshot } from "@/lib/profile-cache";
import { parsePresenceResponse } from "@/lib/presence-api";
import { USER_TIMEZONES } from "@/lib/timezones";


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
  }, []);

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
        className="px-4 py-8 text-center theme-home-welcome"
      >
        <p className={`text-sm text-muted-foreground theme-home-subtitle ${appTheme === 'library' ? 'library-home-subtitle' : ''}`}>Welcome back</p>
        <h1 className={`text-2xl font-bold mt-1 theme-home-name ${appTheme === 'library' ? 'library-home-name' : ''}`}>{user?.name ?? "You"}</h1>
        {loadingPartner ? (
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="w-16 h-16 rounded-full bg-secondary/50 animate-pulse" />
            <Heart className="w-6 h-6 text-primary fill-primary" />
            <div className="w-16 h-16 rounded-full bg-secondary/50 animate-pulse" />
          </div>
        ) : partner && (
          <Link href="/chat">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className={`theme-home-avatar-container relative flex items-center justify-center gap-5 sm:gap-7 mt-8 mb-6 w-full max-w-[340px] mx-auto cursor-pointer active:scale-[0.98] transition-transform ${appTheme === 'library' ? 'library-locket-container' : ''} ${appTheme === 'mint' ? 'home-avatar-mint-glow' : ''}`}
            >
              <div className="relative z-10 theme-home-avatar-wrapper">
                <AvatarImage
                  src={user?.avatar}
                  userId={user?.id ?? "me"}
                  alt=""
                  className={`theme-home-avatar w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-[3px] border-primary/40 shadow-[0_0_20px_rgba(var(--primary),0.25)] bg-background ${appTheme === 'library' ? 'library-locket' : ''}`}
                />
                <div className="theme-home-presence absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full border-[3px] border-background z-20 shadow-sm" aria-label="You are online" />
              </div>

              <motion.div
                animate={{ scale: [1, 1.18, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="relative z-[7] flex items-center justify-center"
                aria-hidden
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

              <div className="relative z-10 theme-home-avatar-wrapper">
                <AvatarImage
                  src={partner.avatar}
                  userId={partner.id}
                  alt=""
                  className={`theme-home-avatar w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-[3px] border-primary/40 shadow-[0_0_20px_rgba(var(--primary),0.25)] bg-background ${appTheme === 'library' ? 'library-locket' : ''}`}
                />
                <div
                  className={`theme-home-presence absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-[3px] border-background z-20 shadow-sm ${partnerOnline ? "bg-green-500" : "bg-gray-400"}`}
                  aria-label={partnerOnline ? "Partner is online" : "Partner is offline"}
                />
              </div>
            </motion.div>
          </Link>
        )}
        {partner && (
          <p className={`text-base sm:text-lg font-medium mt-2 drop-shadow-sm flex items-center justify-center gap-1.5 text-foreground/90 ${appTheme === 'library' ? 'library-home-text' : ''}`}>
            You & {partner.name}
            <Heart className={`w-4 h-4 text-primary ${appTheme === 'library' ? 'hidden' : ''}`} strokeWidth={2.5} />
          </p>
        )}
        {partner && (
          <p className="text-xs text-muted-foreground/70 mt-1 mb-4">Tap to open chat</p>
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
          className="theme-home-clocks flex items-center justify-center gap-4 mt-6"
        >
          <div className="theme-home-clock-badge flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-full">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium">Morocco: {moroccoTime}</span>
          </div>
          <div className="theme-home-clock-badge flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-full">
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
                className={`theme-home-shortcut-card p-4 bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-2xl hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${appTheme === 'library' ? 'library-shortcut-card' : ''}`}
                role="button"
                tabIndex={0}
                aria-label={`Navigate to ${s.label}: ${s.desc}`}
              >
                <div className={`theme-home-shortcut-icon-wrapper w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors ${appTheme === 'library' ? 'library-shortcut-icon-wrapper' : ''}`}>
                  <Icon className={`theme-home-shortcut-icon w-5 h-5 text-primary ${appTheme === 'library' ? 'library-shortcut-icon' : ''}`} aria-hidden="true" />
                </div>
                <p className={`theme-home-shortcut-title font-semibold text-sm ${appTheme === 'library' ? 'library-shortcut-title' : ''}`}>{s.label}</p>
                <p className={`theme-home-shortcut-desc text-xs text-muted-foreground mt-0.5 ${appTheme === 'library' ? 'library-shortcut-desc' : ''}`}>{s.desc}</p>
              </motion.div>
            </Link>
          );
        })}
      </motion.div>

      <PostFeed focusPostId={focusPostId} focusCommentId={focusCommentId} />
    </div>
  );
});
