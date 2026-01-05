-- FINAL DATABASE FIX - Run this in Supabase SQL Editor
-- This handles the "already exists" errors and fixes the column issue

-- ============================================
-- STEP 1: Fix the column constraint issue
-- The column is named amount_ml but has NOT NULL constraint
-- We'll either rename it OR drop the constraint
-- ============================================

-- Option A: Rename the column from amount_ml to amount_oz
ALTER TABLE hydration_logs RENAME COLUMN amount_ml TO amount_oz;
ALTER TABLE juice_logs RENAME COLUMN amount_ml TO amount_oz;
