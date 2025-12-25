# Medication Addition Test Plan

## BMAD Methodology

### 1. Build
The `AddMedication` component has been updated to ensure that a `caregivers` table record exists for the current authenticated user before attempting to insert a medication.

**Key Changes:**
- The component now fetches the current authenticated user.
- It checks if a `caregivers` record exists matching the user's email.
- If no record exists, it creates one automatically.
- It uses the `caregivers.id` (not the Auth user ID) for the `medications.created_by` field.

### 2. Measure
To verify the fix works, perform the following steps:

#### Test Case 1: New User Adding Medication
1. **Pre-condition**: Ensure you are logged in with a user that does NOT have a corresponding record in the `caregivers` table.
2. **Action**: Navigate to the "Add Medication" screen.
3. **Input**:
   - Medication Name: "Test Med 1"
   - Dosage: "10mg"
   - Frequency: "8"
4. **Action**: Click "Save Medication".
5. **Expected Result**:
   - A new record is created in the `caregivers` table with your email.
   - A new record is created in the `medications` table.
   - The `medications.created_by` field contains the `caregivers.id`.
   - Success alert: "Medication added to the team schedule".

#### Test Case 2: Existing User Adding Medication
1. **Pre-condition**: Ensure you are logged in with a user that DOES have a corresponding record in the `caregivers` table.
2. **Action**: Navigate to the "Add Medication" screen.
3. **Input**:
   - Medication Name: "Test Med 2"
   - Dosage: "20mg"
   - Frequency: "12"
4. **Action**: Click "Save Medication".
5. **Expected Result**:
   - No new record is created in the `caregivers` table (it already exists).
   - A new record is created in the `medications` table.
   - The `medications.created_by` field contains the existing `caregivers.id`.
   - Success alert: "Medication added to the team schedule".

#### Test Case 3: Invalid Frequency
1. **Pre-condition**: Logged in user.
2. **Action**: Navigate to the "Add Medication" screen.
3. **Input**:
   - Medication Name: "Test Med 3"
   - Dosage: "5mg"
   - Frequency: "0" or "-5" or "abc"
4. **Action**: Click "Save Medication".
5. **Expected Result**:
   - Error alert: "Please enter a valid frequency (hours)".
   - No medication is added to the database.

### 3. Analyze
After running the tests, analyze the results:

- **If Test Case 1 passes**: The automatic caregiver creation logic is working correctly.
- **If Test Case 2 passes**: The existing caregiver lookup logic is working correctly.
- **If Test Case 3 passes**: The input validation logic is working correctly.

**Common Issues:**
- **Foreign Key Constraint Error**: This indicates the `caregivers` record was not found or created. Check the Supabase logs for details.
- **Auth Error**: This indicates the user is not logged in. Ensure you are authenticated before testing.

### 4. Develop
If any tests fail, use the following debugging steps:

1. **Check Supabase Logs**: Look for detailed error messages in the Supabase dashboard.
2. **Verify RLS Policies**: Ensure the Row Level Security policies allow the current user to read/write to the `caregivers` and `medications` tables.
3. **Check Network Requests**: Use the browser's Network tab (for web) or a network inspector (for mobile) to see the actual API requests and responses.

## SQL Verification Queries

Run these queries in the Supabase SQL Editor to verify the data:

```sql
-- Check if a caregiver record exists for your email
SELECT * FROM caregivers WHERE email = 'your-email@example.com';

-- Check medications created by that caregiver
SELECT m.*, c.email 
FROM medications m 
JOIN caregivers c ON m.created_by = c.id 
WHERE c.email = 'your-email@example.com';
```

## Success Criteria
The fix is considered successful when:
1. A new user can add a medication without errors.
2. An existing user can add a medication without errors.
3. The `medications.created_by` field correctly references a valid `caregivers.id`.
4. Input validation prevents invalid data from being saved.
