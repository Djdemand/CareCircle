-- Migration: Add position and mandatory fields to medications table
-- Created: 2025-12-27

-- 1. Add position field for custom ordering
ALTER TABLE medications ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- 2. Add mandatory field to track if medication is mandatory
ALTER TABLE medications ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN DEFAULT false;

-- 3. Add created_at field if it doesn't exist (for ordering fallback)
ALTER TABLE medications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Update existing medications to have sequential positions
UPDATE medications 
SET position = (
  SELECT ROW_NUMBER() OVER (ORDER BY COALESCE(created_at, NOW()) DESC) - 1
  FROM medications m2
  WHERE m2.id = medications.id
)
WHERE position = 0;

-- 5. Create index on position for better query performance
CREATE INDEX IF NOT EXISTS idx_medications_position ON medications(position);
