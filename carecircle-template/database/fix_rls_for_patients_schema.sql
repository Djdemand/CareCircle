-- ============================================================================
-- RLS POLICY FIX FOR PATIENTS-BASED MULTITENANCY
-- This script fixes RLS policies to work with the patients table schema
-- ============================================================================

-- Step 1: Drop all existing policies first
DROP POLICY IF EXISTS "Users can view their own patient" ON patients;
DROP POLICY IF EXISTS "Users can insert their own patient" ON patients;
DROP POLICY IF EXISTS "Users can update their own patient" ON patients;
DROP POLICY IF EXISTS "Users can delete their own patient" ON patients;
DROP POLICY IF EXISTS "Access own patient" ON patients;
DROP POLICY IF EXISTS "Allow insert patient" ON patients;

DROP POLICY IF EXISTS "Users can view caregivers in their patient circle" ON caregivers;
DROP POLICY IF EXISTS "Users can insert their own caregiver record" ON caregivers;
DROP POLICY IF EXISTS "Users can update caregivers in their patient circle" ON caregivers;
DROP POLICY IF EXISTS "Users can delete caregivers in their patient circle" ON caregivers;
DROP POLICY IF EXISTS "Team access caregivers" ON caregivers;
DROP POLICY IF EXISTS "Allow insert caregiver" ON caregivers;

DROP POLICY IF EXISTS "Users can view medications for their patient" ON medications;
DROP POLICY IF EXISTS "Users can insert medications for their patient" ON medications;
DROP POLICY IF EXISTS "Users can update medications for their patient" ON medications;
DROP POLICY IF EXISTS "Users can delete medications for their patient" ON medications;
DROP POLICY IF EXISTS "Team access medications" ON medications;

DROP POLICY IF EXISTS "Users can view med logs for their patient" ON med_logs;
DROP POLICY IF EXISTS "Users can insert med logs for their patient" ON med_logs;
DROP POLICY IF EXISTS "Users can update med logs for their patient" ON med_logs;
DROP POLICY IF EXISTS "Users can delete med logs for their patient" ON med_logs;
DROP POLICY IF EXISTS "Team access med_logs" ON med_logs;

DROP POLICY IF EXISTS "Users can view hydration logs for their patient" ON hydration_logs;
DROP POLICY IF EXISTS "Users can insert hydration logs for their patient" ON hydration_logs;
DROP POLICY IF EXISTS "Users can update hydration logs for their patient" ON hydration_logs;
DROP POLICY IF EXISTS "Users can delete hydration logs for their patient" ON hydration_logs;
DROP POLICY IF EXISTS "Team access hydration_logs" ON hydration_logs;

DROP POLICY IF EXISTS "Users can view juice logs for their patient" ON juice_logs;
DROP POLICY IF EXISTS "Users can insert juice logs for their patient" ON juice_logs;
DROP POLICY IF EXISTS "Users can update juice logs for their patient" ON juice_logs;
DROP POLICY IF EXISTS "Users can delete juice logs for their patient" ON juice_logs;
DROP POLICY IF EXISTS "Team access juice_logs" ON juice_logs;

DROP POLICY IF EXISTS "Users can view BM logs for their patient" ON bm_logs;
DROP POLICY IF EXISTS "Users can insert BM logs for their patient" ON bm_logs;
DROP POLICY IF EXISTS "Users can update BM logs for their patient" ON bm_logs;
DROP POLICY IF EXISTS "Users can delete BM logs for their patient" ON bm_logs;
DROP POLICY IF EXISTS "Team access bm_logs" ON bm_logs;

DROP POLICY IF EXISTS "Users can view team settings for their patient" ON team_settings;
DROP POLICY IF EXISTS "Users can insert team settings for their patient" ON team_settings;
DROP POLICY IF EXISTS "Users can update team settings for their patient" ON team_settings;
DROP POLICY IF EXISTS "Users can delete team settings for their patient" ON team_settings;
DROP POLICY IF EXISTS "Team access team_settings" ON team_settings;

DROP POLICY IF EXISTS "Users can view messages for their patient" ON messages;
DROP POLICY IF EXISTS "Users can insert messages for their patient" ON messages;
DROP POLICY IF EXISTS "Users can update messages for their patient" ON messages;
DROP POLICY IF EXISTS "Users can delete messages for their patient" ON messages;
DROP POLICY IF EXISTS "Team access messages" ON messages;

-- Step 2: Ensure RLS is enabled on all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE med_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE juice_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bm_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Step 3: Create or replace helper function for RLS
CREATE OR REPLACE FUNCTION get_my_patient_id() RETURNS UUID AS $$
    SELECT patient_id FROM caregivers WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Step 4: Create new permissive policies that allow authenticated users to manage their data

-- Patients policies
CREATE POLICY "Users can view their own patient" ON patients
  FOR SELECT
  TO authenticated
  USING (id = get_my_patient_id());

CREATE POLICY "Users can insert their own patient" ON patients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own patient" ON patients
  FOR UPDATE
  TO authenticated
  USING (id = get_my_patient_id())
  WITH CHECK (id = get_my_patient_id());

CREATE POLICY "Users can delete their own patient" ON patients
  FOR DELETE
  TO authenticated
  USING (id = get_my_patient_id());

-- Caregivers policies
CREATE POLICY "Users can view caregivers in their patient circle" ON caregivers
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    (patient_id IS NOT NULL AND patient_id = get_my_patient_id())
  );

CREATE POLICY "Users can insert their own caregiver record" ON caregivers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update caregivers in their patient circle" ON caregivers
  FOR UPDATE
  TO authenticated
  USING (patient_id = get_my_patient_id())
  WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "Users can delete caregivers in their patient circle" ON caregivers
  FOR DELETE
  TO authenticated
  USING (patient_id = get_my_patient_id());

-- Medications policies
CREATE POLICY "Users can view medications for their patient" ON medications
  FOR SELECT
  TO authenticated
  USING (patient_id = get_my_patient_id());

CREATE POLICY "Users can insert medications for their patient" ON medications
  FOR INSERT
  TO authenticated
  WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "Users can update medications for their patient" ON medications
  FOR UPDATE
  TO authenticated
  USING (patient_id = get_my_patient_id())
  WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "Users can delete medications for their patient" ON medications
  FOR DELETE
  TO authenticated
  USING (patient_id = get_my_patient_id());

-- Medication logs policies
CREATE POLICY "Users can view med logs for their patient" ON med_logs
  FOR SELECT
  TO authenticated
  USING (patient_id = get_my_patient_id());

CREATE POLICY "Users can insert med logs for their patient" ON med_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "Users can update med logs for their patient" ON med_logs
  FOR UPDATE
  TO authenticated
  USING (patient_id = get_my_patient_id())
  WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "Users can delete med logs for their patient" ON med_logs
  FOR DELETE
  TO authenticated
  USING (patient_id = get_my_patient_id());

-- Hydration logs policies
CREATE POLICY "Users can view hydration logs for their patient" ON hydration_logs
  FOR SELECT
  TO authenticated
  USING (patient_id = get_my_patient_id());

CREATE POLICY "Users can insert hydration logs for their patient" ON hydration_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "Users can update hydration logs for their patient" ON hydration_logs
  FOR UPDATE
  TO authenticated
  USING (patient_id = get_my_patient_id())
  WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "Users can delete hydration logs for their patient" ON hydration_logs
  FOR DELETE
  TO authenticated
  USING (patient_id = get_my_patient_id());

-- Juice logs policies
CREATE POLICY "Users can view juice logs for their patient" ON juice_logs
  FOR SELECT
  TO authenticated
  USING (patient_id = get_my_patient_id());

CREATE POLICY "Users can insert juice logs for their patient" ON juice_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "Users can update juice logs for their patient" ON juice_logs
  FOR UPDATE
  TO authenticated
  USING (patient_id = get_my_patient_id())
  WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "Users can delete juice logs for their patient" ON juice_logs
  FOR DELETE
  TO authenticated
  USING (patient_id = get_my_patient_id());

-- BM logs policies
CREATE POLICY "Users can view BM logs for their patient" ON bm_logs
  FOR SELECT
  TO authenticated
  USING (patient_id = get_my_patient_id());

CREATE POLICY "Users can insert BM logs for their patient" ON bm_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "Users can update BM logs for their patient" ON bm_logs
  FOR UPDATE
  TO authenticated
  USING (patient_id = get_my_patient_id())
  WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "Users can delete BM logs for their patient" ON bm_logs
  FOR DELETE
  TO authenticated
  USING (patient_id = get_my_patient_id());

-- Team settings policies
CREATE POLICY "Users can view team settings for their patient" ON team_settings
  FOR SELECT
  TO authenticated
  USING (patient_id = get_my_patient_id());

CREATE POLICY "Users can insert team settings for their patient" ON team_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "Users can update team settings for their patient" ON team_settings
  FOR UPDATE
  TO authenticated
  USING (patient_id = get_my_patient_id())
  WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "Users can delete team settings for their patient" ON team_settings
  FOR DELETE
  TO authenticated
  USING (patient_id = get_my_patient_id());

-- Messages policies
CREATE POLICY "Users can view messages for their patient" ON messages
  FOR SELECT
  TO authenticated
  USING (patient_id = get_my_patient_id());

CREATE POLICY "Users can insert messages for their patient" ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "Users can update messages for their patient" ON messages
  FOR UPDATE
  TO authenticated
  USING (patient_id = get_my_patient_id())
  WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "Users can delete messages for their patient" ON messages
  FOR DELETE
  TO authenticated
  USING (patient_id = get_my_patient_id());
