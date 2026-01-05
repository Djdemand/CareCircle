-- Complete RLS and Schema Fix for Multi-tenancy
-- This script fixes the schema to match the code and implements proper RLS policies

BEGIN;

-- ============================================
-- STEP 1: UPDATE TABLE SCHEMAS TO MATCH CODE
-- ============================================

-- Update hydration_logs to match code expectations
ALTER TABLE hydration_logs 
  ADD COLUMN IF NOT EXISTS amount_ml INTEGER,
  ADD COLUMN IF NOT EXISTS logged_by UUID REFERENCES caregivers(id);

-- Migrate existing data from amount_oz to amount_ml (1 oz = 29.57 ml)
UPDATE hydration_logs 
SET amount_ml = ROUND(amount_oz * 29.57) 
WHERE amount_ml IS NULL AND amount_oz IS NOT NULL;

-- Migrate existing data from caregiver_id to logged_by
UPDATE hydration_logs 
SET logged_by = caregiver_id 
WHERE logged_by IS NULL AND caregiver_id IS NOT NULL;

-- Make amount_ml NOT NULL after migration
ALTER TABLE hydration_logs 
  ALTER COLUMN amount_ml SET NOT NULL;

-- Update juice_logs similarly
ALTER TABLE juice_logs 
  ADD COLUMN IF NOT EXISTS amount_ml INTEGER,
  ADD COLUMN IF NOT EXISTS logged_by UUID REFERENCES caregivers(id);

UPDATE juice_logs 
SET amount_ml = ROUND(amount_oz * 29.57) 
WHERE amount_ml IS NULL AND amount_oz IS NOT NULL;

UPDATE juice_logs 
SET logged_by = caregiver_id 
WHERE logged_by IS NULL AND caregiver_id IS NOT NULL;

ALTER TABLE juice_logs 
  ALTER COLUMN amount_ml SET NOT NULL;

-- ============================================
-- STEP 2: ENSURE patient_id EXISTS ON ALL TABLES
-- ============================================

-- Add patient_id to tables if not exists
ALTER TABLE caregivers ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id);
ALTER TABLE medications ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id);
ALTER TABLE med_logs ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id);
ALTER TABLE hydration_logs ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id);
ALTER TABLE juice_logs ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id);
ALTER TABLE bm_logs ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id);
ALTER TABLE team_settings ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id);

-- Make patient_id NOT NULL for tables that should have it (except team_settings which will be updated)
ALTER TABLE medications ALTER COLUMN patient_id SET NOT NULL;
ALTER TABLE med_logs ALTER COLUMN patient_id SET NOT NULL;
ALTER TABLE hydration_logs ALTER COLUMN patient_id SET NOT NULL;
ALTER TABLE juice_logs ALTER COLUMN patient_id SET NOT NULL;
ALTER TABLE bm_logs ALTER COLUMN patient_id SET NOT NULL;
ALTER TABLE messages ALTER COLUMN patient_id SET NOT NULL;

-- ============================================
-- STEP 3: BACKFILL patient_id FOR EXISTING DATA
-- ============================================

-- Create default patient if none exists
INSERT INTO patients (name)
SELECT 'Default Patient'
WHERE NOT EXISTS (SELECT 1 FROM patients);

-- Backfill patient_id for caregivers
UPDATE caregivers
SET patient_id = (SELECT id FROM patients LIMIT 1)
WHERE patient_id IS NULL;

-- Backfill patient_id for medications
UPDATE medications m
SET patient_id = c.patient_id
FROM caregivers c
WHERE m.created_by = c.id AND m.patient_id IS NULL;

-- Backfill patient_id for med_logs
UPDATE med_logs l
SET patient_id = c.patient_id
FROM caregivers c
WHERE l.caregiver_id = c.id AND l.patient_id IS NULL;

-- Backfill patient_id for hydration_logs
UPDATE hydration_logs l
SET patient_id = c.patient_id
FROM caregivers c
WHERE l.caregiver_id = c.id AND l.patient_id IS NULL;

-- Backfill patient_id for juice_logs
UPDATE juice_logs l
SET patient_id = c.patient_id
FROM caregivers c
WHERE l.caregiver_id = c.id AND l.patient_id IS NULL;

-- Backfill patient_id for bm_logs
UPDATE bm_logs l
SET patient_id = c.patient_id
FROM caregivers c
WHERE l.caregiver_id = c.id AND l.patient_id IS NULL;

-- Backfill patient_id for messages
UPDATE messages m
SET patient_id = c.patient_id
FROM caregivers c
WHERE m.sender_id = c.id AND m.patient_id IS NULL;

-- Backfill patient_id for team_settings
UPDATE team_settings
SET patient_id = (SELECT id FROM patients LIMIT 1)
WHERE patient_id IS NULL;

-- ============================================
-- STEP 4: CREATE HELPER FUNCTIONS
-- ============================================

-- Helper Function for RLS - Returns the patient_id for the authenticated user
CREATE OR REPLACE FUNCTION get_my_patient_id() RETURNS UUID AS $$
    SELECT patient_id FROM caregivers WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- STEP 5: DROP EXISTING POLICIES
-- ============================================
DROP POLICY IF EXISTS "Access own patient" ON patients;
DROP POLICY IF EXISTS "Allow insert patient" ON patients;
DROP POLICY IF EXISTS "Team access caregivers" ON caregivers;
DROP POLICY IF EXISTS "Allow insert caregiver" ON caregivers;
DROP POLICY IF EXISTS "Team access medications" ON medications;
DROP POLICY IF EXISTS "Team access med_logs" ON med_logs;
DROP POLICY IF EXISTS "Team access hydration_logs" ON hydration_logs;
DROP POLICY IF EXISTS "Team access juice_logs" ON juice_logs;
DROP POLICY IF EXISTS "Team access bm_logs" ON bm_logs;
DROP POLICY IF EXISTS "Team access team_settings" ON team_settings;
DROP POLICY IF EXISTS "Team access messages" ON messages;

-- ============================================
-- STEP 6: CREATE NEW RLS POLICIES
-- ============================================

-- 1. PATIENTS TABLE
CREATE POLICY "Patients: Select own patient" 
ON patients FOR SELECT 
USING (id = get_my_patient_id());

CREATE POLICY "Patients: Insert new patient" 
ON patients FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Patients: Update own patient" 
ON patients FOR UPDATE 
USING (id = get_my_patient_id())
WITH CHECK (id = get_my_patient_id());

-- 2. CAREGIVERS TABLE
CREATE POLICY "Caregivers: Select own circle" 
ON caregivers FOR SELECT 
USING (patient_id = get_my_patient_id());

CREATE POLICY "Caregivers: Insert to own circle" 
ON caregivers FOR INSERT 
TO authenticated 
WITH CHECK (
    patient_id = get_my_patient_id() OR 
    (auth.uid() = id AND patient_id IS NOT NULL)
);

CREATE POLICY "Caregivers: Update own circle" 
ON caregivers FOR UPDATE 
USING (patient_id = get_my_patient_id())
WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "Caregivers: Delete from own circle" 
ON caregivers FOR DELETE 
USING (patient_id = get_my_patient_id() AND id != auth.uid());

-- 3. MEDICATIONS TABLE
CREATE POLICY "Medications: Select own patient" 
ON medications FOR SELECT 
USING (patient_id = get_my_patient_id());

CREATE POLICY "Medications: Insert for own patient" 
ON medications FOR INSERT 
TO authenticated 
WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "Medications: Update own patient" 
ON medications FOR UPDATE 
USING (patient_id = get_my_patient_id())
WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "Medications: Delete own patient" 
ON medications FOR DELETE 
USING (patient_id = get_my_patient_id());

-- 4. MEDICATION LOGS TABLE
CREATE POLICY "Med Logs: Select own patient" 
ON med_logs FOR SELECT 
USING (patient_id = get_my_patient_id());

CREATE POLICY "Med Logs: Insert for own patient" 
ON med_logs FOR INSERT 
TO authenticated 
WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "Med Logs: Update own patient" 
ON med_logs FOR UPDATE 
USING (patient_id = get_my_patient_id())
WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "Med Logs: Delete own patient" 
ON med_logs FOR DELETE 
USING (patient_id = get_my_patient_id());

-- 5. HYDRATION LOGS TABLE
CREATE POLICY "Hydration Logs: Select own patient" 
ON hydration_logs FOR SELECT 
USING (patient_id = get_my_patient_id());

CREATE POLICY "Hydration Logs: Insert for own patient" 
ON hydration_logs FOR INSERT 
TO authenticated 
WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "Hydration Logs: Update own patient" 
ON hydration_logs FOR UPDATE 
USING (patient_id = get_my_patient_id())
WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "Hydration Logs: Delete own patient" 
ON hydration_logs FOR DELETE 
USING (patient_id = get_my_patient_id());

-- 6. JUICE LOGS TABLE
CREATE POLICY "Juice Logs: Select own patient" 
ON juice_logs FOR SELECT 
USING (patient_id = get_my_patient_id());

CREATE POLICY "Juice Logs: Insert for own patient" 
ON juice_logs FOR INSERT 
TO authenticated 
WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "Juice Logs: Update own patient" 
ON juice_logs FOR UPDATE 
USING (patient_id = get_my_patient_id())
WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "Juice Logs: Delete own patient" 
ON juice_logs FOR DELETE 
USING (patient_id = get_my_patient_id());

-- 7. BM LOGS TABLE
CREATE POLICY "BM Logs: Select own patient" 
ON bm_logs FOR SELECT 
USING (patient_id = get_my_patient_id());

CREATE POLICY "BM Logs: Insert for own patient" 
ON bm_logs FOR INSERT 
TO authenticated 
WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "BM Logs: Update own patient" 
ON bm_logs FOR UPDATE 
USING (patient_id = get_my_patient_id())
WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "BM Logs: Delete own patient" 
ON bm_logs FOR DELETE 
USING (patient_id = get_my_patient_id());

-- 8. TEAM SETTINGS TABLE
CREATE POLICY "Team Settings: Select own patient" 
ON team_settings FOR SELECT 
USING (patient_id = get_my_patient_id());

CREATE POLICY "Team Settings: Insert for own patient" 
ON team_settings FOR INSERT 
TO authenticated 
WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "Team Settings: Update own patient" 
ON team_settings FOR UPDATE 
USING (patient_id = get_my_patient_id())
WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "Team Settings: Delete own patient" 
ON team_settings FOR DELETE 
USING (patient_id = get_my_patient_id());

-- 9. MESSAGES TABLE
CREATE POLICY "Messages: Select own patient" 
ON messages FOR SELECT 
USING (patient_id = get_my_patient_id());

CREATE POLICY "Messages: Insert for own patient" 
ON messages FOR INSERT 
TO authenticated 
WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "Messages: Update own patient" 
ON messages FOR UPDATE 
USING (patient_id = get_my_patient_id())
WITH CHECK (patient_id = get_my_patient_id());

CREATE POLICY "Messages: Delete own patient" 
ON messages FOR DELETE 
USING (patient_id = get_my_patient_id());

COMMIT;

-- Verification
DO $$
BEGIN
    RAISE NOTICE 'Schema and RLS policies updated successfully!';
    RAISE NOTICE 'Tables now support: patient_id, amount_ml, logged_by';
    RAISE NOTICE 'RLS policies allow INSERT operations with proper patient_id';
END $$;
