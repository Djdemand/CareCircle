-- ============================================================================
-- MANY-TO-MANY RELATIONSHIP: CAREGIVERS <-> PATIENTS
-- Run this in Supabase SQL Editor
-- ============================================================================

BEGIN;

-- 1. Create the junction table for caregiver-patient relationships
CREATE TABLE IF NOT EXISTS caregiver_patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caregiver_id UUID REFERENCES caregivers(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Each caregiver can only be linked to a patient once
    UNIQUE(caregiver_id, patient_id)
);

-- 2. Enable RLS on the junction table
ALTER TABLE caregiver_patients ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for the junction table
CREATE POLICY "caregiver_patients_read" ON caregiver_patients 
  FOR SELECT TO authenticated
  USING (caregiver_id = auth.uid());

CREATE POLICY "caregiver_patients_insert" ON caregiver_patients 
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "caregiver_patients_update" ON caregiver_patients 
  FOR UPDATE TO authenticated
  USING (caregiver_id = auth.uid());

-- 4. Migrate existing data: Copy current patient_id relationships to junction table
INSERT INTO caregiver_patients (caregiver_id, patient_id, is_admin)
SELECT id, patient_id, is_admin 
FROM caregivers 
WHERE patient_id IS NOT NULL
ON CONFLICT (caregiver_id, patient_id) DO NOTHING;

-- 5. Add message columns if they don't exist
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'message';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_id UUID;

-- 6. Grant permissions
GRANT ALL ON caregiver_patients TO authenticated;
GRANT ALL ON caregiver_patients TO anon;

COMMIT;

-- Reload cache
NOTIFY pgrst, 'reload config';

-- Verification
DO $$
BEGIN
    RAISE NOTICE 'Many-to-many relationship created successfully!';
    RAISE NOTICE 'Existing caregiver-patient assignments have been migrated.';
END $$;
