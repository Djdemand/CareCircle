-- CareCircle Database Schema
-- Generated for Template Distribution

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Caregivers Table
CREATE TABLE IF NOT EXISTS caregivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    first_login BOOLEAN DEFAULT TRUE,
    login_count INTEGER DEFAULT 0,
    hydration_goal INTEGER DEFAULT 128,
    juice_goal INTEGER DEFAULT 0
);

-- 2. Medications Table
CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 3. Medication Logs
CREATE TABLE IF NOT EXISTS med_logs (
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

-- 4. Hydration Logs
CREATE TABLE IF NOT EXISTS hydration_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caregiver_id UUID REFERENCES caregivers(id),
    amount_oz INTEGER NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Juice Logs
CREATE TABLE IF NOT EXISTS juice_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caregiver_id UUID REFERENCES caregivers(id),
    amount_oz INTEGER NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BM Logs
CREATE TABLE IF NOT EXISTS bm_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caregiver_id UUID REFERENCES caregivers(id),
    had_bm BOOLEAN NOT NULL,
    notes TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Team Settings
CREATE TABLE IF NOT EXISTS team_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hydration_goal INTEGER DEFAULT 128,
    juice_goal INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES caregivers(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE med_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE juice_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bm_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (Permissive for Team Access)
CREATE POLICY "Team access caregivers" ON caregivers FOR ALL USING (true);
CREATE POLICY "Team access medications" ON medications FOR ALL USING (true);
CREATE POLICY "Team access med_logs" ON med_logs FOR ALL USING (true);
CREATE POLICY "Team access hydration_logs" ON hydration_logs FOR ALL USING (true);
CREATE POLICY "Team access juice_logs" ON juice_logs FOR ALL USING (true);
CREATE POLICY "Team access bm_logs" ON bm_logs FOR ALL USING (true);
CREATE POLICY "Team access team_settings" ON team_settings FOR ALL USING (true);
CREATE POLICY "Team access messages" ON messages FOR ALL USING (true);

-- Insert Default Settings
INSERT INTO team_settings (hydration_goal, juice_goal)
SELECT 128, 0
WHERE NOT EXISTS (SELECT 1 FROM team_settings);
