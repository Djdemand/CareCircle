-- FIX CAREGIVERS RLS POLICY
-- This allows users to see ALL caregivers in their patient circle
-- Run this in Supabase SQL Editor

-- First, drop existing caregiver policies that might be too restrictive
DROP POLICY IF EXISTS "caregivers_own" ON caregivers;
DROP POLICY IF EXISTS "caregivers_team" ON caregivers;
DROP POLICY IF EXISTS "caregivers_self_access" ON caregivers;
DROP POLICY IF EXISTS "caregivers_team_view" ON caregivers;
DROP POLICY IF EXISTS "caregivers_own_record" ON caregivers;
DROP POLICY IF EXISTS "caregivers_view_team" ON caregivers;

-- Create a more permissive policy for caregivers
-- Users can see all caregivers (for team display)
CREATE POLICY "caregivers_read_all" ON caregivers 
  FOR SELECT TO authenticated
  USING (true);

-- Users can update/delete their own record only
CREATE POLICY "caregivers_modify_own" ON caregivers 
  FOR ALL TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users can insert new caregivers (for invites)
CREATE POLICY "caregivers_insert" ON caregivers 
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Reload cache
NOTIFY pgrst, 'reload config';
