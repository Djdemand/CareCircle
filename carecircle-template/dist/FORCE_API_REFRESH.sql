-- NUCLEAR OPTION: Force PostgREST to see the patients table
-- This grants all possible permissions and forces multiple cache reloads

BEGIN;

-- 1. Grant schema usage to all API roles
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 2. Grant ALL privileges on the patients table specifically
GRANT ALL PRIVILEGES ON TABLE public.patients TO anon, authenticated, service_role, postgres;

-- 3. Also grant on all other tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. Grant on sequences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 5. Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

COMMIT;

-- 6. Multiple cache reload attempts
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
