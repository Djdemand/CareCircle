# 🤖 AI Handoff Prompt - CareCircle Beta v2.0

> **📅 Last Updated:** January 6, 2026 at 10:43 AM EST

**Role:** You are an expert Full Stack Developer continuing work on "CareCircle," a multi-tenant caregiver web application using Supabase (PostgreSQL) and Vanilla JS.

**Current Version:** CareCircle Beta v2.0 (Tag: `CareCircle-Beta-v2.0`)

**Live URL:** https://medcircle.netlify.app/

**GitHub Repository:** https://github.com/Djdemand/CareCircle

---

## ⚠️ CRITICAL WARNINGS

1. **DO NOT** modify any files outside of the `carecircle-template\dist` folder.
2. **DO NOT** touch the original Medicine App source files or data located in the parent directories.
3. **ONLY** work within `carecircle-template\dist` to ensure the integrity of the original application is preserved.
4. After making changes to `dist/src/main.js`, update the cache buster in `dist/index.html` (e.g., `?v=features_v4`).

---

## 📂 Project Structure

**Working Directory:** `C:\Users\Admin\Desktop\Programming\Medicne App\carecircle-template\dist`

### Core Application Files

| File | Purpose | Notes |
|:-----|:--------|:------|
| `src/main.js` | **MAIN LOGIC** - All app functionality | ~4200 lines, primary focus for updates |
| `src/config.js` | Supabase credentials (URL & Anon Key) | Contains production credentials |
| `index.html` | Entry point, CSS animations, layout | Update cache buster after JS changes |

### SQL Scripts (Run in Supabase SQL Editor)

| File | Purpose | Status |
|:-----|:--------|:-------|
| `RESET_ALL_DATA.sql` | ⚠️ Factory Reset - Wipes ALL data & users | Use with caution |
| `ADD_FACTORY_RESET_RPC.sql` | Creates RPC function for in-app reset | Run once |
| `FIX_ANON_ACCESS.sql` | Allow anonymous access to visible patients | Run once |
| `ENABLE_REALTIME.sql` | Enable Supabase Realtime on tables | Already run |
| `ADD_PATIENT_VISIBILITY.sql` | Adds `is_visible` column to patients | Already run |

---

## ✅ Implemented Features (Beta v2.0)

### 1. Multi-Tenant Architecture
- **Junction Table:** `caregiver_patients` table links users to patients
- **Patient Selection:** Users can belong to multiple care circles
- **Admin Roles:** Per-patient admin status (not global)

### 2. Signup Flow
- Fetches `is_visible` patients from Supabase before login
- Users can:
  - **JOIN** an existing public circle (role: Caregiver)
  - **CREATE** a new circle (role: Admin)
  - Type hidden patient name to join private circles
- **Key Functions:** `showLogin()`, `handleSignUp()`

### 3. Collapsible Admin Panel
- Admin Controls section is now collapsible with toggle button
- State persists in localStorage (`adminPanelCollapsed`)
- Contains: Switch Patient, Create Patient, Privacy Settings, Session Timeout, Transfer Admin, Factory Reset

### 4. Patient Switching
- Dropdown in Admin Panel to switch between patient circles
- Last selected patient saved in localStorage (`lastPatientId`)
- Auto-restores on next login

### 5. Session Timeout & Auto-Logout
- Default: 30 minutes of inactivity
- 1-minute countdown warning before logout
- "Stay Logged In" button to extend session
- Admin-adjustable from 10-60 minutes via slider
- Setting saved in localStorage (`sessionTimeoutMinutes`)
- **Key Functions:** `startInactivityTimer()`, `resetInactivityTimer()`, `showLogoutCountdown()`

### 6. Privacy Settings
- Admins can toggle `is_visible` for their patient
- Hidden patients don't appear in signup list
- Users can still join by typing exact name

### 7. Factory Reset (Admin Only)
- Two-step confirmation (double warning)
- Calls `admin_wipe_system()` RPC function
- Deletes all data and auth users
- Requires `ADD_FACTORY_RESET_RPC.sql` to be run first

### 8. Realtime Sync
- Supabase Realtime enabled for all tables
- Changes from other users appear instantly
- No manual refresh needed

---

## 🗄️ Database Schema (Key Tables)

```sql
-- Core Tables
patients (id, name, is_visible, created_at)
caregivers (id, email, name, patient_id, is_admin, hydration_goal, juice_goal, login_count, first_login)
caregiver_patients (id, caregiver_id, patient_id, is_admin, created_at)  -- Junction table

-- Data Tables
medications (id, patient_id, name, dosage, frequency_hours, instructions, is_mandatory, position)
med_logs (id, patient_id, med_id, caregiver_id, administered_at)
hydration_logs (id, patient_id, amount_oz, logged_at)
juice_logs (id, patient_id, amount_oz, logged_at)
bm_logs (id, patient_id, had_bm, notes, logged_at)
messages (id, patient_id, sender_id, sender_name, content, message_type, resolved, created_at)
team_settings (id, patient_id, hydration_goal, juice_goal)
```

---

## 🔧 Key State Variables (main.js)

```javascript
let currentUser = null;           // Supabase auth user
let currentPatientId = null;      // Currently selected patient UUID
let currentPatientName = '';      // Patient display name
let isAdmin = false;              // Admin status for current patient
let availablePatients = [];       // All patients user has access to
let adminPanelCollapsed = false;  // Persisted in localStorage
let inactivityTimeoutMinutes = 30; // Persisted in localStorage
```

---

## 🚀 Deployment Process

1. Make changes to `dist/src/main.js`
2. Update cache buster in `dist/index.html` (e.g., `?v=features_v4`)
3. Verify syntax: `node --check dist/src/main.js`
4. Drag `dist` folder to Netlify
5. Commit & push to GitHub with descriptive message
6. Tag releases: `git tag -a "CareCircle-Beta-vX.X" -m "Description"`

---

## 🐛 Common Issues & Fixes

| Issue | Cause | Fix |
|:------|:------|:----|
| "Loading CareCircle" stuck | JavaScript syntax error | Run `node --check dist/src/main.js` |
| Patients not showing in signup | RLS blocking anonymous | Run `FIX_ANON_ACCESS.sql` |
| Data not syncing between users | Different patient IDs | Check `caregiver_patients` junction table |
| Email verification not received | Supabase email limits / spam | Check spam folder, configure SMTP |

---

## 📋 Next Steps / TODO

1. [ ] Add patient-specific session timeout settings (stored in team_settings)
2. [ ] Improve error handling and user feedback
3. [ ] Add medication scheduling/reminders
4. [ ] Mobile app optimization
5. [ ] Unit/integration testing

---

## 🏷️ Version History

| Version | Date | Changes |
|:--------|:-----|:--------|
| Beta v2.0 | 2026-01-06 | Collapsible Admin Panel, Session Timeout, Auto-Logout, Patient Switching |
| Beta v1.0 | 2026-01-04 | Multi-tenant architecture, Signup flow, Realtime sync |

---

**Use this context to continue development/debugging.**
