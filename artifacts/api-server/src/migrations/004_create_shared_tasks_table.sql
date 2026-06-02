-- Create shared_tasks table for shared to-do list
CREATE TABLE IF NOT EXISTS shared_tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  assigned_to TEXT NOT NULL CHECK (assigned_to IN ('me', 'wife', 'both')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  author TEXT NOT NULL,
  timestamp TEXT NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shared_tasks_completed ON shared_tasks(completed);
CREATE INDEX IF NOT EXISTS idx_shared_tasks_priority ON shared_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_shared_tasks_assigned_to ON shared_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_shared_tasks_author ON shared_tasks(author);
