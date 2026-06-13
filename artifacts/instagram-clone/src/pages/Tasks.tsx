import { useState, useEffect, useMemo } from "react";
import { useFeatureLoading } from "@/hooks/useFeatureLoading";
import { Plus, Trash2, CheckCircle2, Circle, ListTodo, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api, type ApiTask } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AvatarImage } from "@/components/AvatarImage";
type AssignValue = "me" | "wife" | "both";

export default function Tasks() {
  const { user, partner } = useAuth();
  const mustaqLabel = useMemo(
    () =>
      user?.id === "me"
        ? (user.name?.split(" ")[0] ?? "Mustaq")
        : (partner?.name?.split(" ")[0] ?? "Mustaq"),
    [user, partner],
  );
  const saraLabel = useMemo(
    () =>
      user?.id === "wife"
        ? (user.name?.split(" ")[0] ?? "Sara")
        : (partner?.name?.split(" ")[0] ?? "Sara"),
    [user, partner],
  );
  const mustaqAvatar = user?.id === "me" ? user.avatar : partner?.avatar;
  const saraAvatar = user?.id === "wife" ? user.avatar : partner?.avatar;

  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const { showLoading, finishLoading } = useFeatureLoading(tasks.length === 0);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState<AssignValue>("both");
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

  const getAssignedLabel = (assignee: string) => {
    if (assignee === "both") return `${mustaqLabel} & ${saraLabel}`;
    if (assignee === "me") return mustaqLabel;
    if (assignee === "wife") return saraLabel;
    return assignee;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;
    setSubmitting(true);
    try {
      const task = await api.addTask({
        title: title.trim(),
        assignedTo,
        priority,
        author: user.id,
      });
      setTasks((prev) => [task, ...prev]);
      setTitle("");
      setAssignedTo("both");
      setShowAdd(false);
      toast.success("Task added");
    } catch (err) {
      console.error("Failed to add task:", err);
      toast.error("Could not add task.");
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

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "high":
        return "bg-red-500/20 text-red-600 border-red-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
      case "low":
        return "bg-green-500/20 text-green-600 border-green-500/30";
      default:
        return "bg-secondary/50 text-muted-foreground border-border";
    }
  };

  const assignOptions: {
    value: AssignValue;
    label: string;
    avatars?: { id: string; src?: string; alt: string }[];
  }[] = [
    {
      value: "both",
      label: "Both",
      avatars: [
        { id: "me", src: mustaqAvatar, alt: mustaqLabel },
        { id: "wife", src: saraAvatar, alt: saraLabel },
      ],
    },
    {
      value: "me",
      label: mustaqLabel,
      avatars: [{ id: "me", src: mustaqAvatar, alt: mustaqLabel }],
    },
    {
      value: "wife",
      label: saraLabel,
      avatars: [{ id: "wife", src: saraAvatar, alt: saraLabel }],
    },
  ];

  const incompleteTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  const renderAssigneeAvatars = (assignee: string) => {
    if (assignee === "both") {
      return (
        <span className="inline-flex -space-x-1.5 shrink-0">
          <AvatarImage src={mustaqAvatar} userId="me" alt={mustaqLabel} className="w-5 h-5 rounded-full ring-2 ring-card object-cover" />
          <AvatarImage src={saraAvatar} userId="wife" alt={saraLabel} className="w-5 h-5 rounded-full ring-2 ring-card object-cover" />
        </span>
      );
    }
    const id = assignee === "me" ? "me" : "wife";
    const src = assignee === "me" ? mustaqAvatar : saraAvatar;
    const alt = assignee === "me" ? mustaqLabel : saraLabel;
    return (
      <AvatarImage src={src} userId={id} alt={alt} className="w-5 h-5 rounded-full shrink-0 object-cover" />
    );
  };

  return (
    <div className="max-w-[600px] mx-auto pb-20 md:pb-6">
      <div className="px-4 py-5 border-b border-border flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
            <ListTodo className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-base">Shared Tasks</h1>
            <p className="text-xs text-muted-foreground">
              {mustaqLabel} & {saraLabel}
            </p>
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

      {showAdd && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-b border-border bg-card/50"
        >
          <form onSubmit={handleAdd} className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">New task</p>
              <button type="button" onClick={() => setShowAdd(false)} className="text-muted-foreground p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              data-testid="input-task-title"
            />

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Assign to</p>
              <div className="grid grid-cols-3 gap-2" data-testid="input-task-assigned">
                {assignOptions.map((opt) => {
                  const selected = assignedTo === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAssignedTo(opt.value)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 transition-all ${
                        selected
                          ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                          : "border-border bg-secondary/40 hover:bg-secondary/70"
                      }`}
                    >
                      {opt.value === "both" ? (
                        <span className="inline-flex -space-x-2">
                          {opt.avatars?.map((a) => (
                            <AvatarImage
                              key={a.id}
                              src={a.src}
                              userId={a.id}
                              alt={a.alt}
                              className="w-8 h-8 rounded-full ring-2 ring-background object-cover"
                            />
                          ))}
                        </span>
                      ) : (
                        <AvatarImage
                          src={opt.avatars?.[0]?.src}
                          userId={opt.avatars?.[0]?.id ?? "me"}
                          alt={opt.label}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <span className={`text-[11px] font-semibold leading-tight text-center ${selected ? "text-primary" : ""}`}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Priority</p>
              <div className="flex gap-2">
                {(["low", "medium", "high"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize border transition-colors ${
                      priority === p
                        ? getPriorityColor(p)
                        : "border-border bg-secondary/40 text-muted-foreground"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!title.trim() || submitting}
              className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl disabled:opacity-50 text-sm"
              data-testid="button-submit-task"
            >
              {submitting ? "Adding..." : "Add task"}
            </button>
          </form>
        </motion.div>
      )}

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
            {incompleteTasks.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">To Do ({incompleteTasks.length})</h3>
                <div className="space-y-3">
                  {incompleteTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card/50 border border-border rounded-2xl p-4 hover:bg-card/70 transition-colors"
                      data-testid={`task-${task.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleToggleComplete(task.id, task.completed)}
                          className="mt-0.5 shrink-0"
                          data-testid={`button-complete-task-${task.id}`}
                        >
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium mb-2">{task.title}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                              {renderAssigneeAvatars(task.assignedTo)}
                              {getAssignedLabel(task.assignedTo)}
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
                  ))}
                </div>
              </div>
            )}

            {completedTasks.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Completed ({completedTasks.length})</h3>
                <div className="space-y-3">
                  {completedTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card/30 border border-border/50 rounded-2xl p-4 opacity-60"
                      data-testid={`task-${task.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleToggleComplete(task.id, task.completed)}
                          className="mt-0.5 shrink-0"
                          data-testid={`button-uncomplete-task-${task.id}`}
                        >
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium mb-2 line-through text-muted-foreground">{task.title}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              {renderAssigneeAvatars(task.assignedTo)}
                              {getAssignedLabel(task.assignedTo)}
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
