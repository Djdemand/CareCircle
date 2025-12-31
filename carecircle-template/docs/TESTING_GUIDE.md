# Testing Guide

After setting up your CareCircle instance, use this checklist to verify everything is working correctly.

## 🧪 1. Database Verification

*   [ ] **Tables Created:** Check Supabase Dashboard > Table Editor. You should see 8 tables (`caregivers`, `medications`, etc.).
*   [ ] **RLS Enabled:** Check Authentication > Policies. All tables should have RLS enabled with "Team access" policies.
*   [ ] **Default Settings:** Check `team_settings` table. It should have one row with `hydration_goal: 128`.

## 👤 2. User Authentication

*   [ ] **Sign Up:** Create a new account on the login screen.
*   [ ] **Email Verification:** (If enabled) Check email for confirmation link.
*   [ ] **Login:** Log in with the new account.
*   [ ] **Profile Creation:** Verify a row is created in the `caregivers` table for the new user.
*   [ ] **Logout:** Verify logout works and redirects to login screen.

## 💊 3. Medication Tracking

*   [ ] **Add Medication:** Add a new med (e.g., "Tylenol", "500mg", "Every 4 hours").
*   [ ] **View List:** Verify it appears on the dashboard.
*   [ ] **Mark Taken:** Click "Mark as Taken". Verify status changes and timer starts.
*   [ ] **History:** Expand history to see the log entry.
*   [ ] **Edit:** Change dosage or frequency. Verify updates.
*   [ ] **Delete:** Delete the medication. Verify it disappears.

## 💧 4. Hydration & Juice

*   [ ] **Add Water:** Click "+8 oz". Verify total increases and glass fills.
*   [ ] **Add Juice:** Click "+4 oz". Verify juice total increases.
*   [ ] **Set Goal:** Change daily goal. Verify progress bar updates.
*   [ ] **Reset:** Click "Reset Today's Hydration". Verify count goes to 0.

## 💩 5. BM Tracking

*   [ ] **Log BM:** Click "YES". Verify status changes to Green/Regular.
*   [ ] **Log No BM:** Click "NO". Verify status changes (if applicable).
*   [ ] **History:** Check the history list below the buttons.

## 👥 6. Team Features

*   [ ] **Invite:** (Mock) Click Invite button.
*   [ ] **Real-time Sync:**
    *   Open the app in two different browsers/incognito windows.
    *   Log in with the same account (or different accounts if you set up team logic).
    *   Add a medication in Window A.
    *   **Verify:** It appears instantly in Window B without refreshing.
*   [ ] **Messaging:** Send a message in Window A. Verify it appears in Window B.

## 📱 7. Mobile App (If applicable)

*   [ ] **Login:** Log in on the mobile app.
*   [ ] **Sync:** Verify data matches the web dashboard.
*   [ ] **Push Notifications:** (Requires physical device) Verify permission prompt appears.

## 🐛 Reporting Issues

If any of these tests fail:
1.  Check the browser console for errors.
2.  Refer to `TROUBLESHOOTING.md`.
3.  Verify your RLS policies in Supabase.
