-- ============================================================================
-- RESET ALL DATA - COMPLETE WIPE
-- ⚠️ WARNING: This will DELETE ALL DATA including ACCOUNTS!
-- ⚠️ This CANNOT be undone! Make a backup first if you have important data.
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Truncate all application tables (Data)
-- Using CASCADE to handle all foreign key constraints automatically
TRUNCATE TABLE 
    med_logs, 
    hydration_logs, 
    juice_logs, 
    bm_logs, 
    messages, 
    team_settings, 
    medications, 
    caregiver_patients, 
    caregivers, 
    patients
RESTART IDENTITY CASCADE;

-- 2. Delete all Authentication Users
-- This forces all users to signup again and verify email
DELETE FROM auth.users;

-- 3. Reload API cache to ensure no stale schema data
NOTIFY pgrst, 'reload config';

-- 4. Verification
DO $$
DECLARE
    user_count INTEGER;
    patient_count INTEGER;
BEGIN
    SELECT count(*) INTO user_count FROM auth.users;
    SELECT count(*) INTO patient_count FROM public.patients;
    
    RAISE NOTICE '✅ System Wipe Complete';
    RAISE NOTICE '----------------------';
    RAISE NOTICE 'Remaining Auth Users: %', user_count;
    RAISE NOTICE 'Remaining Patients:   %', patient_count;
    RAISE NOTICE '';
    RAISE NOTICE 'You can now create new accounts and start fresh.';
END $$;
