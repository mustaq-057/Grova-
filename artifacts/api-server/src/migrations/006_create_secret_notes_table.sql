-- Create secret_notes table for private encrypted messages
CREATE TABLE IF NOT EXISTS secret_notes (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  timestamp TEXT NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_secret_notes_timestamp ON secret_notes(timestamp);
CREATE INDEX IF NOT EXISTS idx_secret_notes_author ON secret_notes(author);
