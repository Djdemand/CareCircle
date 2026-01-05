-- ============================================================================
-- ADD PATIENT SWITCHING FUNCTIONALITY
-- Allows a caregiver to belong to multiple patient circles
-- ============================================================================

-- Create a junction table for caregiver-patient relationships
CREATE TABLE IF NOT EXISTS caregiver_patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caregiver_id UUID NOT NULL REFERENCES caregivers(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(caregiver_id, patient_id)
);

-- Enable RLS
ALTER TABLE caregiver_patients ENABLE ROW LEVEL SECURITY;

--Allow caregivers to view their patient relationships
CREATE POLICY "Caregivers can view their patient relationships" ON caregiver_patients
  FOR SELECT
  TO authenticated
  USING (caregiver_id = auth.uid());

-- Allow caregivers to insert their own relationships
CREATE POLICY "Caregivers can create their patient relationships" ON caregiver_patients
  FOR INSERT
  TO authenticated
  WITH CHECK (caregiver_id = auth.uid());

-- Allow caregivers to delete their relationships  
CREATE POLICY "Caregivers can delete their patient relationships" ON caregiver_patients
  FOR DELETE
  TO authenticated
  USING (caregiver_id = auth.uid());

-- Migrate existing data: If caregivers have a patient_id, create the relationship
INSERT INTO caregiver_patients (caregiver_id, patient_id)
SELECT id, patient_id FROM caregivers
WHERE patient_id IS NOT NULL
ON CONFLICT (caregiver_id, patient_id) DO NOTHING;

-- Note: We keep the patient_id column in caregivers for backwards compatibility
-- and to store the "current" or "default" patient for each caregiver
