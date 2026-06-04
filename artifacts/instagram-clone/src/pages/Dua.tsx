import { useState, useEffect, useCallback } from "react";
import { useFeatureLoading } from "@/hooks/useFeatureLoading";
import { Plus, Trash2, BookOpen, X, ChevronDown, ChevronUp, Send } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { toast } from "sonner";
import { api, type ApiDua } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function Dua() {
  const { user, partner } = useAuth();
  const [duas, setDuas] = useState<ApiDua[]>([]);
  const { showLoading, finishLoading, fetching } = useFeatureLoading(duas.length === 0);
  const [showAdd, setShowAdd] = useState(false);
  const [arabic, setArabic] = useState("");
  const [translation, setTranslation] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadDuas = useCallback(async () => {
    try {
      const list = await api.getDuas();
      setDuas(list);
      setError(null);
    } catch (err) {
      console.error("Failed to load duas:", err);
      setError("Could not load duas. Check your connection.");
    }
  }, []);

  useEffect(() => {
    loadDuas().finally(finishLoading);
    const interval = setInterval(loadDuas, 45_000);
    return () => clearInterval(interval);
  }, [loadDuas, finishLoading]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arabic.trim() || !user) return;
    setSubmitting(true);
    setError(null);
    try {
      const dua = await api.addDua({ arabic: arabic.trim(), translation: translation.trim(), author: user.id });
      setDuas((prev) => [dua, ...prev.filter((d) => d.id !== dua.id)]);
      setArabic("");
      setTranslation("");
      setShowAdd(false);
    } catch (err) {
      console.error("Failed to add dua:", err);
      setError(err instanceof Error ? err.message : "Could not save dua. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    setError(null);
    try {
      await api.deleteDua(deleteId);
      setDuas((prev) => prev.filter((d) => d.id !== deleteId));
    } catch (err) {
      console.error("Failed to delete dua:", err);
      setError(err instanceof Error ? err.message : "Could not delete dua.");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const shareDua = async (dua: ApiDua) => {
    if (!user) return;
    // Send dua as a special formatted message for better UI rendering
    try {
      await api.sendMessage({
        senderId: user.id,
        type: "text",
        text: dua.arabic || "", // Just send the Arabic text
        variant: "cute",
        companionSticker: "🤲",
        metadata: {
          isDua: true,
          translation: dua.translation || "",
        },
      } as any);
      toast.success(`Sent to chat! ${partner?.name?.split(" ")[0] ?? "They"} will see it there ♥`);
    } catch (err) {
      console.error("Failed to share dua:", err);
      setError("Could not share to chat. Check your connection.");
    }
  };

  return (
    <div className="max-w-[600px] mx-auto pb-20 md:pb-6 overflow-x-hidden">
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
          onClick={() => setShowAdd((s) => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          data-testid="button-add-dua"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {error && (
        <div className="mx-4 mt-3 px-3 py-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
          {error}
        </div>
      )}

      <div className="text-center py-8 px-4 border-b border-border bg-gradient-to-b from-primary/10 via-card/40 to-transparent">
        <p className="text-3xl font-arabic leading-loose tracking-wide text-primary" dir="rtl">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
        <p className="text-xs text-muted-foreground mt-2">In the name of Allah, the Most Gracious, the Most Merciful</p>
        <div className="flex justify-center gap-2 mt-4 flex-wrap">
          {["🤲", "✨", "💚", "🌙"].map((e) => (
            <span key={e} className="text-2xl" aria-hidden>{e}</span>
          ))}
        </div>
      </div>

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

      {showLoading ? (
        <div className="flex flex-col gap-3 p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-secondary/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {duas.map((dua, i) => (
            <motion.div
              key={dua.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              data-testid={`dua-${dua.id}`}
              className="bg-card/50 border border-border/50 rounded-2xl overflow-hidden hover:border-border/80 transition-all hover:shadow-lg hover:shadow-primary/10"
            >
              {/* Card Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-primary/10 to-transparent border-b border-border/30 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary/70">
                  {dua.author === user?.id ? "📝 Your Dua" : "🤲 Shared Dua"}
                </span>
                <span className="text-[11px] text-muted-foreground/60 px-2 py-1 bg-secondary/50 rounded-full">
                  {dua.author === user?.id ? "Added by you" : "Added by partner"}
                </span>
              </div>

              {/* Arabic Text */}
              <div
                className="px-4 py-4 cursor-pointer hover:bg-secondary/20 transition-colors"
                onClick={() => setExpanded(expanded === dua.id ? null : dua.id)}
              >
                <p
                  className="text-xl leading-loose text-right font-arabic text-foreground break-words"
                  dir="rtl"
                >
                  {dua.arabic}
                </p>
              </div>

              {/* Translation */}
              {dua.translation && (
                <div className="border-t border-border/30">
                  <button
                    onClick={() => setExpanded(expanded === dua.id ? null : dua.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors text-sm"
                  >
                    <span className="text-muted-foreground font-medium">English Translation</span>
                    {expanded === dua.id ? (
                      <ChevronUp className="w-4 h-4 text-primary" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  {expanded === dua.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 pb-4 pt-0"
                    >
                      <p className="text-sm text-muted-foreground leading-relaxed italic">
                        {dua.translation}
                      </p>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Footer with actions */}
              <div className="px-4 py-3 bg-secondary/20 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => shareDua(dua)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Share
                  </button>
                  <Link href="/chat">
                    <button type="button" className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors">
                      Chat
                    </button>
                  </Link>
                </div>
                {dua.author === user?.id && (
                  <button
                    onClick={() => setDeleteId(dua.id)}
                    className="p-1.5 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors active:scale-95"
                    data-testid={`button-delete-dua-${dua.id}`}
                    title="Delete dua"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!fetching && duas.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center px-4">
          <BookOpen className="w-12 h-12 text-muted-foreground/20" />
          <p className="text-muted-foreground text-sm">No duas yet</p>
          <p className="text-xs text-muted-foreground/60">Add your first dua and share it in chat</p>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete this dua?"
        description="It will be removed for both of you."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
