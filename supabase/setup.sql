-- CareCircle Database Schema
-- Last updated: 12/20/2025 11:58 PM

-- 1. Caregivers Table
CREATE TABLE caregivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Medications Table
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency_hours INTEGER NOT NULL, -- e.g. 8 for "Every 8 hours"
    duration_days INTEGER NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ, -- Calculated in app if needed
    instructions TEXT,
    created_by UUID REFERENCES caregivers(id)
);

-- 3. Medication Logs (Double-dose prevention logic)
CREATE TABLE med_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    med_id UUID REFERENCES medications(id) ON DELETE CASCADE,
    caregiver_id UUID REFERENCES caregivers(id),
    administered_at TIMESTAMPTZ DEFAULT NOW(),
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    notes TEXT,
    
    -- Ensure only one log exists for a specific medication within a time window
    CONSTRAINT unique_dose_window UNIQUE (med_id, window_start, window_end)
);

-- 4. Hydration Logs (USA Measurements)
CREATE TABLE hydration_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caregiver_id UUID REFERENCES caregivers(id),
    amount_oz INTEGER NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Row Level Security (RLS)
ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE med_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;

-- Simple policy: All logged in users can read and write (demo simplified)
CREATE POLICY "Team access" ON caregivers FOR ALL USING (true);
CREATE POLICY "Team access" ON medications FOR ALL USING (true);
CREATE POLICY "Team access" ON med_logs FOR ALL USING (true);
CREATE POLICY "Team access" ON hydration_logs FOR ALL USING (true);
