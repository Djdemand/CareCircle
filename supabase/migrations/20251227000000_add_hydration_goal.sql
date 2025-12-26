-- Add hydration_goal column to caregivers table
-- This allows users to set a custom daily hydration goal
-- Default value is 128 oz to maintain existing behavior
ALTER TABLE caregivers
ADD COLUMN IF NOT EXISTS hydration_goal INTEGER DEFAULT 128;
