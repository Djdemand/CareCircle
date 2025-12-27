-- Migration: Add notes column to med_logs table
-- Created: 2025-12-27

-- Add notes column if it doesn't exist
ALTER TABLE med_logs ADD COLUMN IF NOT EXISTS notes TEXT;
