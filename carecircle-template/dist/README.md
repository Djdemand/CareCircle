# CareCircle Web Deployment

## Quick Deploy to Netlify

1. **Drag and drop** this `web` folder to [Netlify Drop](https://app.netlify.com/drop)
2. Your app will be deployed instantly

## Supabase Configuration

The app is pre-configured with:
- **URL**: `https://oydyrdcnoygrzjapanbd.supabase.co`
- **Anon Key**: Included in `src/main.js`

## Required Supabase Setup (DO THIS FIRST)

### 1. Enable Email Authentication
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `oydyrdcnoygrzjapanbd`
3. Navigate to **Authentication** → **Providers**
4. Ensure **Email** provider is enabled

### 2. Create Database Tables
1. Go to **SQL Editor** in Supabase Dashboard
2. Run the following SQL:

-- CareCircle Version 2 (Multi-tenant) Database Setup
-- Run this in Supabase SQL Editor to fix "missing table: patients" errors

-- 1. Patients Table (Root)
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Caregivers Table (Updated)
CREATE TABLE IF NOT EXISTS caregivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id),
    name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency_hours INTEGER NOT NULL,
    duration_days INTEGER NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    instructions TEXT,
    created_by UUID REFERENCES caregivers(id),
    is_mandatory BOOLEAN DEFAULT FALSE,
    position INTEGER DEFAULT 0
);

-- 4. Logs Tables
CREATE TABLE IF NOT EXISTS med_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id),
    med_id UUID REFERENCES medications(id) ON DELETE CASCADE,
    caregiver_id UUID REFERENCES caregivers(id),
    administered_at TIMESTAMPTZ DEFAULT NOW(),
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS hydration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id),
    caregiver_id UUID REFERENCES caregivers(id),
    amount_oz INTEGER NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS juice_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id),
    caregiver_id UUID REFERENCES caregivers(id),
    amount_oz INTEGER NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bm_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id),
    caregiver_id UUID REFERENCES caregivers(id),
    had_bm BOOLEAN NOT NULL,
    notes TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id),
    sender_id UUID REFERENCES caregivers(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id),
    hydration_goal INTEGER DEFAULT 128,
    juice_goal INTEGER DEFAULT 0
);

-- 5. Helper for RLS
CREATE OR REPLACE FUNCTION get_my_patient_id() RETURNS UUID AS $$
    SELECT patient_id FROM caregivers WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- 6. Enable RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE med_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE juice_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bm_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_settings ENABLE ROW LEVEL SECURITY;

-- 7. Policies (Simplified)
CREATE POLICY "Access own patient" ON patients FOR ALL USING (id = get_my_patient_id());
CREATE POLICY "Initial patient creation" ON patients FOR INSERT TO authenticated WITH CHECK (true);

-- Allow viewing caregivers in same patient circle
CREATE POLICY "Team access" ON caregivers FOR ALL USING (patient_id = get_my_patient_id());
CREATE POLICY "Self access" ON caregivers FOR ALL USING (id = auth.uid());

CREATE POLICY "Team access" ON medications FOR ALL USING (patient_id = get_my_patient_id());
CREATE POLICY "Team access" ON med_logs FOR ALL USING (patient_id = get_my_patient_id());
CREATE POLICY "Team access" ON hydration_logs FOR ALL USING (patient_id = get_my_patient_id());
CREATE POLICY "Team access" ON juice_logs FOR ALL USING (patient_id = get_my_patient_id());
CREATE POLICY "Team access" ON bm_logs FOR ALL USING (patient_id = get_my_patient_id());
CREATE POLICY "Team access" ON messages FOR ALL USING (patient_id = get_my_patient_id());
CREATE POLICY "Team access" ON team_settings FOR ALL USING (patient_id = get_my_patient_id());

### 3. Enable Real-time Replication
1. Go to **Database** → **Replication**
2. Enable replication for: `medications`, `med_logs`, `hydration_logs`

## Features

✅ User Registration & Login
✅ Add Medications
✅ "As Needed" Medications (frequency = 0, no overdue status)
✅ Skip Dose Functionality (log as skipped, reset timer)
✅ Custom Hydration Goals (default 128oz, user-customizable 1-256oz)
✅ Delete Individual Logs (medication and hydration history)
✅ Log Medication Doses
✅ View Team Members
✅ Dashboard with Stats
✅ Real-time Team Synchronization
✅ Hydration Tracking with Glass Animation
✅ Countdown Timer for Next Dose
✅ Overdue Status Display
✅ Medication History Export (CSV)
✅ Secure In-App Messaging

## Troubleshooting

### Login fails with "Auth session missing"
- Check browser console (F12) for errors
- Ensure Supabase Email provider is enabled
- Check that tables exist in Supabase

### "relation does not exist" error
- Run the SQL commands above to create tables
- Go to Table Editor in Supabase to verify tables exist

### CORS errors
- Go to **API** → **CORS** in Supabase Dashboard
- Add your Netlify domain to allowed origins

### User created but caregiver profile missing
- This is normal on first signup
- The profile will be created automatically on first login
- Or manually create in Supabase Table Editor

## Development

To run locally:
```bash
# Open index.html directly in browser
# Or use a local server:
npx serve .
```

## Tech Stack

- Pure HTML/CSS/JavaScript (no build step needed)
- Tailwind CSS for styling
- Supabase JS SDK for backend
- Fully responsive design

---

**CareCircle** - Medicine Care Team App
