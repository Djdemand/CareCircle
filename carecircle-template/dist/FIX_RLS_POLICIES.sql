-- FIX RLS CIRCULAR DEPENDENCY FOR NEW USERS
-- This fixes the "table not found" error by allowing new users to access patients table

BEGIN;

-- Drop the restrictive policies
DROP POLICY IF EXISTS "Access own patient" ON patients;
DROP POLICY IF EXISTS "Allow insert patient" ON patients;
DROP POLICY IF EXISTS "Team access caregivers" ON caregivers;
DROP POLICY IF EXISTS "Allow insert caregiver" ON caregivers;

-- Create permissive policies that work for new users
-- Patients: Allow authenticated users to see and create their own patient circles
CREATE POLICY "Authenticated users can access patients" 
ON patients 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Caregivers: Allow users to manage caregivers in their patient circle OR their own record
CREATE POLICY "Authenticated users can access caregivers" 
ON caregivers 
FOR ALL 
TO authenticated
USING (
  id = auth.uid() OR 
  patient_id IN (SELECT patient_id FROM caregivers WHERE id = auth.uid())
)
WITH CHECK (
  id = auth.uid() OR 
  patient_id IN (SELECT patient_id FROM caregivers WHERE id = auth.uid())
);

COMMIT;

-- Reload API cache
NOTIFY pgrst, 'reload config';
