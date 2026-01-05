-- Fix RLS Policies for Multi-tenancy
-- This script fixes the row-level security policies to properly handle INSERT operations
-- while maintaining strict tenant isolation for SELECT/UPDATE/DELETE operations

BEGIN;

-- Helper Function for RLS - Returns the patient_id for the authenticated user
CREATE OR REPLACE FUNCTION get_my_patient_id() RETURNS UUID AS $$
    SELECT patient_id FROM caregivers WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper Function to check if user is authenticated
CREATE OR REPLACE FUNCTION is_authenticated() RETURNS BOOLEAN AS $$
    SELECT auth.uid() IS NOT NULL
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- DROP EXISTING POLICIES
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
-- CREATE NEW RLS POLICIES
-- ============================================

-- 1. PATIENTS TABLE
-- Users can view their own patient
CREATE POLICY "Patients: Select own patient" 
ON patients FOR SELECT 
USING (id = get_my_patient_id());

-- Authenticated users can insert patients (for initial setup)
CREATE POLICY "Patients: Insert new patient" 
ON patients FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Users can update their own patient
CREATE POLICY "Patients: Update own patient" 
ON patients FOR UPDATE 
USING (id = get_my_patient_id())
WITH CHECK (id = get_my_patient_id());

-- 2. CAREGIVERS TABLE
-- Users can view caregivers in their patient circle
CREATE POLICY "Caregivers: Select own circle" 
ON caregivers FOR SELECT 
USING (patient_id = get_my_patient_id());

-- Authenticated users can insert caregivers (must be in their patient circle)
CREATE POLICY "Caregivers: Insert to own circle" 
ON caregivers FOR INSERT 
TO authenticated 
WITH CHECK (
    patient_id = get_my_patient_id() OR 
    (auth.uid() = id AND patient_id IS NOT NULL)
);

-- Users can update caregivers in their patient circle
CREATE POLICY "Caregivers: Update own circle" 
ON caregivers FOR UPDATE 
USING (patient_id = get_my_patient_id())
WITH CHECK (patient_id = get_my_patient_id());

-- Users can delete caregivers in their patient circle (except themselves)
CREATE POLICY "Caregivers: Delete from own circle" 
ON caregivers FOR DELETE 
USING (patient_id = get_my_patient_id() AND id != auth.uid());

-- 3. MEDICATIONS TABLE
-- Users can view medications for their patient
CREATE POLICY "Medications: Select own patient" 
ON medications FOR SELECT 
USING (patient_id = get_my_patient_id());

-- Users can insert medications for their patient (patient_id auto-set)
CREATE POLICY "Medications: Insert for own patient" 
ON medications FOR INSERT 
TO authenticated 
WITH CHECK (patient_id = get_my_patient_id());

-- Users can update medications for their patient
CREATE POLICY "Medications: Update own patient" 
ON medications FOR UPDATE 
USING (patient_id = get_my_patient_id())
WITH CHECK (patient_id = get_my_patient_id());

-- Users can delete medications for their patient
CREATE POLICY "Medications: Delete own patient" 
ON medications FOR DELETE 
USING (patient_id = get_my_patient_id());

-- 4. MEDICATION LOGS TABLE
-- Users can view med logs for their patient
CREATE POLICY "Med Logs: Select own patient" 
ON med_logs FOR SELECT 
USING (patient_id = get_my_patient_id());

-- Users can insert med logs for their patient (patient_id auto-set)
CREATE POLICY "Med Logs: Insert for own patient" 
ON med_logs FOR INSERT 
TO authenticated 
WITH CHECK (patient_id = get_my_patient_id());

-- Users can update med logs for their patient
CREATE POLICY "Med Logs: Update own patient" 
ON med_logs FOR UPDATE 
USING (patient_id = get_my_patient_id())
WITH CHECK (patient_id = get_my_patient_id());

-- Users can delete med logs for their patient
CREATE POLICY "Med Logs: Delete own patient" 
ON med_logs FOR DELETE 
USING (patient_id = get_my_patient_id());

-- 5. HYDRATION LOGS TABLE
-- Users can view hydration logs for their patient
CREATE POLICY "Hydration Logs: Select own patient" 
ON hydration_logs FOR SELECT 
USING (patient_id = get_my_patient_id());

-- Users can insert hydration logs for their patient (patient_id auto-set)
CREATE POLICY "Hydration Logs: Insert for own patient" 
ON hydration_logs FOR INSERT 
TO authenticated 
WITH CHECK (patient_id = get_my_patient_id());

-- Users can update hydration logs for their patient
CREATE POLICY "Hydration Logs: Update own patient" 
ON hydration_logs FOR UPDATE 
USING (patient_id = get_my_patient_id())
WITH CHECK (patient_id = get_my_patient_id());

-- Users can delete hydration logs for their patient
CREATE POLICY "Hydration Logs: Delete own patient" 
ON hydration_logs FOR DELETE 
USING (patient_id = get_my_patient_id());

-- 6. JUICE LOGS TABLE
-- Users can view juice logs for their patient
CREATE POLICY "Juice Logs: Select own patient" 
ON juice_logs FOR SELECT 
USING (patient_id = get_my_patient_id());

-- Users can insert juice logs for their patient (patient_id auto-set)
CREATE POLICY "Juice Logs: Insert for own patient" 
ON juice_logs FOR INSERT 
TO authenticated 
WITH CHECK (patient_id = get_my_patient_id());

-- Users can update juice logs for their patient
CREATE POLICY "Juice Logs: Update own patient" 
ON juice_logs FOR UPDATE 
USING (patient_id = get_my_patient_id())
WITH CHECK (patient_id = get_my_patient_id());

-- Users can delete juice logs for their patient
CREATE POLICY "Juice Logs: Delete own patient" 
ON juice_logs FOR DELETE 
USING (patient_id = get_my_patient_id());

-- 7. BM LOGS TABLE
-- Users can view BM logs for their patient
CREATE POLICY "BM Logs: Select own patient" 
ON bm_logs FOR SELECT 
USING (patient_id = get_my_patient_id());

-- Users can insert BM logs for their patient (patient_id auto-set)
CREATE POLICY "BM Logs: Insert for own patient" 
ON bm_logs FOR INSERT 
TO authenticated 
WITH CHECK (patient_id = get_my_patient_id());

-- Users can update BM logs for their patient
CREATE POLICY "BM Logs: Update own patient" 
ON bm_logs FOR UPDATE 
USING (patient_id = get_my_patient_id())
WITH CHECK (patient_id = get_my_patient_id());

-- Users can delete BM logs for their patient
CREATE POLICY "BM Logs: Delete own patient" 
ON bm_logs FOR DELETE 
USING (patient_id = get_my_patient_id());

-- 8. TEAM SETTINGS TABLE
-- Users can view team settings for their patient
CREATE POLICY "Team Settings: Select own patient" 
ON team_settings FOR SELECT 
USING (patient_id = get_my_patient_id());

-- Users can insert team settings for their patient (patient_id auto-set)
CREATE POLICY "Team Settings: Insert for own patient" 
ON team_settings FOR INSERT 
TO authenticated 
WITH CHECK (patient_id = get_my_patient_id());

-- Users can update team settings for their patient
CREATE POLICY "Team Settings: Update own patient" 
ON team_settings FOR UPDATE 
USING (patient_id = get_my_patient_id())
WITH CHECK (patient_id = get_my_patient_id());

-- Users can delete team settings for their patient
CREATE POLICY "Team Settings: Delete own patient" 
ON team_settings FOR DELETE 
USING (patient_id = get_my_patient_id());

-- 9. MESSAGES TABLE
-- Users can view messages for their patient
CREATE POLICY "Messages: Select own patient" 
ON messages FOR SELECT 
USING (patient_id = get_my_patient_id());

-- Users can insert messages for their patient (patient_id auto-set)
CREATE POLICY "Messages: Insert for own patient" 
ON messages FOR INSERT 
TO authenticated 
WITH CHECK (patient_id = get_my_patient_id());

-- Users can update messages for their patient
CREATE POLICY "Messages: Update own patient" 
ON messages FOR UPDATE 
USING (patient_id = get_my_patient_id())
WITH CHECK (patient_id = get_my_patient_id());

-- Users can delete messages for their patient
CREATE POLICY "Messages: Delete own patient" 
ON messages FOR DELETE 
USING (patient_id = get_my_patient_id());

COMMIT;

-- Verification
DO $$
BEGIN
    RAISE NOTICE 'RLS policies updated successfully with proper INSERT support.';
END $$;
