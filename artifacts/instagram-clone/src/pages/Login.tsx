import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Step = "pick" | "code";

export default function Login() {
  const { setUser } = useAuth();
  const [step, setStep] = useState<Step>("pick");
  const [selectedId, setSelectedId] = useState<"me" | "wife" | null>(null);
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const users = [
    { id: "me" as const, name: "Mustaq", label: "That's me", avatar: "https://picsum.photos/seed/mustaq/150/150" },
    { id: "wife" as const, name: "Sara", label: "That's me", avatar: "https://picsum.photos/seed/sara/150/150" },
  ];

  const handlePick = (id: "me" | "wife") => {
    setSelectedId(id);
    setStep("code");
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !code) return;
    setLoading(true);
    setError("");
    try {
      const { user } = await api.login(selectedId, code);
      setUser(user);
    } catch {
      setError("Wrong code. Ask your partner for the couple code.");
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
          <p className="text-sm text-muted-foreground">Just the two of you ♥</p>
        </div>

        {step === "pick" ? (
          <div>
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
                      <img src={u.avatar} alt={u.name} className="w-20 h-20 rounded-full object-cover" />
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
              onClick={() => { setStep("pick"); setCode(""); setError(""); }}
              className="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1"
            >
              ← Back
            </button>

            <div className="flex flex-col items-center gap-3 mb-8">
              <div className="story-ring">
                <div className="bg-background rounded-full p-[3px]">
                  <img
                    src={users.find(u => u.id === selectedId)?.avatar}
                    alt=""
                    className="w-16 h-16 rounded-full object-cover"
                  />
                </div>
              </div>
              <p className="font-semibold">Hi, {users.find(u => u.id === selectedId)?.name} ♥</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2 block">
                  <Lock className="w-3 h-3 inline mr-1" />
                  Couple Code
                </label>
                <div className="relative">
                  <input
                    type={showCode ? "text" : "password"}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter your couple code"
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors pr-10"
                    autoFocus
                    data-testid="input-couple-code"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCode(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">Default code: grova2024 (change in settings)</p>
              </div>

              {error && (
                <p className="text-destructive text-sm text-center">{error}</p>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={!code || loading}
                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl disabled:opacity-50 transition-opacity"
                data-testid="button-login"
              >
                {loading ? "Checking..." : "Enter Grova ♥"}
              </motion.button>
            </form>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
