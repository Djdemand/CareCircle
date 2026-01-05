-- FORCE PERMISSIONS AND REFRESH CACHE
-- Run this script to fix "schema cache" or "permission denied" errors

BEGIN;

-- 1. Grant usage on public schema (just to be safe)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 2. Grant permissions on ALL new tables to API roles
GRANT ALL ON TABLE public.patients TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.caregivers TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.medications TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.med_logs TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.hydration_logs TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.juice_logs TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.bm_logs TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.team_settings TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.messages TO anon, authenticated, service_role;

-- 3. Ensure Sequences (for auto-increment) are accessible if used
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. Force Schema Cache Reload (Standard)
NOTIFY pgrst, 'reload config';

COMMIT;
