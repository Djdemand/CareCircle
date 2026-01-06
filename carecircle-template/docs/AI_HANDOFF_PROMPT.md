# 🤖 AI Handoff Prompt - CareCircle Original Version

> **📅 Document Created:** January 4, 2026
> **Status:** Historical Reference (Original Version)

**Role:** You are an expert Full Stack Developer continuing work on "CareCircle," a multi-tenant caregiver web application using Supabase (PostgreSQL) and Vanilla JS.

---

## ⚠️ IMPORTANT NOTE

**This document describes the ORIGINAL version of CareCircle.**

For the latest Beta v2.0 version with all new features, see:
`carecircle-template/AI_HANDOFF_PROMPT.md`

---

## 📝 Context & Original Features

This was the initial refactor phase of CareCircle focusing on multi-tenant data isolation.

### 1. Database Consolidation (Fixed)
- **Issue:** Users were creating duplicate "My Care Circle" patients upon signup, leading to split databases.
- **Fix:** Consolidated users onto a SINGLE patient ID.
- **Fix:** Updated `handleSignUp` and `caregiver_patients` table to enforce proper joining logic.

### 2. Signup Flow (Implemented)
- The signup screen fetches `is_visible` patients from Supabase.
- **Logic:**
  - User can select an existing public circle to **JOIN** (role: Caregiver).
  - User can select "Create New" to **CREATE** a new patient (role: Admin).
  - User can type a hidden patient name to join private circles.
- **Key Functions:** `showLogin`, `handleSignUp` in `src/main.js`

### 3. Admin Controls (Basic)
- Added a "Privacy Settings" toggle in the Dashboard.
- Toggles the `patients.is_visible` column.
- Admins can hide their patient from the public signup list.

### 4. Realtime Sync (Enabled)
- Supabase Realtime is enabled for all tables (`med_logs`, `messages`, etc.).
- Changes made by one user instantly reflect on other logged-in users' screens.

---

## 📂 Key Files & Locations

**Working Directory:** `C:\Users\Admin\Desktop\Programming\Medicne App\carecircle-template\dist`

| File | Purpose | Notes |
|:-----|:--------|:------|
| `src/main.js` | **MAIN LOGIC**. Auth, Dashboard, Realtime, Signup. | Primary focus for updates. |
| `index.html` | Entry point. CSS animations and layout. | |
| `ADD_PATIENT_VISIBILITY.sql` | SQL to add visibility column. | Already run. |
| `RESET_ALL_DATA.sql` | SQL to wipe DB for testing. | |
| `ENABLE_REALTIME.sql` | SQL to enable replication. | Already run. |

---

## 🚧 Features NOT in Original Version

The following features were added in Beta v2.0 and are **NOT** in this original version:

- ❌ Collapsible Admin Panel
- ❌ Session Timeout / Auto-Logout
- ❌ Patient Switching dropdown
- ❌ Last Patient Memory (localStorage)
- ❌ Factory Reset button in UI
- ❌ Session timeout slider (10-60 min)

---

**For current development, use the Beta v2.0 AI Handoff document in the root folder.**
