# Patient Switching Guide

## Overview

The CareCircle application now supports **patient switching**, allowing one caregiver to manage multiple patients and switch between them easily.

## How It Works

### Database Architecture

1. **patients table** - Stores patient/care circle information
2. **caregivers table** - Stores caregiver/user information
3. **caregiver_patients table** (NEW) - Junction table linking caregivers to multiple patients
4. **Data tables** - All data is tagged with `patient_id`

### Caregiver-Patient Relationship

- **One caregiver can belong to multiple patient circles**
- **One patient circle can have multiple caregivers**  
- **Caregivers can switch between their patients using a dropdown**

## Setup Instructions

### Step 1: Apply Database Migration

Run this SQL in Supabase dashboard to enable patient switching:

**File:** `C:\Users\Admin\Desktop\Programming\Medicne App\carecircle-template\database\add_patient_switching.sql`

1. Open https://supabase.com/dashboard
2. SQL Editor → New Query  
3. Copy entire contents of `add_patient_switching.sql`
4. Paste and Run

### Step 2: Update RLS Helper Function

The existing `get_my_patient_id()` function returns the current patient_id from the caregivers table. This still works for the default patient. No changes needed.

### Step 3: Deploy Updated Application

The UI changes to support patient switching are in:
- `carecircle-template/dist/src/main.js` (updated with patient selector dropdown)
- `carecircle-template/dist/index.html` (already configured correctly)

Deploy the `dist` folder to Netlify as usual.

## Using Patient Switching

### For Caregivers

1. **Login** to the application
2. **See Patient Selector** in the header (if you belong to multiple patient circles)
3. **Select a Patient** from the dropdown
4. **View/Manage Data** for the selected patient
5. **Switch Patients** anytime using the dropdown

### For Adding Patients

To add a new patient to care for:

1. Have another caregiver (who is already caring for that patient) invite you via email
2. OR create a new patient circle (automatic when first logging in without any patients)
3. OR manually add yourself to a patient via database query (admin only)

## SQL Query to Add Yourself to Patient

If you know a patient_id and want to add yourself:

```sql
INSERT INTO caregiver_patients (caregiver_id, patient_id)
VALUES ('your-caregiver-id', 'patient-id-to-add');
```

To find patient IDs:
```sql
SELECT id, name FROM patients;
```

## Technical Details

### Patient Selector UI

The patient selector appears in the dashboard header:
- Shows patient name
- Dropdown with all accessible patients
- Auto-selects the first patient if none is selected
- Reloads dashboard when patient changes

### Data Isolation

- **RLS Policies ensure proper data isolation**
- Caregivers can only see data for patients they have access to
- Switching patients changes which data is visible
- All operations (add/edit/delete) apply to the currently selected patient

### Default Patient

- When a caregiver logs in, they see their first accessible patient by default
- The `patient_id` column in `caregivers` table stores the default/last selected patient
- This can be updated when the user switches patients

## Troubleshooting

### Issue: No patient selector showing

**Possible Causes:**
1. You only belong to one patient circle (selector hidden if count = 1)
2. Database migration `add_patient_switching.sql` not applied
3. No caregiver_patients records exist

**Solution:**
1. Apply `add_patient_switching.sql` migration
2. Check: `SELECT * FROM caregiver_patients WHERE caregiver_id = auth.uid();`
3. If empty, create a relationship or new patient

### Issue: Can't switch patients

**Check:**
1. Verify you have relationships in `caregiver_patients` table
2. Check browser console for errors
3. Verify RLS policies allow access to both patients

### Issue: Data doesn't change when switching

**Check:**
1. Verify `currentPatientId` is update in global state
2. Check that `loadDashboard()` is called after switching
3. Verify all queries use `currentPatientId` for filtering

## Support

For additional help, see:
- `carecircle-template/RLS_FIX_README.md` - Main documentation
- `carecircle-template/docs/RLS_FIX_MANUAL_GUIDE.md` - RLS fix guide
- `carecircle-template/IMPLEMENTATION_STATUS.md` - Implementation status

## Summary

Patient switching allows one caregiver to manage multiple patients efficiently:
✅ Switch between patients using a dropdown
✅ Automatic data isolation via RLS policies
✅ Team collaboration within each patient circle
✅ Easy to add more patients as needed
