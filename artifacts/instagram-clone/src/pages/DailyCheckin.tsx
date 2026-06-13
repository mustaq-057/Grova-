import { useState, useEffect } from "react";
import { useFeatureLoading } from "@/hooks/useFeatureLoading";
import { useAppSearchParams } from "@/lib/app-search";
import { Heart, MessageCircle, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { api, type ApiCheckin } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const dailyQuestions = [
  "What made you smile today?",
  "What's on your mind today?",
  "How are you feeling today?",
  "What's the best thing that happened today?",
  "What are you looking forward to?",
  "What do you need help with today?",
  "What made today hard, if anything?",
  "What are you grateful for today?",
  "What did you learn today?",
  "What made you laugh today?",
  "What's one small win from today?",
  "How was work or school today?",
  "What would make tomorrow better?",
  "What's something you want to talk about?",
  "How did you take care of yourself today?",
  "What's stressing you out right now?",
  "What's something you're proud of?",
  "What do you want to do this week?",
  "How can I support you today?",
  "What's a goal you're working on?",
];

export default function DailyCheckin() {
  const { user, partner } = useAuth();
  const otherLabel = partner?.name?.split(" ")[0] ?? "Them";
  const [checkins, setCheckins] = useState<ApiCheckin[]>([]);
  const { showLoading, finishLoading } = useFeatureLoading(checkins.length === 0);
  const [showAdd, setShowAdd] = useState(false);
  const [answer, setAnswer] = useState("");
  const [question, setQuestion] = useState("");
  const [mood, setMood] = useState<"happy" | "neutral" | "sad">("happy");
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const searchParams = useAppSearchParams();
  const highlightId = searchParams.get("highlight");

  useEffect(() => {
    loadCheckins();
    setQuestion(dailyQuestions[currentIndex]);
  }, []);

  useEffect(() => {
    if (!highlightId || checkins.length === 0) return;
    const el = document.querySelector(`[data-testid="checkin-${highlightId}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "auto", block: "center" });
    el.classList.add("ring-2", "ring-primary", "ring-offset-2");
    window.history.replaceState({}, "", "/checkin");
  }, [checkins, highlightId]);

  const loadCheckins = async () => {
    try {
      const data = await api.getCheckins();
      setCheckins(data);
    } catch (err) {
      console.error("Failed to load checkins:", err);
    } finally {
      finishLoading();
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || !question || !user) return;
    setSubmitting(true);
    try {
      const checkin = await api.addCheckin({
        question,
        answer: answer.trim(),
        mood,
        author: user.id,
      });
      setCheckins((prev) => [checkin, ...prev]);
      setAnswer("");
      setShowAdd(false);
      // Move to next question
      setCurrentIndex((prev) => (prev + 1) % dailyQuestions.length);
      setQuestion(dailyQuestions[(currentIndex + 1) % dailyQuestions.length]);
    } catch (err) {
      console.error("Failed to add checkin:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteCheckin(id);
      setCheckins((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Failed to delete checkin:", err);
    }
  };

  const nextQuestion = () => {
    setCurrentIndex((prev) => (prev + 1) % dailyQuestions.length);
    setQuestion(dailyQuestions[(currentIndex + 1) % dailyQuestions.length]);
  };

  const previousQuestion = () => {
    setCurrentIndex((prev) => (prev - 1 + dailyQuestions.length) % dailyQuestions.length);
    setQuestion(dailyQuestions[(currentIndex - 1 + dailyQuestions.length) % dailyQuestions.length]);
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case "happy": return "😊";
      case "neutral": return "😐";
      case "sad": return "😢";
      default: return "😊";
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case "happy": return "bg-green-500/20 text-green-600";
      case "neutral": return "bg-yellow-500/20 text-yellow-600";
      case "sad": return "bg-red-500/20 text-red-600";
      default: return "bg-green-500/20 text-green-600";
    }
  };

  return (
    <div className="max-w-[600px] mx-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="px-4 py-5 border-b border-border flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-base">Daily Check-in</h1>
            <p className="text-xs text-muted-foreground">Connect with each other daily</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          data-testid="button-add-checkin"
        >
          <Sparkles className="w-4 h-4" />
          Check In
        </button>
      </div>

      {/* Question of the Day */}
      <div className="p-4">
        <div className="bg-gradient-to-br from-primary/10 via-card/40 to-transparent border border-border/50 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Question of the Day</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={previousQuestion}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                data-testid="button-previous-question"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted-foreground">{currentIndex + 1} / {dailyQuestions.length}</span>
              <button
                onClick={nextQuestion}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                data-testid="button-next-question"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-lg font-medium text-center mb-4">{question}</p>
          <button
            onClick={() => setShowAdd(true)}
            className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/90 transition-colors"
            data-testid="button-answer-question"
          >
            Answer This Question
          </button>
        </div>

        {/* Add Check-in Form */}
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <form onSubmit={handleAdd} className="bg-card/50 border border-border rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Your Answer</p>
                <button type="button" onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>
              <p className="text-sm text-muted-foreground italic">{question}</p>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Share your thoughts..."
                rows={4}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors resize-none"
                data-testid="input-checkin-answer"
              />
              <div>
                <p className="text-xs text-muted-foreground mb-2">How are you feeling?</p>
                <div className="flex gap-2">
                  {(["happy", "neutral", "sad"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMood(m)}
                      className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                        mood === m
                          ? getMoodColor(m)
                          : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                      }`}
                      data-testid={`button-mood-${m}`}
                    >
                      {getMoodEmoji(m)}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={!answer.trim() || submitting}
                className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl disabled:opacity-50 text-sm"
                data-testid="button-submit-checkin"
              >
                {submitting ? "Saving..." : "Save Check-in"}
              </button>
            </form>
          </motion.div>
        )}

        {/* Check-ins History */}
        <div>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            Recent Check-ins
          </h3>
          {showLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-secondary/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : checkins.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center gap-2">
              <MessageCircle className="w-12 h-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No check-ins yet</p>
              <p className="text-xs text-muted-foreground/60">Start connecting with daily check-ins</p>
            </div>
          ) : (
            <div className="space-y-3">
              {checkins.map((checkin) => (
                <motion.div
                  key={checkin.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card/50 border border-border rounded-2xl p-4 hover:bg-card/70 transition-colors"
                  data-testid={`checkin-${checkin.id}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">
                        {checkin.author === user?.id ? "You" : otherLabel} · {new Date(checkin.timestamp).toLocaleDateString()}
                      </p>
                      <p className="text-sm font-medium mb-1">{checkin.question}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-lg text-xs font-medium ${getMoodColor(checkin.mood)}`}>
                      {getMoodEmoji(checkin.mood)}
                    </div>
                  </div>
                  <p className="text-sm text-foreground mb-3">{checkin.answer}</p>
                  <button
                    onClick={() => handleDelete(checkin.id)}
                    className="text-xs text-muted-foreground/40 hover:text-destructive transition-colors"
                    data-testid={`button-delete-checkin-${checkin.id}`}
                  >
                    Delete
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
