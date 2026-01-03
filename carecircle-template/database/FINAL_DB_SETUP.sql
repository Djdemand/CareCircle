-- CareCircle Database Setup Script (Consolidated & Multi-tenant)
-- Run this script in the Supabase SQL Editor to initialize your database.

BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Patients Table (Tenant Root)
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Caregivers Table
CREATE TABLE IF NOT EXISTS caregivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    first_login BOOLEAN DEFAULT TRUE,
    login_count INTEGER DEFAULT 0,
    hydration_goal INTEGER DEFAULT 128,
    juice_goal INTEGER DEFAULT 0
);

-- 3. Medications Table
CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) NOT NULL,
    name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency_hours INTEGER NOT NULL, -- e.g. 8 for "Every 8 hours", 0 for "As Needed"
    duration_days INTEGER NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    instructions TEXT,
    created_by UUID REFERENCES caregivers(id),
    is_mandatory BOOLEAN DEFAULT FALSE,
    position INTEGER DEFAULT 0
);

-- 4. Medication Logs
CREATE TABLE IF NOT EXISTS med_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) NOT NULL,
    med_id UUID REFERENCES medications(id) ON DELETE CASCADE,
    caregiver_id UUID REFERENCES caregivers(id),
    administered_at TIMESTAMPTZ DEFAULT NOW(),
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    notes TEXT,
    
    -- Ensure only one log exists for a specific medication within a time window
    CONSTRAINT unique_dose_window UNIQUE (med_id, window_start, window_end)
);

-- 5. Hydration Logs
CREATE TABLE IF NOT EXISTS hydration_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) NOT NULL,
    caregiver_id UUID REFERENCES caregivers(id),
    amount_oz INTEGER NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Juice Logs
CREATE TABLE IF NOT EXISTS juice_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) NOT NULL,
    caregiver_id UUID REFERENCES caregivers(id),
    amount_oz INTEGER NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BM Logs
CREATE TABLE IF NOT EXISTS bm_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) NOT NULL,
    caregiver_id UUID REFERENCES caregivers(id),
    had_bm BOOLEAN NOT NULL,
    notes TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Team Settings
CREATE TABLE IF NOT EXISTS team_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) NOT NULL,
    hydration_goal INTEGER DEFAULT 128,
    juice_goal INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) NOT NULL,
    sender_id UUID REFERENCES caregivers(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper Function for RLS
CREATE OR REPLACE FUNCTION get_my_patient_id() RETURNS UUID AS $$
    SELECT patient_id FROM caregivers WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Enable Row Level Security (RLS)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE med_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE juice_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bm_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (Strict Tenant Isolation)

-- Patients
DROP POLICY IF EXISTS "Access own patient" ON patients;
CREATE POLICY "Access own patient" ON patients FOR ALL USING (id = get_my_patient_id());
CREATE POLICY "Allow insert patient" ON patients FOR INSERT TO authenticated WITH CHECK (true);

-- Caregivers
DROP POLICY IF EXISTS "Team access caregivers" ON caregivers;
CREATE POLICY "Team access caregivers" ON caregivers FOR ALL USING (patient_id = get_my_patient_id());
CREATE POLICY "Allow insert caregiver" ON caregivers FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

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

-- Verification
DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully with multi-tenancy support.';
END $$;
