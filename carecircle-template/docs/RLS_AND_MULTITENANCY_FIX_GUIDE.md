# RLS and Multitenancy Fix Guide

## Overview

This guide explains how to fix the Row-Level Security (RLS) policy violations and implement proper multitenancy (care circles) in the CareCircle application.

## Problem

The application was experiencing RLS violations when trying to insert data:
```
Error adding water: new row violates row-level security policy for table "hydration_logs"
```

This was happening because:
1. The RLS policies were checking `patient_id = get_my_patient_id()` for ALL operations including INSERT
2. When inserting new rows, the `patient_id` wasn't being set automatically
3. The code was manually fetching `patient_id` but the RLS policy was rejecting the insert

## Solution

The fix involves three parts:

### 1. Database Schema Updates

Run the SQL script [`complete_rls_and_schema_fix.sql`](../database/complete_rls_and_schema_fix.sql) in your Supabase SQL Editor.

This script will:
- Add `amount_ml` and `logged_by` columns to `hydration_logs` and `juice_logs` tables
- Migrate existing data from `amount_oz` to `amount_ml` (1 oz = 29.57 ml)
- Ensure `patient_id` exists on all tables
- Backfill `patient_id` for existing data
- Update RLS policies to allow INSERT operations with automatic `patient_id` setting

### 2. RLS Policy Updates

The script creates new RLS policies that:
- Allow INSERT operations for authenticated users with `patient_id = get_my_patient_id()` check
- Allow SELECT/UPDATE/DELETE operations based on `patient_id` matching the user's patient
- Provide proper tenant isolation between care circles

### 3. Code Updates

The following files have been updated to use the multitenancy helper:

- [`HydrationTracker.tsx`](../src/screens/HydrationTracker.tsx) - Uses `insertHydrationLog()` helper
- [`JuiceTracker.tsx`](../src/screens/JuiceTracker.tsx) - Uses `insertJuiceLog()` helper
- [`BMTracker.tsx`](../src/screens/BMTracker.tsx) - Uses `insertBMLog()` helper

All three trackers now use the [`multitenancyHelper.ts`](../src/utils/multitenancyHelper.ts) utility which:
- Automatically fetches the current user's `patient_id`
- Includes it in all INSERT operations
- Ensures RLS compliance without manual intervention

## How to Apply the Fix

### Step 1: Backup Your Database (Optional but Recommended)

Before running the fix script, create a backup of your existing data:

```sql
-- Export all data to backup tables
CREATE TABLE IF NOT EXISTS hydration_logs_backup AS SELECT * FROM hydration_logs;
CREATE TABLE IF NOT EXISTS juice_logs_backup AS SELECT * FROM juice_logs;
CREATE TABLE IF NOT EXISTS bm_logs_backup AS SELECT * FROM bm_logs;
CREATE TABLE IF NOT EXISTS med_logs_backup AS SELECT * FROM med_logs;
CREATE TABLE IF NOT EXISTS medications_backup AS SELECT * FROM medications;
CREATE TABLE IF NOT EXISTS caregivers_backup AS SELECT * FROM caregivers;
CREATE TABLE IF NOT EXISTS patients_backup AS SELECT * FROM patients;
CREATE TABLE IF NOT EXISTS team_settings_backup AS SELECT * FROM team_settings;
CREATE TABLE IF NOT EXISTS messages_backup AS SELECT * FROM messages;
```

### Step 2: Run the Fix Script

1. Open your Supabase project dashboard
2. Navigate to the **SQL Editor**
3. Open the file [`complete_rls_and_schema_fix.sql`](../database/complete_rls_and_schema_fix.sql)
4. Click **Run** to execute the script

The script will:
- Add new columns to tables
- Migrate existing data
- Update RLS policies
- Create helper functions

### Step 3: Verify the Fix

After running the script, verify that:

1. **Tables have the new columns:**
   ```sql
   -- Check hydration_logs
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'hydration_logs';
   
   -- Should show: amount_ml, logged_by, patient_id
   ```

2. **RLS policies are updated:**
   ```sql
   -- Check RLS policies
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
   FROM pg_policies 
   WHERE schemaname = 'public';
   
   -- Should show policies like "Hydration Logs: Insert for own patient"
   ```

3. **Data was migrated:**
   ```sql
   -- Check if data was migrated
   SELECT COUNT(*) as hydration_count, 
          COUNT(CASE WHEN amount_ml IS NOT NULL THEN 1 END) as migrated_count
   FROM hydration_logs;
   ```

### Step 4: Test the Application

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open the application in your browser or mobile device

3. Try adding a hydration log:
   - Navigate to Hydration Tracker
   - Click one of the quick add buttons (Small, Glass, Large, Bottle)
   - Should succeed without RLS error

4. Try adding a juice log:
   - Navigate to Juice Tracker
   - Click one of the quick add buttons
   - Should succeed without RLS error

5. Try logging a BM:
   - Navigate to BM Tracker
   - Click "Had BM" or "No BM"
   - Should succeed without RLS error

## Multitenancy Features

### Care Circles (Patient Isolation)

The application now supports multiple care circles (patients):

1. **Each user belongs to one patient circle**
   - Defined by the `patient_id` in the `caregivers` table
   - All data is automatically scoped to this patient

2. **Caregivers can be added to a patient circle**
   - Use the `addCaregiverToCircle()` helper function
   - New caregivers will have access to the same patient data

3. **Data is isolated between care circles**
   - Users in one care circle cannot see data from another care circle
   - Enforced by RLS policies checking `patient_id = get_my_patient_id()`

### Helper Functions

The [`multitenancyHelper.ts`](../src/utils/multitenancyHelper.ts) provides:

- `getCurrentPatientId()` - Get the current user's patient_id
- `insertHydrationLog()` - Insert hydration log with automatic patient_id
- `insertJuiceLog()` - Insert juice log with automatic patient_id
- `insertBMLog()` - Insert BM log with automatic patient_id
- `insertMedication()` - Insert medication with automatic patient_id
- `insertMedLog()` - Insert medication log with automatic patient_id
- `insertMessage()` - Insert message with automatic patient_id
- `getOrCreateTeamSettings()` - Get or create team settings for patient
- `updateTeamSettings()` - Update team settings for patient
- `getPatientCaregivers()` - Get all caregivers in patient circle
- `getCurrentPatient()` - Get patient information
- `updatePatient()` - Update patient information
- `addCaregiverToCircle()` - Add caregiver to patient circle

## Troubleshooting

### Error: "User is not associated with a patient circle"

**Cause:** The authenticated user doesn't have a `patient_id` in the `caregivers` table.

**Solution:**
```sql
-- Assign the user to a patient
UPDATE caregivers 
SET patient_id = (SELECT id FROM patients LIMIT 1)
WHERE id = 'YOUR_USER_ID';
```

### Error: "Failed to insert hydration log: new row violates row-level security policy"

**Cause:** The RLS policy is still rejecting inserts.

**Solution:** Re-run the fix script to ensure RLS policies are properly updated.

### Error: "Column 'amount_ml' does not exist"

**Cause:** The schema update didn't complete successfully.

**Solution:** Check the SQL Editor logs for errors and re-run the script.

## Verification Checklist

After applying the fix, verify:

- [ ] Hydration logs can be added without errors
- [ ] Juice logs can be added without errors
- [ ] BM logs can be added without errors
- [ ] Medications can be added without errors
- [ ] Theme and icons remain unchanged
- [ ] Data is properly isolated between care circles
- [ ] All caregivers in a care circle can see the same data

## Rollback Plan

If you need to rollback the changes:

```sql
-- Restore from backups
DROP TABLE IF EXISTS hydration_logs;
ALTER TABLE hydration_logs_backup RENAME TO hydration_logs;

DROP TABLE IF EXISTS juice_logs;
ALTER TABLE juice_logs_backup RENAME TO juice_logs;

DROP TABLE IF EXISTS bm_logs;
ALTER TABLE bm_logs_backup RENAME TO bm_logs;

-- Restore old RLS policies
-- (You'll need to manually recreate the old policies)
```

## Additional Notes

- The fix maintains backward compatibility by keeping old columns (`amount_oz`, `caregiver_id`)
- New columns (`amount_ml`, `logged_by`) are added alongside old ones
- The application code uses the new columns for consistency
- RLS policies are now properly scoped to allow INSERT operations
- Multitenancy is fully implemented with patient isolation

## Support

If you encounter issues:

1. Check the Supabase SQL Editor logs for any errors
2. Verify that the `get_my_patient_id()` function exists
3. Ensure the authenticated user has a `patient_id` in the `caregivers` table
4. Review the RLS policies in the Supabase dashboard

For more help, refer to:
- Supabase RLS documentation: https://supabase.com/docs/guides/auth/row-level-security
- Multitenancy patterns: https://supabase.com/docs/guides/auth/multi-tenant
