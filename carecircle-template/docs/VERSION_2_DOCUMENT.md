# CareCircle Version 2 (Multi-tenant) Documentation

## Overview
Version 2 of CareCircle introduces **Multi-tenancy**, allowing the application to serve multiple patient circles securely. Each "Patient" has their own isolated data environment, and "Caregivers" are linked specifically to one Patient.

## Deployment Instructions
**Program Location:** `C:\Users\Admin\Desktop\Programming\Medicne App\carecircle-template\dist`

**To Update Production:**
1. Drag the `dist` folder to [Netlify Drop](https://app.netlify.com/drop)
2. The app will be deployed instantly

**Important:** Do NOT modify any files outside the `carecircle-template` directory.

---

## Multi-tenant Architecture

### Patient-Centric Design
- **Tenant Root**: The `Patient` table is the root entity
- **Data Isolation**: Each patient has their own medications, logs, hydration data, etc.
- **Team Structure**: Caregivers are assigned to a specific patient circle

### Admin Rights
- **First User**: The first user to register automatically becomes the Admin
- **Single Admin**: Only ONE admin exists per patient circle at any time
- **Transfer Logic**: Only the current admin can transfer admin rights to another caregiver

### Patient Selection
- **At Login**: User selects which patient they will be caring for (dropdown)
- **New Users**: Can create a new patient during registration if one doesn't exist
- **Patient Name Display**: The patient name is shown at the top of the dashboard

---

## Key Features

### 1. Health Tracking
- **Medication Management**: Schedule, log, skip, and track medications
- **Hydration Tracking**: Water intake with customizable daily goals (in oz)
- **Juice Tracking**: Separate tracking for juice intake
- **Bowel Movement (BM) Logs**: Track digestive health with notes

### 2. Team Coordination
- **Real-time Sync**: All caregivers see updates instantly
- **Team Messages**: Built-in messaging between caregivers
- **Team Settings**: Shared goals managed by admin

### 3. Security
- **Row Level Security (RLS)**: First user cannot see other patients' data
- **Supabase Auth**: Email-based authentication

---

## Database Schema

### Tables
| Table | Description |
|-------|-------------|
| `patients` | Root tenant table - stores patient name |
| `caregivers` | User profiles linked to a patient_id |
| `medications` | Medication schedules per patient |
| `med_logs` | Medication administration records |
| `hydration_logs` | Water intake logs (amount_oz) |
| `juice_logs` | Juice intake logs (amount_oz) |
| `bm_logs` | Bowel movement tracking |
| `team_settings` | Shared settings (hydration goals) |
| `messages` | Team communication |

### Key Columns
- All tables have `patient_id` for tenant isolation
- `caregivers.is_admin` - Boolean flag for admin status
- `hydration_logs.amount_oz` - Integer for ounces
- `juice_logs.amount_oz` - Integer for ounces

---

## Current Known Issues & Fixes

### Error: "null value in column 'amount_ml'"
**Cause**: Database column mismatch - DB has `amount_ml` but code uses `amount_oz`
**Fix**: Run `COMPLETE_DB_FIX.sql` in Supabase SQL Editor

### Error: "infinite recursion detected in policy"
**Cause**: RLS policy references caregivers table within itself
**Fix**: Run `COMPLETE_DB_FIX.sql` in Supabase SQL Editor

### Error: "Could not find table 'public.patients'"
**Cause**: Wrong Supabase project URL in config.js
**Fix**: Ensure `dist/src/config.js` has correct Supabase URL and anon key

---

## SQL Fix Scripts (in dist folder)

| Script | Purpose |
|--------|---------|
| `COMPLETE_DB_FIX.sql` | Fixes ALL issues - column names, RLS policies |
| `FIX_ALL_RLS.sql` | Fixes only RLS recursion issues |
| `DB_UPDATE_V2.sql` | Initial V2 database setup |

---

## Configuration Files

### dist/src/config.js
```javascript
window.SUPABASE_CONFIG = {
  URL: 'https://YOUR-PROJECT.supabase.co',
  ANON_KEY: 'YOUR-ANON-KEY'
};
```

**Important**: Both `dist/config.js` AND `dist/src/config.js` must have matching credentials. The HTML loads from `src/config.js`.

---

## Tech Stack

- **Frontend**: Vanilla JavaScript, Tailwind CSS (via CDN)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Deployment**: Netlify (drag & drop)

---

*Last Updated: 2026-01-04*
