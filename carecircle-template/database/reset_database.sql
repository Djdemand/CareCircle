-- Script to RESET the database (DROP ALL TABLES)
-- Run this BEFORE setup_database.sql if you need a clean slate.

BEGIN;

-- Drop tables in dependency order (child tables first)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS team_settings CASCADE;
DROP TABLE IF EXISTS bm_logs CASCADE;
DROP TABLE IF EXISTS juice_logs CASCADE;
DROP TABLE IF EXISTS hydration_logs CASCADE;
DROP TABLE IF EXISTS med_logs CASCADE;
DROP TABLE IF EXISTS medications CASCADE;
DROP TABLE IF EXISTS caregivers CASCADE;
DROP TABLE IF EXISTS patients CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_my_patient_id();

COMMIT;

-- Verification
DO $$
BEGIN
    RAISE NOTICE 'Database reset complete. All tables dropped.';
END $$;