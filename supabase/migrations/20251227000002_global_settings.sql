-- Migration: Add global team settings
-- Created: 2025-12-27
-- Version: 3.5.0

-- 1. Create team_settings table
CREATE TABLE IF NOT EXISTS team_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hydration_goal INTEGER DEFAULT 128,
    juice_goal INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE team_settings ENABLE ROW LEVEL SECURITY;

-- 3. Add policy
DROP POLICY IF EXISTS "Team access" ON team_settings;
CREATE POLICY "Team access" ON team_settings FOR ALL USING (true);

-- 4. Insert default settings if not exists
INSERT INTO team_settings (hydration_goal, juice_goal)
SELECT 128, 0
WHERE NOT EXISTS (SELECT 1 FROM team_settings);
