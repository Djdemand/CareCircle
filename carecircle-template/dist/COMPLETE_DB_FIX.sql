-- ============================================================================
-- COMPLETE DATABASE FIX FOR CARECIRCLE V2
-- Run this in Supabase SQL Editor to fix ALL issues
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Fix column name mismatch (amount_ml vs amount_oz)
-- ============================================================================

-- Add amount_oz column if it doesn't exist (for hydration_logs)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'hydration_logs' AND column_name = 'amount_oz') THEN
        ALTER TABLE hydration_logs ADD COLUMN amount_oz INTEGER;
    END IF;
END $$;

-- Copy data from amount_ml to amount_oz if amount_ml exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'hydration_logs' AND column_name = 'amount_ml') THEN
        UPDATE hydration_logs SET amount_oz = COALESCE(amount_ml / 30, 0) WHERE amount_oz IS NULL;
    END IF;
END $$;

-- Set default for amount_oz
ALTER TABLE hydration_logs ALTER COLUMN amount_oz SET DEFAULT 0;

-- Add amount_oz column if it doesn't exist (for juice_logs)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'juice_logs' AND column_name = 'amount_oz') THEN
        ALTER TABLE juice_logs ADD COLUMN amount_oz INTEGER;
    END IF;
END $$;

-- Copy data from amount_ml to amount_oz if amount_ml exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'juice_logs' AND column_name = 'amount_ml') THEN
        UPDATE juice_logs SET amount_oz = COALESCE(amount_ml / 30, 0) WHERE amount_oz IS NULL;
    END IF;
END $$;

-- Set default for amount_oz
ALTER TABLE juice_logs ALTER COLUMN amount_oz SET DEFAULT 0;

-- ============================================================================
-- STEP 2: Drop ALL existing RLS policies to start fresh
-- ============================================================================

DROP POLICY IF EXISTS "patients_all_access" ON patients;
DROP POLICY IF EXISTS "caregivers_own_record" ON caregivers;
DROP POLICY IF EXISTS "caregivers_view_team" ON caregivers;
DROP POLICY IF EXISTS "medications_team_access" ON medications;
DROP POLICY IF EXISTS "med_logs_team_access" ON med_logs;
DROP POLICY IF EXISTS "hydration_logs_team_access" ON hydration_logs;
DROP POLICY IF EXISTS "juice_logs_team_access" ON juice_logs;
DROP POLICY IF EXISTS "bm_logs_team_access" ON bm_logs;
DROP POLICY IF EXISTS "messages_team_access" ON messages;
DROP POLICY IF EXISTS "team_settings_team_access" ON team_settings;

DROP POLICY IF EXISTS "Authenticated users can access patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can access caregivers" ON caregivers;
DROP POLICY IF EXISTS "Access own patient" ON patients;
DROP POLICY IF EXISTS "Allow insert patient" ON patients;
DROP POLICY IF EXISTS "Team access caregivers" ON caregivers;
DROP POLICY IF EXISTS "Allow insert caregiver" ON caregivers;
DROP POLICY IF EXISTS "Users can access own record" ON caregivers;
DROP POLICY IF EXISTS "Users can view team members" ON caregivers;
DROP POLICY IF EXISTS "Admins can modify team" ON caregivers;
DROP POLICY IF EXISTS "Team access medications" ON medications;
DROP POLICY IF EXISTS "Team access med_logs" ON med_logs;
DROP POLICY IF EXISTS "Team access hydration_logs" ON hydration_logs;
DROP POLICY IF EXISTS "Team access juice_logs" ON juice_logs;
DROP POLICY IF EXISTS "Team access bm_logs" ON bm_logs;
DROP POLICY IF EXISTS "Team access messages" ON messages;
DROP POLICY IF EXISTS "Team access team_settings" ON team_settings;

-- ============================================================================
-- STEP 3: Create SECURITY DEFINER helper function (bypasses RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_my_patient_id() 
RETURNS UUID AS $$
  SELECT patient_id FROM public.caregivers WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- STEP 4: Create simple, non-recursive RLS policies for ALL tables
-- ============================================================================

-- PATIENTS: Open for authenticated (security handled by patient_id in other tables)
CREATE POLICY "patients_full_access" ON patients 
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- CAREGIVERS: Users can access their own record
CREATE POLICY "caregivers_self_access" ON caregivers 
  FOR ALL TO authenticated
  USING (id = auth.uid());

-- CAREGIVERS: Users can SELECT team members via function
CREATE POLICY "caregivers_team_view" ON caregivers 
  FOR SELECT TO authenticated
  USING (patient_id = get_my_patient_id());

-- MEDICATIONS: Team access via function
CREATE POLICY "medications_access" ON medications 
  FOR ALL TO authenticated
  USING (patient_id = get_my_patient_id()) 
  WITH CHECK (patient_id = get_my_patient_id());

-- MED_LOGS: Team access via function
CREATE POLICY "med_logs_access" ON med_logs 
  FOR ALL TO authenticated
  USING (patient_id = get_my_patient_id()) 
  WITH CHECK (patient_id = get_my_patient_id());

-- HYDRATION_LOGS: Team access via function
CREATE POLICY "hydration_logs_access" ON hydration_logs 
  FOR ALL TO authenticated
  USING (patient_id = get_my_patient_id()) 
  WITH CHECK (patient_id = get_my_patient_id());

-- JUICE_LOGS: Team access via function
CREATE POLICY "juice_logs_access" ON juice_logs 
  FOR ALL TO authenticated
  USING (patient_id = get_my_patient_id()) 
  WITH CHECK (patient_id = get_my_patient_id());

-- BM_LOGS: Team access via function
CREATE POLICY "bm_logs_access" ON bm_logs 
  FOR ALL TO authenticated
  USING (patient_id = get_my_patient_id()) 
  WITH CHECK (patient_id = get_my_patient_id());

-- MESSAGES: Team access via function
CREATE POLICY "messages_access" ON messages 
  FOR ALL TO authenticated
  USING (patient_id = get_my_patient_id()) 
  WITH CHECK (patient_id = get_my_patient_id());

-- TEAM_SETTINGS: Team access via function
CREATE POLICY "team_settings_access" ON team_settings 
  FOR ALL TO authenticated
  USING (patient_id = get_my_patient_id()) 
  WITH CHECK (patient_id = get_my_patient_id());

COMMIT;

-- Reload API cache
NOTIFY pgrst, 'reload config';

-- Verification message
DO $$
BEGIN
    RAISE NOTICE 'All RLS policies and column fixes applied successfully!';
END $$;
