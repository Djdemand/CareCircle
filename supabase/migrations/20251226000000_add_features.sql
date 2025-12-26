-- Migration: Add login count, soft delete, and messaging
-- Created: 2025-12-26

-- 1. Add columns to caregivers table
ALTER TABLE caregivers ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;
ALTER TABLE caregivers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES caregivers(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 4. Add policy for messages
CREATE POLICY "Team access" ON messages FOR ALL USING (true);
