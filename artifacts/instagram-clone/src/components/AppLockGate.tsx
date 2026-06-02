import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

type Props = {
  name: string;
  onUnlocked: () => void;
};

export function AppLockGate({ name, onUnlocked }: Props) {
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    try {
      await api.unlock(code.trim());
      onUnlocked();
    } catch {
      setError("Wrong code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif italic text-5xl font-bold text-primary mb-2">Grova</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {name}</p>
        </div>
        <form onSubmit={handleUnlock} className="space-y-4">
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2 block">
            <Lock className="w-3 h-3 inline mr-1" />
            Enter Code
          </label>
          <div className="relative">
            <input
              type={showCode ? "text" : "password"}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter code"
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors pr-10"
              autoFocus
              onCopy={(e) => e.preventDefault()}
              onPaste={(e) => e.preventDefault()}
            />
            <button
              type="button"
              onClick={() => setShowCode((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {error && <p className="text-destructive text-sm text-center">{error}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={!code.trim() || loading}
            className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl disabled:opacity-50 transition-opacity"
          >
            {loading ? "Checking..." : "Unlock"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
