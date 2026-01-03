-- Migration: Add Multi-tenancy (Patients Table and Isolation)
-- Date: 2026-01-03

BEGIN;

-- 1. Create Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add patient_id to Caregivers
ALTER TABLE caregivers ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id);

-- 3. Create a default patient for existing data (Migration Step)
DO $$
DECLARE
    default_patient_id UUID;
BEGIN
    -- Only insert if there are caregivers without a patient_id
    IF EXISTS (SELECT 1 FROM caregivers WHERE patient_id IS NULL) THEN
        INSERT INTO patients (name) VALUES ('Default Patient') RETURNING id INTO default_patient_id;
        
        UPDATE caregivers SET patient_id = default_patient_id WHERE patient_id IS NULL;
    END IF;
END $$;

-- 4. Add patient_id to other tables
ALTER TABLE medications ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id);
ALTER TABLE med_logs ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id);
ALTER TABLE hydration_logs ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id);
ALTER TABLE juice_logs ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id);
ALTER TABLE bm_logs ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id);
ALTER TABLE team_settings ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id);

-- 5. Backfill patient_id for other tables based on caregiver linkage
UPDATE medications m
SET patient_id = c.patient_id
FROM caregivers c
WHERE m.created_by = c.id AND m.patient_id IS NULL;

UPDATE med_logs l
SET patient_id = c.patient_id
FROM caregivers c
WHERE l.caregiver_id = c.id AND l.patient_id IS NULL;

UPDATE hydration_logs l
SET patient_id = c.patient_id
FROM caregivers c
WHERE l.caregiver_id = c.id AND l.patient_id IS NULL;

UPDATE juice_logs l
SET patient_id = c.patient_id
FROM caregivers c
WHERE l.caregiver_id = c.id AND l.patient_id IS NULL;

UPDATE bm_logs l
SET patient_id = c.patient_id
FROM caregivers c
WHERE l.caregiver_id = c.id AND l.patient_id IS NULL;

UPDATE messages m
SET patient_id = c.patient_id
FROM caregivers c
WHERE m.sender_id = c.id AND m.patient_id IS NULL;

-- For team_settings, we might have issues linking if there's no caregiver link. 
-- Assuming 1 team_settings row per "team" (which was global before).
-- We'll assign it to the default patient if it exists, or just leave it for now as it will be recreated per patient.
UPDATE team_settings SET patient_id = (SELECT id FROM patients LIMIT 1) WHERE patient_id IS NULL;


-- 6. Helper Function for RLS
CREATE OR REPLACE FUNCTION get_my_patient_id() RETURNS UUID AS $$
    SELECT patient_id FROM caregivers WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- 7. Enable RLS on Patients
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- 8. Update RLS Policies

-- Patients: Users can view their own patient
DROP POLICY IF EXISTS "Access own patient" ON patients;
CREATE POLICY "Access own patient" ON patients FOR ALL USING (id = get_my_patient_id());

-- Caregivers: Users can view caregivers in their patient circle
DROP POLICY IF EXISTS "Team access caregivers" ON caregivers;
CREATE POLICY "Team access caregivers" ON caregivers FOR ALL USING (patient_id = get_my_patient_id());

-- Medications
DROP POLICY IF EXISTS "Team access medications" ON medications;
CREATE POLICY "Team access medications" ON medications FOR ALL USING (patient_id = get_my_patient_id());

-- Med Logs
DROP POLICY IF EXISTS "Team access med_logs" ON med_logs;
CREATE POLICY "Team access med_logs" ON med_logs FOR ALL USING (patient_id = get_my_patient_id());

-- Hydration Logs
DROP POLICY IF EXISTS "Team access hydration_logs" ON hydration_logs;
CREATE POLICY "Team access hydration_logs" ON hydration_logs FOR ALL USING (patient_id = get_my_patient_id());

-- Juice Logs
DROP POLICY IF EXISTS "Team access juice_logs" ON juice_logs;
CREATE POLICY "Team access juice_logs" ON juice_logs FOR ALL USING (patient_id = get_my_patient_id());

-- BM Logs
DROP POLICY IF EXISTS "Team access bm_logs" ON bm_logs;
CREATE POLICY "Team access bm_logs" ON bm_logs FOR ALL USING (patient_id = get_my_patient_id());

-- Team Settings
DROP POLICY IF EXISTS "Team access team_settings" ON team_settings;
CREATE POLICY "Team access team_settings" ON team_settings FOR ALL USING (patient_id = get_my_patient_id());

-- Messages
DROP POLICY IF EXISTS "Team access messages" ON messages;
CREATE POLICY "Team access messages" ON messages FOR ALL USING (patient_id = get_my_patient_id());

COMMIT;
