-- Migration: Add BM tracking and Juice tracking
-- Created: 2025-12-27
-- Version: 3.4.0

-- 1. Add mandatory flag to medications table
ALTER TABLE medications ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN DEFAULT FALSE;

-- 2. Create BM (Bowel Movement) tracking table
CREATE TABLE IF NOT EXISTS bm_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caregiver_id UUID REFERENCES caregivers(id),
    had_bm BOOLEAN NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- 3. Create Juice tracking table
CREATE TABLE IF NOT EXISTS juice_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caregiver_id UUID REFERENCES caregivers(id),
    amount_oz INTEGER NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add juice_goal column to caregivers table
ALTER TABLE caregivers ADD COLUMN IF NOT EXISTS juice_goal INTEGER DEFAULT 0;

-- 5. Enable RLS on new tables
ALTER TABLE bm_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE juice_logs ENABLE ROW LEVEL SECURITY;

-- 6. Add policies for new tables
DROP POLICY IF EXISTS "Team access" ON bm_logs;
CREATE POLICY "Team access" ON bm_logs FOR ALL USING (true);

DROP POLICY IF EXISTS "Team access" ON juice_logs;
CREATE POLICY "Team access" ON juice_logs FOR ALL USING (true);
