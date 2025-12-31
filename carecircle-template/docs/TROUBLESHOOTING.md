# Troubleshooting Guide

Common issues and solutions for setting up and running CareCircle.

## 🏗️ Setup & Build Issues

### `npm install` fails
*   **Cause:** Outdated Node.js version or network issues.
*   **Solution:**
    *   Ensure you have Node.js v18 or higher (`node -v`).
    *   Clear cache: `npm cache clean --force`.
    *   Delete `node_modules` and `package-lock.json`, then try again.

### Build fails with "Env variable not found"
*   **Cause:** Missing `.env` file or incorrect variable names.
*   **Solution:**
    *   Ensure `.env` exists in the root directory.
    *   Verify variable names match exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### "Copy-Item is not recognized" (Windows)
*   **Cause:** Running setup commands in Command Prompt instead of PowerShell.
*   **Solution:** Use the provided `scripts/setup.bat` file, or run commands in PowerShell.

## 🗄️ Database Issues

### "relation 'caregivers' does not exist"
*   **Cause:** Database tables haven't been created.
*   **Solution:** Run the `database/setup_database.sql` script in the Supabase SQL Editor.

### "new row violates row-level security policy"
*   **Cause:** RLS policies are preventing the write operation.
*   **Solution:**
    *   Ensure you are logged in.
    *   Verify RLS policies in Supabase Dashboard > Authentication > Policies.
    *   Re-run the RLS section of the setup script.

### Data not syncing between devices
*   **Cause:** Real-time subscription issues.
*   **Solution:**
    *   Check browser console for connection errors.
    *   Ensure "Realtime" is enabled for tables in Supabase Dashboard > Database > Replication.

## 🌐 Deployment Issues

### White screen after deployment
*   **Cause:** JavaScript errors or missing config.
*   **Solution:**
    *   Open browser developer tools (F12) > Console.
    *   Check for "Supabase configuration missing" error.
    *   Ensure Environment Variables are set in Netlify Site Settings.

### 404 on refresh (Netlify)
*   **Cause:** Single Page App (SPA) routing issue.
*   **Solution:** Ensure the `_redirects` file (or `netlify.toml` redirect rules) is present in the build output. This template includes a `netlify.toml` that handles this automatically.

## 📱 Mobile App Issues

### "Expoconfig: ... is missing"
*   **Cause:** Missing EAS secrets.
*   **Solution:** Run the `eas secret:create` commands listed in the Deployment Guide.

### App crashes on launch
*   **Cause:** Missing configuration or network error.
*   **Solution:**
    *   Check logs in Expo Go or `eas build` logs.
    *   Verify Supabase URL and Key are correct in secrets.

## 🆘 Getting Help

If you're still stuck:

1.  Check the browser console for error messages.
2.  Review the Supabase logs in the Dashboard.
3.  Search for specific error messages online.
