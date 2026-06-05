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
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="flex items-center justify-center gap-3 mt-6"
          >
            <div className="relative">
              <AvatarImage src={user?.avatar} userId={user?.id ?? "me"} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-primary/30 shadow-lg" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background" aria-label="Online status" />
            </div>
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              aria-hidden="true"
            >
              <Heart className="w-6 h-6 text-primary fill-primary" />
            </motion.div>
            <div className="relative">
              <AvatarImage
                src={partner.avatar}
                userId={partner.id}
                alt=""
                className="w-16 h-16 rounded-full object-cover border-2 border-primary/30 shadow-lg"
              />
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background ${partnerOnline ? "bg-green-500" : "bg-gray-400"}`} aria-label="Online status" />
            </div>
          </motion.div>
        )}
        <p className="text-sm text-muted-foreground mt-4">
          {partner ? `You & ${partner.name}` : "Your private space"}
        </p>
        
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
