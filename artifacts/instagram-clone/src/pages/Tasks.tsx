import { useState, useEffect } from "react";
import { useDelayedSpinner } from "@/hooks/useDelayedSpinner";
import { Plus, Trash2, Check, CheckCircle2, Circle, ListTodo, X } from "lucide-react";
import { motion } from "framer-motion";
import { api, type ApiTask } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function Tasks() {
  const { user, partner } = useAuth();
  const otherLabel = partner?.name?.split(" ")[0] ?? "Them";
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [fetching, setFetching] = useState(true);
  const showLoading = useDelayedSpinner(fetching);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState<"me" | "wife" | "both">("both");
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
      setFetching(false);
    }
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
    try {
      await api.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Failed to delete task:", err);
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

  const getAssignedLabel = (assignedTo: string) => {
    switch (assignedTo) {
      case "me": return user?.id === "me" ? "You" : otherLabel;
      case "wife": return user?.id === "wife" ? "You" : otherLabel;
      case "both": return "Both";
      default: return assignedTo;
    }
  };

  const incompleteTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Assigned to</p>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value as any)}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                  data-testid="input-task-assigned"
                >
                  <option value="both">Both</option>
                  <option value="me">You</option>
                  <option value="wife">{otherLabel}</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Priority</p>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                  data-testid="input-task-priority"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
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
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
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
