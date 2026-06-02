-- Create daily_checkins table for daily relationship check-ins
CREATE TABLE IF NOT EXISTS daily_checkins (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  mood TEXT NOT NULL CHECK (mood IN ('happy', 'neutral', 'sad')),
  author TEXT NOT NULL,
  timestamp TEXT NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_checkins_timestamp ON daily_checkins(timestamp);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_author ON daily_checkins(author);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_mood ON daily_checkins(mood);
