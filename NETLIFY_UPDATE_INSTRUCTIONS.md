# Updating Netlify Deployment

Since the code changes have been pushed to the `main` branch, Netlify should automatically trigger a new build and deployment if you have Continuous Deployment (CD) enabled.

However, for the application to work correctly with the new multi-tenancy features, you **MUST** update the database connected to your Netlify site.

## Step 1: Verify Database Connection
Ensure your Netlify site is connected to the **correct Supabase project** (the one dedicated to this template app, NOT your original production app).
1.  Go to Netlify -> Site Settings -> Environment Variables.
2.  Check `VITE_SUPABASE_URL`. It should match the URL of your *new* Supabase project.

## Step 2: Update the Database
You need to apply the schema changes to support multi-tenancy.

1.  Open the **Supabase Dashboard** for the project connected to this Netlify site.
2.  Go to the **SQL Editor**.
3.  Open the file `carecircle-template/database/add_multitenancy.sql` from this repository.
4.  Copy the content and paste it into the SQL Editor.
5.  **Run** the script.
    *   *Note: This will create the `patients` table and update existing tables with `patient_id` columns and RLS policies.*

## Step 3: Verify Deployment
1.  Go to your Netlify Dashboard.
2.  Check the **Deploys** tab.
3.  You should see a "Building" or "Published" deploy corresponding to the latest commit ("Add safety warnings...").
4.  If it hasn't deployed, click **"Trigger deploy"** -> **"Deploy site"**.

## Step 4: Test
1.  Open your deployed site URL.
2.  Try to **Sign Up** a new user. You should see the "Patient Name" field.
3.  After signing up, verify the header shows "CareCircle for: [Patient Name]".
