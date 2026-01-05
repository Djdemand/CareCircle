-- ============================================================================
-- GLOBAL FACTORY RESET FUNCTION
-- This RPC allows an authorized admin to wipe the ENTIRE database
-- ⚠️ EXTREMELY DANGEROUS - DELETE AFTER DEVELOPMENT
-- ============================================================================

CREATE OR REPLACE FUNCTION admin_wipe_system()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Truncate all application table data
    TRUNCATE TABLE 
        public.med_logs, 
        public.hydration_logs, 
        public.juice_logs, 
        public.bm_logs, 
        public.messages, 
        public.team_settings, 
        public.medications, 
        public.caregiver_patients, 
        public.caregivers, 
        public.patients
    RESTART IDENTITY CASCADE;

    -- 2. Delete all Auth Users (requires running as superuser or having permissions)
    -- Note: Standard Postgres functions can't always delete from auth.users due to
    -- Supabase internal permissions. If this fails, the app data is still wiped.
    BEGIN
        DELETE FROM auth.users;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Could not delete auth users: %', SQLERRM;
        -- Continue even if auth deletion fails (though it leaves "ghost" users)
    END;
END;
$$;

-- Reload Schema Cache
NOTIFY pgrst, 'reload config';
