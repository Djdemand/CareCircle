-- ============================================================================
-- ADD PATIENT VISIBILITY COLUMN
-- Allows admins to hide their patient from the public list
-- Users can still join by typing the exact patient name
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Add is_visible column (default true = visible in signup list)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Reload schema cache
NOTIFY pgrst, 'reload config';
