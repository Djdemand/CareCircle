-- FIX INFINITE RECURSION IN CAREGIVERS POLICY
-- Run this in Supabase SQL Editor

BEGIN;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Authenticated users can access caregivers" ON caregivers;
DROP POLICY IF EXISTS "Team access caregivers" ON caregivers;
DROP POLICY IF EXISTS "Allow insert caregiver" ON caregivers;

-- Create a SECURITY DEFINER function to safely get patient_id without triggering RLS
CREATE OR REPLACE FUNCTION get_my_patient_id() 
RETURNS UUID AS $$
  SELECT patient_id FROM public.caregivers WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Create simple, non-recursive policies for caregivers

-- Policy 1: Users can always see and modify their own caregiver record
CREATE POLICY "Users can access own record" 
ON caregivers 
FOR ALL 
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy 2: Users can see other caregivers in their patient circle (uses function to avoid recursion)
CREATE POLICY "Users can view team members" 
ON caregivers 
FOR SELECT 
TO authenticated
USING (patient_id = get_my_patient_id());

-- Policy 3: Admins can modify team members (also uses function)
CREATE POLICY "Admins can modify team" 
ON caregivers 
FOR ALL 
TO authenticated
USING (
  patient_id = get_my_patient_id() AND 
  EXISTS (SELECT 1 FROM caregivers WHERE id = auth.uid() AND is_admin = true)
);

COMMIT;

-- Reload cache
NOTIFY pgrst, 'reload config';
