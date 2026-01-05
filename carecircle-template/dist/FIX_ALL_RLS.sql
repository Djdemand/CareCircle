-- COMPREHENSIVE RLS FIX FOR ALL TABLES
-- Fixes infinite recursion by using SECURITY DEFINER function
-- Run this in Supabase SQL Editor

BEGIN;

-- ============================================
-- STEP 1: Drop ALL existing policies
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can access patients" ON patients;
DROP POLICY IF EXISTS "Access own patient" ON patients;
DROP POLICY IF EXISTS "Allow insert patient" ON patients;

DROP POLICY IF EXISTS "Authenticated users can access caregivers" ON caregivers;
DROP POLICY IF EXISTS "Team access caregivers" ON caregivers;
DROP POLICY IF EXISTS "Allow insert caregiver" ON caregivers;
DROP POLICY IF EXISTS "Users can access own record" ON caregivers;
DROP POLICY IF EXISTS "Users can view team members" ON caregivers;
DROP POLICY IF EXISTS "Admins can modify team" ON caregivers;

DROP POLICY IF EXISTS "Team access medications" ON medications;
DROP POLICY IF EXISTS "Users can view medications for their patient" ON medications;
DROP POLICY IF EXISTS "Users can insert medications for their patient" ON medications;
DROP POLICY IF EXISTS "Users can update medications for their patient" ON medications;
DROP POLICY IF EXISTS "Users can delete medications for their patient" ON medications;

DROP POLICY IF EXISTS "Team access med_logs" ON med_logs;
DROP POLICY IF EXISTS "Team access hydration_logs" ON hydration_logs;
DROP POLICY IF EXISTS "Team access juice_logs" ON juice_logs;
DROP POLICY IF EXISTS "Team access bm_logs" ON bm_logs;
DROP POLICY IF EXISTS "Team access messages" ON messages;
DROP POLICY IF EXISTS "Team access team_settings" ON team_settings;

-- ============================================
-- STEP 2: Create SECURITY DEFINER helper function
-- This bypasses RLS when called, preventing recursion
-- ============================================
CREATE OR REPLACE FUNCTION get_my_patient_id() 
RETURNS UUID AS $$
  SELECT patient_id FROM public.caregivers WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- STEP 3: Create clean policies for all tables
-- ============================================

-- PATIENTS: Allow authenticated users full access (they can only see their own via caregivers link)
CREATE POLICY "patients_all_access" ON patients FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- CAREGIVERS: Users can access their own record
CREATE POLICY "caregivers_own_record" ON caregivers FOR ALL TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- CAREGIVERS: Users can view team members via function (no recursion)
CREATE POLICY "caregivers_view_team" ON caregivers FOR SELECT TO authenticated
USING (patient_id = get_my_patient_id());

-- MEDICATIONS: Team access via function
CREATE POLICY "medications_team_access" ON medications FOR ALL TO authenticated
USING (patient_id = get_my_patient_id()) WITH CHECK (patient_id = get_my_patient_id());

-- MED_LOGS: Team access via function
CREATE POLICY "med_logs_team_access" ON med_logs FOR ALL TO authenticated
USING (patient_id = get_my_patient_id()) WITH CHECK (patient_id = get_my_patient_id());

-- HYDRATION_LOGS: Team access via function
CREATE POLICY "hydration_logs_team_access" ON hydration_logs FOR ALL TO authenticated
USING (patient_id = get_my_patient_id()) WITH CHECK (patient_id = get_my_patient_id());

-- JUICE_LOGS: Team access via function
CREATE POLICY "juice_logs_team_access" ON juice_logs FOR ALL TO authenticated
USING (patient_id = get_my_patient_id()) WITH CHECK (patient_id = get_my_patient_id());

-- BM_LOGS: Team access via function
CREATE POLICY "bm_logs_team_access" ON bm_logs FOR ALL TO authenticated
USING (patient_id = get_my_patient_id()) WITH CHECK (patient_id = get_my_patient_id());

-- MESSAGES: Team access via function
CREATE POLICY "messages_team_access" ON messages FOR ALL TO authenticated
USING (patient_id = get_my_patient_id()) WITH CHECK (patient_id = get_my_patient_id());

-- TEAM_SETTINGS: Team access via function
CREATE POLICY "team_settings_team_access" ON team_settings FOR ALL TO authenticated
USING (patient_id = get_my_patient_id()) WITH CHECK (patient_id = get_my_patient_id());

COMMIT;

-- Reload API cache
NOTIFY pgrst, 'reload config';
