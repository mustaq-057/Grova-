-- Create relationship_milestones table for tracking relationship milestones
CREATE TABLE IF NOT EXISTS relationship_milestones (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('anniversary', 'first_date', 'special_moment', 'achievement', 'travel', 'memory')),
  author TEXT NOT NULL,
  timestamp TEXT NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_relationship_milestones_date ON relationship_milestones(date);
CREATE INDEX IF NOT EXISTS idx_relationship_milestones_type ON relationship_milestones(type);
CREATE INDEX IF NOT EXISTS idx_relationship_milestones_author ON relationship_milestones(author);
