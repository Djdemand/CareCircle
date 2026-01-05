-- FIX ANONYMOUS ACCESS TO VISIBLE PATIENTS
-- This is required for the signup screen to show the list of patients before login

BEGIN;

-- Allow anonymous users to view patients that are marked as visible
-- This enables fetching the list in the signup screen (showLogin function)

DROP POLICY IF EXISTS "Public patients are visible to everyone" ON patients;

CREATE POLICY "Public patients are visible to everyone" 
ON patients 
FOR SELECT 
TO anon, authenticated
USING (is_visible = true);

COMMIT;

-- Reload cache
NOTIFY pgrst, 'reload config';
