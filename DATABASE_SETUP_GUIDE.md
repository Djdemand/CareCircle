# Database Setup Guide for CareCircle

This guide provides detailed step-by-step instructions for setting up your Supabase database tables.

## Prerequisites

- A Supabase account (free tier works)
- Your Supabase project URL: `https://oydyrdcnoygrzjapanbd.supabase.co`
- The SQL setup script: `supabase/setup.sql`

## Step-by-Step Instructions

### Step 1: Open Supabase Dashboard

1. Open your web browser
2. Go to: https://supabase.com/dashboard
3. Sign in to your Supabase account (if not already signed in)

### Step 2: Select Your Project

1. You should see a list of your projects
2. Click on the project with URL: `https://oydyrdcnoygrzjapanbd.supabase.co`
3. This will open your project dashboard

### Step 3: Open SQL Editor

1. Look at the left sidebar of the dashboard
2. You should see menu items like:
   - Table Editor
   - SQL Editor
   - Database
   - Authentication
   - etc.
3. Click on **"SQL Editor"**
4. This will open a SQL query interface with a text area

### Step 4: Copy the SQL Script

1. In your VSCode or file explorer, navigate to your project folder
2. Open the file: `supabase/setup.sql`
3. Select ALL the SQL code in that file (Ctrl+A or Cmd+A)
4. Copy the SQL code (Ctrl+C or Cmd+C)

The SQL script contains:
- Table creation for `caregivers`
- Table creation for `medications`
- Table creation for `med_logs`
- Table creation for `hydration_logs`
- Row Level Security (RLS) policies

### Step 5: Paste and Run the SQL Script

1. Go back to the Supabase SQL Editor in your browser
2. **Click in the large empty black area** on the right side of the screen.
   - It usually has the number `1` on the left.
   - It might say **"Hit CTRL+K to generate query or just start typing"** in gray text.
3. Paste the SQL code (Ctrl+V or Cmd+V) into this area.
4. You should see all the SQL code appear in the editor.

5. Look for the green **"Run"** button at the bottom right of the screen.
6. Click **"Run"** to execute the SQL script
7. Alternatively, you can press **Ctrl+Enter** (Windows) or **Cmd+Enter** (Mac)

### Step 6: Verify Tables Were Created

1. After running the SQL, you should see a success message
2. In the left sidebar, click on **"Table Editor"**
3. You should see a dropdown menu with table names
4. Click on each table to verify they exist:
   - `caregivers` - Should show empty table with columns: id, name, email, created_at
   - `medications` - Should show empty table with columns: id, name, dosage, frequency_hours, etc.
   - `med_logs` - Should show empty table with columns: id, med_id, caregiver_id, etc.
   - `hydration_logs` - Should show empty table with columns: id, caregiver_id, amount_oz, logged_at

### Step 7: Test the Application

Now that the database is set up:

1. **Test Locally** (optional):
   - Open `dist/index.html` in your browser
   - Sign up with an email and password
   - Try adding a medication
   - Should work without errors

2. **Deploy to Netlify**:
   - Go to: https://app.netlify.com/drop
   - Drag the `dist` folder to the deploy area
   - Wait for deployment to complete
   - Visit your deployed site
   - Test adding a medication

## Troubleshooting

### Issue: SQL Script Won't Run

**Possible causes:**
- You're not signed in to Supabase
- You selected the wrong project
- SQL syntax error (unlikely if you copied the entire file)

**Solutions:**
1. Make sure you're signed in to Supabase
2. Verify you selected the correct project (check the URL matches)
3. Try copying the SQL script again and make sure you copied ALL of it
4. Check for any error messages in the SQL Editor

### Issue: Tables Don't Appear After Running SQL

**Possible causes:**
- SQL script didn't execute successfully
- You're looking in the wrong project

**Solutions:**
1. Check the SQL Editor for error messages
2. Verify you're in the correct project
3. Try running the SQL script again
4. Refresh the Table Editor page

### Issue: Still Getting "Could not find table" Error

**Possible causes:**
- Database tables weren't created
- You're using a different Supabase project

**Solutions:**
1. Verify the Supabase URL in `web/src/config.js` matches your project
2. Check that tables exist in Table Editor
3. Make sure you ran the SQL script in the correct project

## What the SQL Script Creates

### 1. Caregivers Table
Stores caregiver/user information:
- `id` - Unique identifier (UUID)
- `name` - Caregiver's name
- `email` - Caregiver's email (unique)
- `created_at` - Timestamp when record was created

### 2. Medications Table
Stores medication information:
- `id` - Unique identifier (UUID)
- `name` - Medication name
- `dosage` - Dosage amount (e.g., "500mg")
- `frequency_hours` - How often to take (e.g., 8 for every 8 hours)
- `duration_days` - How long the medication regimen lasts
- `start_date` - When to start taking the medication
- `end_date` - Automatically calculated end date
- `instructions` - Special instructions for taking the medication
- `created_by` - Which caregiver created this medication

### 3. Med Logs Table
Tracks when medications are taken:
- `id` - Unique identifier (UUID)
- `med_id` - Which medication was taken
- `caregiver_id` - Who administered the medication
- `administered_at` - When it was taken
- `window_start` - Start of the time window
- `window_end` - End of the time window
- Prevents duplicate doses within the same time window

### 4. Hydration Logs Table
Tracks water intake:
- `id` - Unique identifier (UUID)
- `caregiver_id` - Who logged the hydration
- `amount_oz` - How much water (in ounces)
- `logged_at` - When it was logged

## Security Features

The SQL script also sets up **Row Level Security (RLS)**:
- Only authenticated users can access the data
- Simplified policies for demo purposes
- Can be enhanced later for production use

## Next Steps

After completing database setup:

1. ✅ Database tables are created
2. ✅ Security policies are in place
3. ✅ Application can now store and retrieve data
4. ✅ Ready to deploy to Netlify

## Support

If you encounter issues:
1. Check the SQL Editor for error messages
2. Verify you're in the correct Supabase project
3. Make sure you copied the entire SQL script
4. Check that the Supabase URL in `web/src/config.js` matches your project

## Quick Reference

**Supabase Dashboard**: https://supabase.com/dashboard
**Your Project URL**: https://oydyrdcnoygrzjapanbd.supabase.co
**SQL Script Location**: `supabase/setup.sql`
**Config File**: `web/src/config.js`

---

**Estimated Time**: 2-5 minutes
**Difficulty**: Easy (copy and paste)
**Required**: Yes (app won't work without this step)
