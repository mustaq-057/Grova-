import { useState, useEffect } from "react";
import { Plus, Trash2, BookOpen, X, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import { api, type ApiDua } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function Dua() {
  const { user } = useAuth();
  const [duas, setDuas] = useState<ApiDua[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [arabic, setArabic] = useState("");
  const [translation, setTranslation] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getDuas().then(setDuas).finally(() => setLoading(false));
    const interval = setInterval(() => {
      api.getDuas().then(setDuas);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arabic.trim() || !user) return;
    setSubmitting(true);
    try {
      const dua = await api.addDua({ arabic: arabic.trim(), translation: translation.trim(), author: user.id });
      setDuas((prev) => [...prev, dua]);
      setArabic("");
      setTranslation("");
      setShowAdd(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await api.deleteDua(id);
    setDuas((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="max-w-[600px] mx-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="px-4 py-5 border-b border-border flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-base">Our Duas</h1>
            <p className="text-xs text-muted-foreground">Shared prayers between us</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(s => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          data-testid="button-add-dua"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* Ayah / Bismillah header */}
      <div className="text-center py-6 px-4 border-b border-border bg-card/30">
        <p className="text-2xl font-arabic leading-loose tracking-wide text-primary/80" dir="rtl">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
        <p className="text-xs text-muted-foreground mt-2">In the name of Allah, the Most Gracious, the Most Merciful</p>
      </div>

      {/* Add dua form */}
      {showAdd && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-b border-border bg-card/50"
        >
          <form onSubmit={handleAdd} className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold">Add a Dua</p>
              <button type="button" onClick={() => setShowAdd(false)} className="text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={arabic}
              onChange={(e) => setArabic(e.target.value)}
              placeholder="Arabic text..."
              dir="rtl"
              rows={3}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-base outline-none focus:border-primary transition-colors resize-none text-right placeholder:text-right font-arabic leading-loose"
              data-testid="input-dua-arabic"
            />
            <textarea
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              placeholder="English translation (optional)..."
              rows={2}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors resize-none"
              data-testid="input-dua-translation"
            />
            <button
              type="submit"
              disabled={!arabic.trim() || submitting}
              className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl disabled:opacity-50 text-sm"
              data-testid="button-submit-dua"
            >
              {submitting ? "Saving..." : "Save Dua"}
            </button>
          </form>
        </motion.div>
      )}

      {/* Duas list */}
      {loading ? (
        <div className="flex flex-col gap-3 p-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-secondary/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {duas.map((dua, i) => (
            <motion.div
              key={dua.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="px-4 py-4"
              data-testid={`dua-${dua.id}`}
            >
              {/* Arabic */}
              <p
                className="text-lg leading-loose text-right font-arabic text-foreground mb-2 cursor-pointer"
                dir="rtl"
                onClick={() => setExpanded(expanded === dua.id ? null : dua.id)}
              >
                {dua.arabic}
              </p>

              {/* Translation */}
              {dua.translation && (
                <div>
                  <button
                    onClick={() => setExpanded(expanded === dua.id ? null : dua.id)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {expanded === dua.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    Translation
                  </button>
                  {expanded === dua.id && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-sm text-muted-foreground mt-2 leading-relaxed italic"
                    >
                      {dua.translation}
                    </motion.p>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between mt-3">
                <span className="text-[11px] text-muted-foreground/50">
                  {dua.author === "shared" ? "Shared" : dua.author === "me" ? "Added by you" : "Added by Luna"}
                </span>
                <button
                  onClick={() => handleDelete(dua.id)}
                  className="text-muted-foreground/40 hover:text-destructive transition-colors p-1"
                  data-testid={`button-delete-dua-${dua.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && duas.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center px-4">
          <BookOpen className="w-12 h-12 text-muted-foreground/20" />
          <p className="text-muted-foreground text-sm">No duas yet</p>
          <p className="text-xs text-muted-foreground/60">Add your first dua and share it with her</p>
        </div>
      )}
    </div>
  );
}
