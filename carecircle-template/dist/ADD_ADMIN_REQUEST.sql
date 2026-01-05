-- ADD ADMIN REQUEST SUPPORT TO MESSAGES TABLE
-- Run this in Supabase SQL Editor

-- Add message_type column for different types of messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'message';

-- Add resolved column for tracking admin request status
ALTER TABLE messages ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT false;

-- Add sender_id column for tracking who sent the message
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES auth.users(id);

-- Reload cache
NOTIFY pgrst, 'reload config';
