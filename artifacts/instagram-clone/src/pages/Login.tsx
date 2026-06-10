import { useState, memo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { ApiUser } from "@/lib/api";
import { initEncryption } from "@/lib/crypto";
import { getDefaultEmail, saveDefaultEmail } from "@/lib/session";
import { AVATARS } from "@/lib/avatars";
import { AvatarImage } from "@/components/AvatarImage";
import { probeApiHealth, configErrorFromHealth } from "@/lib/server-health";
import { readLoginProfiles, writeLoginProfiles, type LoginProfileRow } from "@/lib/profile-cache";

type Step = "primary" | "pick" | "code";

type PickUser = { id: "me" | "wife"; name: string; label: string; avatar: string };

function defaultPickUsers(): PickUser[] {
  const cached = readLoginProfiles();
  if (cached?.length) {
    return cached.map((p) => ({ ...p, label: "That's me" }));
  }
  return [
    { id: "me", name: "Mustaq", label: "That's me", avatar: AVATARS.me },
    { id: "wife", name: "Sara", label: "That's me", avatar: AVATARS.wife },
  ];
}

function mergeLoginProfiles(prev: PickUser[], profiles: LoginProfileRow[]): PickUser[] {
  const next = prev.map((u) => {
    const p = profiles.find((x) => x.id === u.id);
    return p ? { ...u, name: p.name, avatar: p.avatar } : u;
  });
  writeLoginProfiles(
    next.map((u) => ({ id: u.id, name: u.name, avatar: u.avatar })),
  );
  return next;
}

export default memo(function Login() {
  const { setUser, refreshTrustedDevice, trustedDevice, authReady } = useAuth();
  const [step, setStep] = useState<Step>("primary");
  const [selectedId, setSelectedId] = useState<"me" | "wife" | null>(null);
  const [email, setEmail] = useState(() => getDefaultEmail());
  const [password, setPassword] = useState("");
  const [showPrimaryPassword, setShowPrimaryPassword] = useState(false);
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<PickUser[]>(defaultPickUsers);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [profileCodes, setProfileCodes] = useState<{ me: string; wife: string } | null>(null);
  const [autoEntering, setAutoEntering] = useState(false);
  /** Which profile already consumed the autoenter — the other must type manually. */
  const autoEnteredForRef = useRef<"me" | "wife" | null>(null);


  useEffect(() => {
    let cancelled = false;
    let failStreak = 0;
    const offlineMsg = import.meta.env.PROD
      ? "Cannot reach Grova right now. Check your connection and try again."
      : "Cannot reach the server. Run pnpm dev:grova and open http://localhost:5000";
    const check = async () => {
      const health = await probeApiHealth();
      if (cancelled) return;
      const configErr = configErrorFromHealth(health);
      if (health.reachable) {
        failStreak = 0;
        setServerOnline(true);
        if (configErr) {
          setError(configErr);
        } else {
          setError((prev) =>
            prev.includes("Cannot reach") || prev.includes("Vercel env") ? "" : prev,
          );
        }
      } else {
        failStreak += 1;
        if (failStreak >= 2) {
          setServerOnline(false);
          setError(offlineMsg);
        }
      }
    };
    void check();
    const interval = setInterval(() => void check(), 20_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;
    setCode("");
    setError("");
    setSelectedId(null);
    setStep(trustedDevice ? "pick" : "primary");
    api
      .getLoginProfiles()
      .then((profiles) => {
        setUsers((prev) => mergeLoginProfiles(prev, profiles as LoginProfileRow[]));
      })
      .catch(() => {});
  }, [authReady, trustedDevice]);

  useEffect(() => {
    if (trustedDevice) {
      api.getProfileCodes()
        .then(setProfileCodes)
        .catch(console.error);
    } else {
      setProfileCodes(null);
    }
  }, [trustedDevice]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (autoEntering && code && selectedId && step === "code") {
      timer = setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        void handleLogin(fakeEvent);
      }, 800);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [autoEntering, code, selectedId, step]);

  const handlePrimaryLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError("");
    try {
      await api.primaryLogin(email.trim(), password);
      saveDefaultEmail(email.trim());
      await refreshTrustedDevice();
      api.getLoginProfiles().then((profiles) => {
        setUsers((prev) => mergeLoginProfiles(prev, profiles as LoginProfileRow[]));
      }).catch(() => {});
      setStep("pick");
      setSelectedId(null);
      setPassword("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Attempts remaining: 1")) {
        setError("Invalid email or password. One attempt left.");
      } else if (msg.toLowerCase().includes("too many") || msg.includes("429")) {
        setError("Too many wrong attempts. Login blocked for 30 minutes. Try again later.");
      } else if (serverOnline && /\(HTTP |request failed|not found/i.test(msg)) {
        setError(
          msg.includes("Not allowed by CORS")
            ? "CORS blocked login. Add your site URL to ALLOWED_ORIGINS in Vercel (no trailing slash), then redeploy."
            : `Login API error: ${msg}. Health check passed — check Vercel → Logs for the /api function.`,
        );
      } else if (/request failed|not found|failed to fetch|cannot reach/i.test(msg)) {
        setError(
          "Cannot reach the login API. Open /api/healthz on your site — if it fails, redeploy on Vercel and check DATABASE_URL, ENCRYPTION_*, and PRIMARY_AUTH_* (Cloudinary is only needed for photo uploads).",
        );
      } else if (msg.toLowerCase().includes("invalid email or password")) {
        setError("Invalid email or password. Check PRIMARY_AUTH_EMAILS matches your email exactly on Vercel.");
      } else if (msg.toLowerCase().includes("database unavailable")) {
        setError("Database is not connected. Set DATABASE_URL (Neon) in Vercel env vars and redeploy.");
      } else {
        setError(msg || "Login failed. Check Vercel env vars (PRIMARY_AUTH_*) and redeploy.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePick = (id: "me" | "wife") => {
    setSelectedId(id);
    setStep("code");
    setError("");
    const matchedCode = profileCodes?.[id];
    // Only autoenter if this profile hasn't been used yet AND the other profile didn't already autoenter
    const canAutoEnter = matchedCode && (autoEnteredForRef.current === null || autoEnteredForRef.current === id);
    if (canAutoEnter) {
      setCode(matchedCode);
      setAutoEntering(true);
      autoEnteredForRef.current = id;
    } else {
      setCode("");
      setAutoEntering(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !code) return;
    setLoading(true);
    setError("");
    try {
      const { user, encryptionKey } = await api.login(selectedId, code);
      await initEncryption(encryptionKey.trim());
      setUser(user as ApiUser);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("fetch") || msg.includes("Failed") || msg.includes("Network") || msg.includes("API running")) {
        setError(
          import.meta.env.PROD
            ? "Cannot reach Grova right now. Check your connection and try again."
            : "Cannot reach the server. Run pnpm dev:grova and open http://localhost:5000",
        );
      } else if (msg.toLowerCase().includes("too many")) {
        setError("Too many wrong attempts. Wait 30 minutes or restart the server, then try again.");
      } else if (/Attempts remaining: (\d+)/i.test(msg)) {
        const left = Number(msg.match(/Attempts remaining: (\d+)/i)?.[1] ?? 0);
        setError(
          left === 1 ? "Wrong code. One attempt left." : `Wrong code. ${left} attempts left.`,
        );
      } else if (msg.toLowerCase().includes("invalid code")) {
        setError("Wrong code. Check spelling and try again.");
      } else if (msg.toLowerCase().includes("primary authentication")) {
        setError("Email sign-in expired. Go back and sign in with your email again.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-serif italic text-5xl font-bold text-primary mb-2">Grova</h1>
          <p className="text-sm text-muted-foreground">Private chat for you two</p>
        </div>

        {serverOnline === false && (
          <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {import.meta.env.PROD ? (
              <>Cannot reach the Grova server. Check your internet connection and try again in a moment.</>
            ) : (
              <>
                API offline. In the project folder run{" "}
                <code className="rounded bg-muted px-1 text-xs">pnpm dev:grova</code>, then open{" "}
                <a href="http://localhost:5000" className="underline font-medium">
                  http://localhost:5000
                </a>
                .
              </>
            )}
          </div>
        )}

        {step === "primary" ? (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-center text-sm text-muted-foreground mb-6">Secure access required</p>
            <form onSubmit={handlePrimaryLogin} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2 block">
                  <Mail className="w-3 h-3 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter allowed email"
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                  autoFocus
                  onCopy={(e) => e.preventDefault()}
                  data-testid="input-primary-email"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2 block">
                  <Lock className="w-3 h-3 inline mr-1" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPrimaryPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter access password"
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors pr-10"
                    onCopy={(e) => e.preventDefault()}
                    onPaste={(e) => e.preventDefault()}
                    data-testid="input-primary-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPrimaryPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPrimaryPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-destructive text-sm text-center">{error}</p>}
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={!email.trim() || !password || loading}
                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl disabled:opacity-50 transition-opacity"
                data-testid="button-primary-login"
              >
                {loading ? "Checking..." : "Continue"}
              </motion.button>
            </form>
          </motion.div>
        ) : step === "pick" ? (
          <div>
            <button
              type="button"
              onClick={() => { setStep("primary"); setError(""); }}
              className="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1"
            >
              ← Back to email
            </button>
            <p className="text-center text-sm text-muted-foreground mb-6">Who are you?</p>
            <div className="flex gap-4">
              {users.map((u) => (
                <motion.button
                  key={u.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handlePick(u.id)}
                  className="flex-1 flex flex-col items-center gap-3 p-5 bg-card border border-border rounded-2xl hover:border-primary/50 transition-colors"
                  data-testid={`button-pick-${u.id}`}
                >
                  <div className="story-ring">
                    <div className="bg-card rounded-full p-[3px]">
                      <AvatarImage
                        src={u.avatar}
                        userId={u.id}
                        alt={`Profile picture of ${u.name}`}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-base">{u.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{u.label}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <button
              type="button"
              onClick={() => { setStep("pick"); setCode(""); setError(""); setAutoEntering(false); }}
              className="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1"
            >
              ← Back
            </button>

            <div className="flex flex-col items-center gap-3 mb-8">
              <div className="story-ring">
                <div className="bg-background rounded-full p-[3px]">
                  <AvatarImage
                    src={users.find(u => u.id === selectedId)?.avatar}
                    userId={selectedId ?? "me"}
                    alt=""
                    className="w-16 h-16 rounded-full object-cover"
                  />
                </div>
              </div>
              <p className="font-semibold">
                Hi, {users.find((u) => u.id === selectedId)?.name} ♥
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2 block">
                  <Lock className="w-3 h-3 inline mr-1" />
                  Enter Code
                </label>
                <div className="relative">
                  <input
                    type={showCode ? "text" : "password"}
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      setAutoEntering(false);
                    }}
                    placeholder="Enter code"
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors pr-10"
                    autoFocus
                    disabled={autoEntering || loading}
                    onCopy={(e) => e.preventDefault()}
                    onPaste={(e) => e.preventDefault()}
                    data-testid="input-couple-code"
                  />
                  {!autoEntering && (
                    <button
                      type="button"
                      onClick={() => setShowCode(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                {autoEntering ? (
                  <p className="text-xs text-primary font-semibold mt-1.5 animate-pulse flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                    Autoentering...
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1.5">Your personal code for this profile. Change yours anytime in Settings.</p>
                )}
              </div>

              {error && (
                <p className="text-destructive text-sm text-center">{error}</p>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={!code || loading || autoEntering}
                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl disabled:opacity-50 transition-opacity"
                data-testid="button-login"
              >
                {autoEntering ? "Autoentering..." : loading ? "Checking..." : "Enter Grova ♥"}
              </motion.button>
            </form>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
});
