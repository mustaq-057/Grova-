import { useState, useEffect } from "react";
import { useFeatureLoading } from "@/hooks/useFeatureLoading";
import { Plus, Trash2, Heart, Calendar, Star, X, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { api, type ApiMilestone } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const milestoneTypes = [
  { id: "anniversary", label: "Anniversary", icon: "🌙", color: "bg-pink-500/20 text-pink-600 border-pink-500/30" },
  { id: "special_moment", label: "Special Moment", icon: "✨", color: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30" },
  { id: "achievement", label: "Achievement", icon: "🏆", color: "bg-purple-500/20 text-purple-600 border-purple-500/30" },
  { id: "travel", label: "Travel", icon: "✈️", color: "bg-blue-500/20 text-blue-600 border-blue-500/30" },
  { id: "memory", label: "Memory", icon: "📸", color: "bg-green-500/20 text-green-600 border-green-500/30" },
];

export default function Milestones() {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<ApiMilestone[]>([]);
  const { showLoading, finishLoading } = useFeatureLoading(milestones.length === 0);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("anniversary");
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadMilestones();
  }, []);

  const loadMilestones = async () => {
    try {
      const data = await api.getMilestones();
      setMilestones(data);
    } catch (err) {
      console.error("Failed to load milestones:", err);
    } finally {
      finishLoading();
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !user) return;
    setSubmitting(true);
    try {
      const milestone = await api.addMilestone({
        title: title.trim(),
        date,
        description: description.trim(),
        type: type as any,
        author: user.id,
      });
      setMilestones((prev) => [milestone, ...prev]);
      setTitle("");
      setDate("");
      setDescription("");
      setShowAdd(false);
    } catch (err) {
      console.error("Failed to add milestone:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.deleteMilestone(deleteId);
      setMilestones((prev) => prev.filter((m) => m.id !== deleteId));
    } catch (err) {
      console.error("Failed to delete milestone:", err);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const getDaysSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getMilestoneType = (type: string) => {
    return milestoneTypes.find((t) => t.id === type) || milestoneTypes[0];
  };

  const sortedMilestones = [...milestones].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="max-w-[600px] mx-auto pb-20 md:pb-6 h-screen overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-5 border-b border-border flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
            <Star className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-base">Relationship Milestones</h1>
            <p className="text-xs text-muted-foreground">Track your special moments</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          data-testid="button-add-milestone"
          title="Add new milestone"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* Add Milestone Form */}
      {showAdd && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-b border-border bg-card/50"
        >
          <form onSubmit={handleAdd} className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold">Add Milestone</p>
              <button type="button" onClick={() => setShowAdd(false)} className="text-muted-foreground" title="Close form" aria-label="Close milestone form">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Milestone title..."
              aria-label="Milestone title"
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              data-testid="input-milestone-title"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label="Milestone date"
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              data-testid="input-milestone-date"
            />
            <div>
              <p className="text-xs text-muted-foreground mb-2">Type</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {milestoneTypes.map((mt) => (
                  <button
                    key={mt.id}
                    type="button"
                    onClick={() => setType(mt.id)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                      type === mt.id
                        ? mt.color
                        : "bg-secondary/50 border-border hover:border-primary/50"
                    }`}
                    data-testid={`button-type-${mt.id}`}
                  >
                    <span className="text-xl">{mt.icon}</span>
                    <span className="text-[10px]">{mt.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)..."
              aria-label="Milestone description"
              rows={2}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors resize-none"
              data-testid="input-milestone-description"
            />
            <button
              type="submit"
              disabled={!title.trim() || !date || submitting}
              className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl disabled:opacity-50 text-sm"
              data-testid="button-submit-milestone"
            >
              {submitting ? "Adding..." : "Add Milestone"}
            </button>
          </form>
        </motion.div>
      )}

      {/* Milestones List */}
      <div className="p-4">
        {showLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-secondary/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : sortedMilestones.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center gap-2">
            <Star className="w-12 h-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No milestones yet</p>
            <p className="text-xs text-muted-foreground/60">Add your first milestone to track your journey</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedMilestones.map((milestone, index) => {
              const milestoneType = getMilestoneType(milestone.type);
              const daysSince = getDaysSince(milestone.date);
              return (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card/50 border border-border rounded-2xl p-4 hover:bg-card/70 transition-colors"
                  data-testid={`milestone-${milestone.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${milestoneType.color}`}>
                      {milestoneType.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm">{milestone.title}</p>
                        <button
                          type="button"
                          onClick={() => setDeleteId(milestone.id)}
                          className="text-muted-foreground/40 hover:text-destructive transition-colors p-1"
                          data-testid={`button-delete-milestone-${milestone.id}`}
                          aria-label="Delete milestone"
                          title="Delete milestone"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {new Date(milestone.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      {milestone.description && (
                        <p className="text-sm text-muted-foreground mb-2">{milestone.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${milestoneType.color}`}>
                          {milestoneType.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {daysSince === 0 ? "Today!" : daysSince === 1 ? "Yesterday" : `${daysSince} days ago`}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete milestone?"
        description="This removes it for both of you."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
