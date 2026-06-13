import { useEffect, useState, memo } from "react";
import { Link } from "wouter";
import { MessageCircle, BookOpen, Heart, ImagePlus, Shield, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { api, type ApiUser } from "@/lib/api";
import { isEncryptionReady } from "@/lib/crypto";
import { AvatarImage } from "@/components/AvatarImage";
import { PostFeed } from "@/components/PostFeed";
import { PARTNER_CHANGED } from "@/lib/couple-sync";
import { parsePresenceResponse } from "@/lib/presence-api";
import { USER_TIMEZONES } from "@/lib/timezones";

export default memo(function Home() {
  const { user, partner: authPartner } = useAuth();
  const [partner, setPartner] = useState<ApiUser | null>(authPartner);
  const [moroccoTime, setMoroccoTime] = useState("");
  const [indiaTime, setIndiaTime] = useState("");
  const [loadingPartner, setLoadingPartner] = useState(() => !authPartner);

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
    return () => window.removeEventListener(PARTNER_CHANGED, onPartner);
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

  const shortcuts = [
    { href: "/chat", icon: MessageCircle, label: "Chat", desc: "Messages & calls" },
    { href: "/dua", icon: BookOpen, label: "Duas", desc: "Shared prayers" },
    { href: "/memories", icon: Heart, label: "Memories", desc: "Your moments" },
    { href: "/create", icon: ImagePlus, label: "Photos", desc: "Upload an image" },
  ];

  return (
    <div className="max-w-[470px] mx-auto pb-20 md:pb-6">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 py-3 flex items-center justify-between border-b border-border/50"
      >
        <span className="font-serif italic text-xl font-bold text-primary" aria-label="Grova app logo">Grova</span>
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
        className="px-4 py-8 text-center"
      >
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="text-2xl font-bold mt-1">{user?.name ?? "You"}</h1>
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
              className="relative mt-8 mb-2 w-full max-w-[340px] mx-auto rounded-3xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
              style={{
                background: "linear-gradient(160deg, #3d1528 0%, #1f0a14 45%, #2a0f1c 100%)",
                boxShadow: "0 8px 32px rgba(255, 77, 141, 0.15), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              <div className="px-6 pt-7 pb-5">
                <div className="relative flex items-center justify-center gap-0">
                  {/* Glowing wavy connection line */}
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-0">
                    <svg viewBox="0 0 200 24" className="w-full h-6" preserveAspectRatio="none" aria-hidden>
                      <defs>
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="2" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <path
                        d="M 0,14 Q 50,4 100,12 T 200,10"
                        fill="none"
                        stroke="rgba(255, 120, 160, 0.35)"
                        strokeWidth="10"
                        filter="blur(4px)"
                      />
                      <path
                        d="M 0,14 Q 50,4 100,12 T 200,10"
                        fill="none"
                        stroke="rgba(255, 140, 175, 0.7)"
                        strokeWidth="2"
                        filter="url(#glow)"
                      />
                    </svg>
                  </div>

                  <div className="relative z-10">
                    <AvatarImage
                      src={user?.avatar}
                      userId={user?.id ?? "me"}
                      alt=""
                      className="w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-full object-cover border-[2.5px] border-pink-300/50 shadow-[0_0_16px_rgba(255,120,160,0.3)] bg-[#1f0a14]"
                    />
                    <div className="absolute bottom-0.5 right-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full border-[2.5px] border-[#2a0f1c] z-20" aria-label="You are online" />
                  </div>

                  <motion.div
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                    className="relative z-10 mx-1 sm:mx-2 -mt-1"
                    style={{ filter: "drop-shadow(0 0 10px rgba(255, 100, 150, 0.9))" }}
                    aria-hidden
                  >
                    <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-pink-400 fill-pink-400" />
                  </motion.div>

                  <div className="relative z-10">
                    <AvatarImage
                      src={partner.avatar}
                      userId={partner.id}
                      alt=""
                      className="w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-full object-cover border-[2.5px] border-pink-300/50 shadow-[0_0_16px_rgba(255,120,160,0.3)] bg-[#1f0a14]"
                    />
                    <div
                      className={`absolute bottom-0.5 right-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-[2.5px] border-[#2a0f1c] z-20 ${partnerOnline ? "bg-green-500" : "bg-gray-400"}`}
                      aria-label={partnerOnline ? "Partner is online" : "Partner is offline"}
                    />
                  </div>
                </div>

                <p className="text-center text-[15px] sm:text-base font-medium mt-5 text-white/90 flex items-center justify-center gap-1.5">
                  You & {partner.name}
                  <Heart className="w-4 h-4 text-pink-400" strokeWidth={2} fill="none" />
                </p>
              </div>
            </motion.div>
          </Link>
        )}
        {partner && (
          <p className="text-xs text-muted-foreground/70 mt-2 mb-4">Tap to open chat</p>
        )}
        {!partner && !loadingPartner && (
          <p className="text-base sm:text-lg font-medium mt-4 drop-shadow-sm text-foreground/90">
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
                className="p-4 bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-2xl hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                role="button"
                tabIndex={0}
                aria-label={`Navigate to ${s.label}: ${s.desc}`}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
                </div>
                <p className="font-semibold text-sm">{s.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
              </motion.div>
            </Link>
          );
        })}
      </motion.div>

      <PostFeed />
    </div>
  );
});
