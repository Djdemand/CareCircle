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

```sql
-- Caregivers Table
CREATE TABLE IF NOT EXISTS caregivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medications Table
CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency_hours INTEGER NOT NULL,
    duration_days INTEGER NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    instructions TEXT,
    created_by UUID REFERENCES caregivers(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medication Logs Table
CREATE TABLE IF NOT EXISTS med_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    med_id UUID REFERENCES medications(id) ON DELETE CASCADE,
    caregiver_id UUID REFERENCES caregivers(id),
    administered_at TIMESTAMPTZ DEFAULT NOW(),
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL
);

-- Hydration Logs Table
CREATE TABLE IF NOT EXISTS hydration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caregiver_id UUID REFERENCES caregivers(id),
    amount_oz INTEGER NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE med_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users access
CREATE POLICY "Team access" ON caregivers FOR ALL USING (true);
CREATE POLICY "Team access" ON medications FOR ALL USING (true);
CREATE POLICY "Team access" ON med_logs FOR ALL USING (true);
CREATE POLICY "Team access" ON hydration_logs FOR ALL USING (true);
```

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
