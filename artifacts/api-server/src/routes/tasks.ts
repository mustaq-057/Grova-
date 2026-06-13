import { Router } from "express";
import { randomUUID } from "crypto";
import db from "../lib/db";
import { broadcast } from "../lib/sse";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";
import { postCoupleActivity, profileDisplayName } from "../lib/activity-feed";

interface Task {
  id: string;
  title: string;
  assignedTo: "me" | "wife" | "both";
  priority: "low" | "medium" | "high";
  completed: boolean;
  author: string;
  timestamp: string;
}

const router = Router();

router.get("/tasks", rateLimiters.read, authenticate, async (_req, res) => {
  try {
    const result = await db.execute("SELECT * FROM shared_tasks ORDER BY completed ASC, priority DESC, timestamp DESC");
    const tasks = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      assignedTo: row.assigned_to,
      priority: row.priority,
      completed: Boolean(row.completed),
      author: row.author,
      timestamp: row.timestamp,
    }));
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

router.post("/tasks", rateLimiters.messages, authenticate, async (req, res) => {
  const { title, assignedTo, priority, author } = req.body as {
    title: string;
    assignedTo: "me" | "wife" | "both";
    priority: "low" | "medium" | "high";
    author: string;
  };
  if (!title || !assignedTo || !priority || !author) {
    res.status(400).json({ error: "title, assignedTo, priority, and author required" });
    return;
  }

  const id = randomUUID();
  const timestamp = new Date().toISOString();

  try {
    await db.execute(
      "INSERT INTO shared_tasks (id, title, assigned_to, priority, completed, author, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [id, title, assignedTo, priority, 0, author, timestamp]
    );

    const task: Task = {
      id,
      title,
      assignedTo,
      priority,
      completed: false,
      author,
      timestamp,
    };
    
    // Broadcast new task to all clients
    broadcast("task-added", task);

    const [fromName, mustaqName, saraName] = await Promise.all([
      profileDisplayName(author),
      profileDisplayName("me"),
      profileDisplayName("wife"),
    ]);
    const assigneeNames =
      assignedTo === "both"
        ? `${mustaqName} & ${saraName}`
        : assignedTo === "me"
          ? mustaqName
          : saraName;
    void postCoupleActivity(
      "task",
      author,
      fromName,
      `assigned ${assigneeNames}: ${title}`,
    ).catch(() => {});

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: "Failed to create task" });
  }
});

router.put("/tasks/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body as { completed?: boolean };

  if (completed === undefined) {
    res.status(400).json({ error: "completed field required" });
    return;
  }

  try {
    await db.execute("UPDATE shared_tasks SET completed = $1 WHERE id = $2", [completed ? 1 : 0, id]);
    
    // Fetch updated task
    const result = await db.execute("SELECT * FROM shared_tasks WHERE id = $1", [id]);
    const task = result.rows[0];
    
    // Broadcast task update to all clients
    broadcast("task-updated", {
      id: task.id,
      title: task.title,
      assignedTo: task.assigned_to,
      priority: task.priority,
      completed: task.completed,
      author: task.author,
      timestamp: task.timestamp,
    });

    res.json({
      id: task.id,
      title: task.title,
      assignedTo: task.assigned_to,
      priority: task.priority,
      completed: task.completed,
      author: task.author,
      timestamp: task.timestamp,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update task" });
  }
});

router.delete("/tasks/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute("DELETE FROM shared_tasks WHERE id = $1", [id]);
    
    // Broadcast task deletion to all clients
    broadcast("task-deleted", { id });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete task" });
  }
});

export default router;
