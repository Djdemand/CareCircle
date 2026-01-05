-- ============================================================================
-- COMPREHENSIVE RLS POLICY FIX FOR ALL TABLES
-- This script disables RLS temporarily and creates proper multitenancy policies
-- ============================================================================

-- Step 1: Disable RLS on all tables to allow operations
ALTER TABLE medications DISABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE bm_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE juice_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE global_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE care_circles DISABLE ROW LEVEL SECURITY;
ALTER TABLE care_circle_members DISABLE ROW LEVEL SECURITY;

-- Step 2: Enable RLS back on all tables
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bm_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE juice_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_circle_members ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own medications" ON medications;
DROP POLICY IF EXISTS "Users can insert their own medications" ON medications;
DROP POLICY IF EXISTS "Users can update their own medications" ON medications;
DROP POLICY IF EXISTS "Users can delete their own medications" ON medications;
DROP POLICY IF EXISTS "Users can view their own medication logs" ON medication_logs;
DROP POLICY IF EXISTS "Users can insert their own medication logs" ON medication_logs;
DROP POLICY IF EXISTS "Users can update their own medication logs" ON medication_logs;
DROP POLICY IF EXISTS "Users can delete their own medication logs" ON medication_logs;
DROP POLICY IF EXISTS "Users can view their own hydration logs" ON hydration_logs;
DROP POLICY IF EXISTS "Users can insert their own hydration logs" ON hydration_logs;
DROP POLICY IF EXISTS "Users can update their own hydration logs" ON hydration_logs;
DROP POLICY IF EXISTS "Users can delete their own hydration logs" ON hydration_logs;
DROP POLICY IF EXISTS "Users can view their own BM logs" ON bm_logs;
DROP POLICY IF EXISTS "Users can insert their own BM logs" ON bm_logs;
DROP POLICY IF EXISTS "Users can update their own BM logs" ON bm_logs;
DROP POLICY IF EXISTS "Users can delete their own BM logs" ON bm_logs;
DROP POLICY IF EXISTS "Users can view their own juice logs" ON juice_logs;
DROP POLICY IF EXISTS "Users can insert their own juice logs" ON juice_logs;
DROP POLICY IF EXISTS "Users can update their own juice logs" ON juice_logs;
DROP POLICY IF EXISTS "Users can delete their own juice logs" ON juice_logs;
DROP POLICY IF EXISTS "Users can view their own global settings" ON global_settings;
DROP POLICY IF EXISTS "Users can insert their own global settings" ON global_settings;
DROP POLICY IF EXISTS "Users can update their own global settings" ON global_settings;
DROP POLICY IF EXISTS "Users can delete their own global settings" ON global_settings;
DROP POLICY IF EXISTS "Users can view their own care circles" ON care_circles;
DROP POLICY IF EXISTS "Users can insert their own care circles" ON care_circles;
DROP POLICY IF EXISTS "Users can update their own care circles" ON care_circles;
DROP POLICY IF EXISTS "Users can delete their own care circles" ON care_circles;
DROP POLICY IF EXISTS "Users can view their own care circle members" ON care_circle_members;
DROP POLICY IF EXISTS "Users can insert their own care circle members" ON care_circle_members;
DROP POLICY IF EXISTS "Users can update their own care circle members" ON care_circle_members;
DROP POLICY IF EXISTS "Users can delete their own care circle members" ON care_circle_members;

-- Step 4: Create permissive policies that allow authenticated users to manage their data
-- These policies check both user_id and care_circle_id for proper multitenancy

-- Medications policies
CREATE POLICY "Users can view medications they have access to" ON medications
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own medications" ON medications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update medications they have access to" ON medications
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete medications they have access to" ON medications
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

-- Medication logs policies
CREATE POLICY "Users can view medication logs they have access to" ON medication_logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own medication logs" ON medication_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update medication logs they have access to" ON medication_logs
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete medication logs they have access to" ON medication_logs
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

-- Hydration logs policies
CREATE POLICY "Users can view hydration logs they have access to" ON hydration_logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own hydration logs" ON hydration_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update hydration logs they have access to" ON hydration_logs
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete hydration logs they have access to" ON hydration_logs
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

-- BM logs policies
CREATE POLICY "Users can view BM logs they have access to" ON bm_logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own BM logs" ON bm_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update BM logs they have access to" ON bm_logs
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete BM logs they have access to" ON bm_logs
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

-- Juice logs policies
CREATE POLICY "Users can view juice logs they have access to" ON juice_logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own juice logs" ON juice_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update juice logs they have access to" ON juice_logs
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete juice logs they have access to" ON juice_logs
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

-- Global settings policies
CREATE POLICY "Users can view global settings they have access to" ON global_settings
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own global settings" ON global_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update global settings they have access to" ON global_settings
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete global settings they have access to" ON global_settings
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

-- Care circles policies
CREATE POLICY "Users can view care circles they belong to" ON care_circles
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own care circles" ON care_circles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
  );

CREATE POLICY "Users can update care circles they created" ON care_circles
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
  )
  WITH CHECK (
    created_by = auth.uid()
  );

CREATE POLICY "Users can delete care circles they created" ON care_circles
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
  );

-- Care circle members policies
CREATE POLICY "Users can view care circle members" ON care_circle_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert care circle members" ON care_circle_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update care circle members" ON care_circle_members
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete care circle members" ON care_circle_members
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    care_circle_id IN (
      SELECT care_circle_id FROM care_circle_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these to verify the policies are working correctly
-- ============================================================================

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'medications',
    'medication_logs',
    'hydration_logs',
    'bm_logs',
    'juice_logs',
    'global_settings',
    'care_circles',
    'care_circle_members'
  )
ORDER BY tablename;

-- Check policies on each table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
