# RLS Policy Fix Manual Application Guide

## Problem
Row Level Security (RLS) policies are blocking all database operations with the error:
```
Error adding water: new row violates row-level security policy for table "hydration_logs"
```

This error occurs on all tables and any changes in the program.

## Solution
Apply the SQL migration file to fix all RLS policies with proper multitenancy support using the patients table schema.

## Steps to Apply the Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Sign in to your account
   - Select your project

2. **Open SQL Editor**
   - In the left sidebar, click on "SQL Editor"
   - Click "New Query"

3. **Copy and Execute the SQL**
   - Open the file: `carecircle-template/database/fix_rls_for_patients_schema.sql`
   - Copy the entire contents of the file
   - Paste it into the SQL Editor
   - Click "Run" to execute the migration

4. **Verify the Fix**
   - After execution, you should see "Success" message
   - Test the application by adding a hydration log or medication

### Option 2: Using Supabase CLI (If Available)

If you have the Supabase CLI installed and authenticated:

```bash
cd "c:/Users/Admin/Desktop/Programming/Medicne App"
supabase db execute --file "carecircle-template/database/fix_rls_for_patients_schema.sql"
```

## What the Migration Does

The migration performs the following steps:

1. **Disables RLS temporarily** on all tables to allow operations
2. **Re-enables RLS** on all tables
3. **Drops all existing policies** that were causing issues
4. **Creates a helper function** `get_my_patient_id()` to get the current user's patient_id
5. **Creates new permissive policies** that allow authenticated users to:
   - Access their own patient data
   - Access data for their patient circle (all caregivers sharing the same patient_id)

## Tables Fixed

The migration fixes RLS policies for these 9 tables:
- `patients`
- `caregivers`
- `medications`
- `med_logs`
- `hydration_logs`
- `juice_logs`
- `bm_logs`
- `team_settings`
- `messages`

## Policy Pattern

Each table now has 4 policies (SELECT, INSERT, UPDATE, DELETE) with this pattern:

```sql
CREATE POLICY "Users can view hydration logs for their patient" ON hydration_logs
  FOR SELECT
  TO authenticated
  USING (patient_id = get_my_patient_id());
```

This ensures:
- Users can always access data for their patient
- All caregivers sharing the same patient_id can access the same data
- Proper multitenancy support is maintained
- Data is isolated between different patient circles

## Helper Function

The migration creates a helper function:

```sql
CREATE OR REPLACE FUNCTION get_my_patient_id() RETURNS UUID AS $$
    SELECT patient_id FROM caregivers WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;
```

This function:
- Gets the current authenticated user's ID from `auth.uid()`
- Looks up their `patient_id` from the `caregivers` table
- Returns the `patient_id` for use in RLS policies
- Uses `SECURITY DEFINER` to allow access to the caregivers table

## Testing After Fix

After applying the migration, test these operations:

1. **Add hydration log** - Should work without RLS error
2. **Add medication** - Should work without RLS error
3. **Add BM log** - Should work without RLS error
4. **Add juice log** - Should work without RLS error
5. **Update any record** - Should work without RLS error
6. **Delete any record** - Should work without RLS error
7. **View team members** - Should show all caregivers in your patient circle
8. **Invite team member** - Should add new caregiver to your patient circle

## Troubleshooting

### If the migration fails:

1. Check that you're connected to the correct project
2. Verify you have admin permissions
3. Check the error message in the SQL Editor output
4. Try running each section separately if needed

### If RLS errors persist:

1. Verify the migration was applied successfully
2. Check that you're logged in as an authenticated user
3. Verify the `auth.uid()` is returning your user ID
4. Check that your caregiver record has a `patient_id` set
5. Check the Supabase logs for more details

### If you see "patient_id is null" errors:

1. Ensure the `add_multitenancy.sql` migration was run first
2. Check that your caregiver record has a `patient_id` assigned
3. Verify the patients table has at least one record
4. Run this query to check:
   ```sql
   SELECT id, name, patient_id FROM caregivers WHERE id = auth.uid();
   ```

## Multitenancy Architecture

The carecircle-template uses a **patients-based multitenancy** model:

### Tables Structure

1. **patients** - Represents a patient/care circle
   - `id` (UUID) - Primary key
   - `name` - Patient name
   - `created_at` - Timestamp

2. **caregivers** - Users who can access patient data
   - `id` (UUID) - Primary key, matches auth.uid()
   - `name` - Caregiver name
   - `email` - Caregiver email
   - `patient_id` (UUID) - Links to patients table
   - Other fields...

3. **Data tables** (medications, hydration_logs, etc.)
   - `id` (UUID) - Primary key
   - `patient_id` (UUID) - Links to patients table
   - Other fields...

### How It Works

1. When a user signs up, they are added to the `caregivers` table
2. Each caregiver is assigned a `patient_id`
3. All data (medications, logs, etc.) is tagged with the same `patient_id`
4. RLS policies ensure users can only access data with their `patient_id`
5. Multiple caregivers can share the same `patient_id`, forming a care team

### Benefits

- **Data Isolation**: Different patient circles are completely isolated
- **Team Collaboration**: Multiple caregivers can work together on the same patient
- **Simple Model**: Easy to understand and maintain
- **Scalable**: Can support unlimited patient circles

## Next Steps

After fixing RLS policies, the multitenancy features should work properly:
- Patient circle creation
- Caregiver invitation and management
- Shared data access within patient circles
- Proper data isolation between different patient circles

## Additional Files

- `carecircle-template/database/add_multitenancy.sql` - Adds patient_id columns to existing tables
- `carecircle-template/database/database_schema.sql` - Complete database schema
- `carecircle-template/src/utils/multitenancyHelper.ts` - Helper utility for patient_id handling

## Support

If you encounter any issues:
1. Check the SQL Editor output for error messages
2. Review the Supabase logs in the dashboard
3. Verify your authentication is working correctly
4. Ensure the database schema matches the expected structure
5. Check that all migrations have been applied in order
