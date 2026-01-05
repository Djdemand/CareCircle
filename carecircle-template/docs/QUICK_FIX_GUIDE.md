# Quick Fix Guide - RLS Policy Violations

## Problem
```
Error adding water: new row violates row-level security policy for table "hydration_logs"
```

## Quick Solution (5 minutes)

### Step 1: Open Supabase Dashboard
Go to: https://supabase.com/dashboard

### Step 2: Select Your Project
Click on your project in the dashboard

### Step 3: Open SQL Editor
- In the left sidebar, click "SQL Editor"
- Click "New Query"

### Step 4: Copy and Run the Fix
1. Open this file: `carecircle-template/database/fix_rls_for_patients_schema.sql`
2. Copy the entire contents
3. Paste into the SQL Editor
4. Click "Run"

### Step 5: Test
Try adding a hydration log or medication in the app - it should work now!

## What This Does

The SQL script:
1. ✅ Disables RLS temporarily
2. ✅ Re-enables RLS with proper policies
3. ✅ Creates helper function for patient_id lookup
4. ✅ Allows authenticated users to access their patient's data
5. ✅ Enables team collaboration within patient circles

## Tables Fixed

- `patients`
- `caregivers`
- `medications`
- `med_logs`
- `hydration_logs`
- `juice_logs`
- `bm_logs`
- `team_settings`
- `messages`

## Verification

After running the fix, test these:
- [ ] Add hydration log
- [ ] Add medication
- [ ] View team members
- [ ] Invite team member

## If It Doesn't Work

1. Check the SQL Editor output for errors
2. Verify you're logged in to the app
3. Check Supabase logs in the dashboard
4. See `carecircle-template/docs/RLS_FIX_MANUAL_GUIDE.md` for detailed troubleshooting

## Need More Help?

- **Detailed Guide**: `carecircle-template/docs/RLS_FIX_MANUAL_GUIDE.md`
- **Summary**: `carecircle-template/docs/RLS_FIX_SUMMARY.md`
- **SQL File**: `carecircle-template/database/fix_rls_for_patients_schema.sql`

---

**That's it!** The fix should resolve all RLS policy violations and enable proper multitenancy.
