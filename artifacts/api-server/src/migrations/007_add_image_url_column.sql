-- Add image_url and file columns to messages table for Blackblaze B2 storage
ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_data TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS thread_id TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS thread_parent_id TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS thread_reply_count INTEGER DEFAULT 0;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_messages_image_url ON messages(image_url);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_parent_id ON messages(thread_parent_id);
