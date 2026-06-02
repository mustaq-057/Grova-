-- Create calendar_events table for shared calendar
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('date', 'anniversary', 'reminder')),
  author TEXT NOT NULL,
  timestamp TEXT NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_author ON calendar_events(author);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(type);
