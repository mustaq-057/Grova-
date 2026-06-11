import { useState, useEffect, useRef } from "react";
import { useFeatureLoading } from "@/hooks/useFeatureLoading";
import { Plus, Trash2, CheckCircle2, Circle, ListTodo, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { api, type ApiTask } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function CustomSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label ?? value;

  return (
    <div className="relative">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between bg-secondary/50 border border-border/50 hover:border-primary/50 hover:bg-secondary/80 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#1c1c1c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-1"
            >
              {options.map((opt, idx) => {
                const isSelected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition-colors ${
                      idx !== options.length - 1 ? "border-b border-white/5" : ""
                    }`}
                  >
                    <span className="text-[15px] font-medium text-white/90">{opt.label}</span>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected ? "border-[#5b5ef4]" : "border-white/30"
                      }`}
                    >
                      {isSelected && <div className="w-2.5 h-2.5 bg-[#5b5ef4] rounded-full" />}
                    </div>
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Tasks() {
  const { user, partner } = useAuth();
  const partnerId = user?.id === "me" ? "wife" : "me";
  const mustaqLabel =
    user?.id === "me"
      ? (user.name?.split(" ")[0] ?? "Mustaq")
      : (partner?.name?.split(" ")[0] ?? "Mustaq");
  const saraLabel =
    user?.id === "wife"
      ? (user.name?.split(" ")[0] ?? "Sara")
      : (partner?.name?.split(" ")[0] ?? "Sara");
  const myAssignValue = user?.id === "me" ? "me" : "wife";
  const partnerAssignValue = user?.id === "me" ? "wife" : "me";
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const { showLoading, finishLoading } = useFeatureLoading(tasks.length === 0);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>("both");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await api.getTasks();
      setTasks(data);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      finishLoading();
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;
    setSubmitting(true);
    try {
      const task = await api.addTask({
        title: title.trim(),
        assignedTo: assignedTo as "me" | "wife" | "both",
        priority,
        author: user.id,
      });
      setTasks((prev) => [task, ...prev]);
      setTitle("");
      setShowAdd(false);
    } catch (err) {
      console.error("Failed to add task:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    try {
      const updated = await api.updateTask(id, { completed: !completed });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  const handleDelete = async (id: string) => {
    const snapshot = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await api.deleteTask(id);
    } catch (err) {
      console.error("Failed to delete task:", err);
      setTasks(snapshot);
      toast.error("Could not delete task.");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/20 text-red-600 border-red-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
      case "low": return "bg-green-500/20 text-green-600 border-green-500/30";
      default: return "bg-secondary/50 text-muted-foreground border-border";
    }
  };

  const getAssignedLabel = (assignee: string) => {
    if (assignee === "both") return "Both";
    if (assignee === "me") return mustaqLabel;
    if (assignee === "wife") return saraLabel;
    if (assignee === user?.id) return user?.id === "me" ? mustaqLabel : saraLabel;
    if (assignee === partnerId) return user?.id === "me" ? saraLabel : mustaqLabel;
    return assignee;
  };

  const incompleteTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  const groupTasksByDate = (taskList: ApiTask[]) => {
    const groups: Record<string, ApiTask[]> = {};
    for (const t of taskList) {
      const d = new Date(t.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      if (!groups[d]) groups[d] = [];
      groups[d].push(t);
    }
    return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  };

  const renderTaskItem = (task: ApiTask) => (
    <motion.div
      key={task.id}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-2xl p-4 transition-colors ${task.completed ? "bg-card/30 border-border/50 opacity-60" : "bg-card/50 border-border hover:bg-card/70"}`}
      data-testid={`task-${task.id}`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => handleToggleComplete(task.id, task.completed)}
          className="mt-0.5 shrink-0"
          data-testid={task.completed ? `button-uncomplete-task-${task.id}` : `button-complete-task-${task.id}`}
        >
          {task.completed ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium mb-1.5 ${task.completed ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
            <span className="text-[10px] text-muted-foreground">
              Assigned to {getAssignedLabel(task.assignedTo)}
            </span>
          </div>
        </div>
        <button
          onClick={() => handleDelete(task.id)}
          className="shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors p-1"
          data-testid={`button-delete-task-${task.id}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-[600px] mx-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="px-4 py-5 border-b border-border flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
            <ListTodo className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-base">Shared Tasks</h1>
            <p className="text-xs text-muted-foreground">Manage tasks together</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          data-testid="button-add-task"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* Add Task Form */}
      {showAdd && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-b border-border bg-card/50"
        >
          <form onSubmit={handleAdd} className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold">Add Task</p>
              <button type="button" onClick={() => setShowAdd(false)} className="text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              data-testid="input-task-title"
            />
            <div className="grid grid-cols-2 gap-3 relative">
              <CustomSelect
                label="Assigned to"
                value={assignedTo}
                onChange={setAssignedTo}
                options={[
                  { value: "both", label: "Both" },
                  { value: myAssignValue, label: `${user?.id === "me" ? mustaqLabel : saraLabel} (You)` },
                  { value: partnerAssignValue, label: user?.id === "me" ? saraLabel : mustaqLabel },
                ]}
              />
              <CustomSelect
                label="Priority"
                value={priority}
                onChange={(v) => setPriority(v as "low" | "medium" | "high")}
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                ]}
              />
            </div>
            <button
              type="submit"
              disabled={!title.trim() || submitting}
              className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl disabled:opacity-50 text-sm"
              data-testid="button-submit-task"
            >
              {submitting ? "Adding..." : "Add Task"}
            </button>
          </form>
        </motion.div>
      )}

      {/* Tasks List */}
      <div className="p-4">
        {showLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-secondary/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center gap-2">
            <ListTodo className="w-12 h-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No tasks yet</p>
            <p className="text-xs text-muted-foreground/60">Add your first task to get started</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Incomplete Tasks */}
            {incompleteTasks.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-4 text-muted-foreground">To Do ({incompleteTasks.length})</h3>
                <div className="space-y-6">
                  {groupTasksByDate(incompleteTasks).map(([date, dateTasks]) => (
                    <div key={date} className="space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground/80 px-2 uppercase tracking-wider">{date}</h4>
                      {dateTasks.map(renderTaskItem)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div className="pt-4 border-t border-border/50">
                <h3 className="text-sm font-semibold mb-4 text-muted-foreground">Completed ({completedTasks.length})</h3>
                <div className="space-y-6">
                  {groupTasksByDate(completedTasks).map(([date, dateTasks]) => (
                    <div key={date} className="space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground/80 px-2 uppercase tracking-wider">{date}</h4>
                      {dateTasks.map(renderTaskItem)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
