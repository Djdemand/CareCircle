# CareCircle Template

![Version](https://img.shields.io/badge/version-v2.1--Beta-orange.svg)
![Status](https://img.shields.io/badge/status-BETA-yellow.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**A comprehensive, deployable template for the CareCircle medication management application.**

This package contains everything you need to set up your own instance of CareCircle, a multi-platform application for coordinating care teams.

## 🚀 Version 2.1 Beta (CareCircle-Beta-v2.1)

This is the latest **Beta release** of CareCircle, featuring the full transition to Multi-Tenant architecture and robust Admin management.

### 🌟 Key New Features (v2.1)

| Feature | Status | Description |
|---------|--------|-------------|
| **Multi-Tenant Architecture** | ✅ Finalized | Full separation of care circles using a junction table system. |
| **Patient Switching** | ✅ Enhanced | Seamlessly switch between patients with automatic Admin/Caregiver role detection. |
| **Admin Rights Transfer** | ✅ Fixed | Transfer full administrator privileges to other team members securely. |
| **Private Care Circles** | ✅ Added | Choose to make patient profiles visible in signup or keep them private/hidden. |
| **Emoji Encoding Fix** | ✅ Fixed | Restored all UI icons and emojis with proper UTF-8 support. |
| **Session Persistence** | ✅ Added | Remembers your last active patient across logins. |

---

## 🛠️ Features (Core)

### Medication Management
*   **Medication Tracking:** Schedule, log, and monitor medications with countdown timers.
*   **"As Needed" Medications:** Support for PRN medications without overdue alerts.
*   **Skip/Take Early:** Flexibility to skip doses or administer early with logging.
*   **Mandatory Medications:** Flag critical medications requiring strict adherence.
*   **Drag-and-Drop Reordering:** Easily organize medication order.

### Health Tracking
*   **Hydration Tracking:** Track water intake with visual glass-filling progress and custom daily goals.
*   **Juice Tracking:** Separate juice intake monitor with customizable goals.
*   **BM Tracking:** Daily bowel movement logging with health status indicators (Red/Yellow/Flashing alerts).
*   **Midnight Reset:** Automatic daily reset of tracking goals.

### Team Collaboration & Multi-Tenancy
*   **Care Circles:** Manage multiple patients with completely separate care teams.
*   **Real-Time Synchronization:** Live updates across all caregiver devices using Supabase Realtime.
*   **Admin Panel:** Collapsible dashboard for managing patient privacy, transfers, and factory resets.
*   **Admin Requests:** Caregivers can request admin rights directly within the app.
*   **Team Messaging:** Secure in-app communication with visual alerts.

### User Experience
*   **Session Timeout:** Admin-adjustable auto-logout (10-60 mins) with a 60-second warning.
*   **Dark Theme UI:** Eye-friendly interface optimized for 24/7 care environments.
*   **Mobile-Friendly:** Enhanced touch targets and responsive layout.
*   **Confetti Celebrations:** Visual rewards for completing signup and key tasks.

---

## 📦 Package Contents

*   `src/`: Complete source code.
*   `dist/`: Production-ready build for immediate deployment (Netlify optimized).
*   `database/`: SQL scripts for junction tables, multi-tenancy, and RLS.
*   `docs/`: Comprehensive guides for setup and management.

## ⚡ Quick Start

1.  **Prerequisites:** Ensure you have a Supabase account and Node.js v18+.
2.  **Configuration:** Update `dist/src/config.js` with your Supabase credentials.
3.  **Deployment:** 
    *   Drag and drop the `dist/` folder to [Netlify Drop](https://app.netlify.com/drop).
    *   Initialize your database using the scripts in the `database/` folder.

## 📄 Documentation

*   [**Setup Guide**](docs/SETUP_GUIDE.md): Step-by-step installation instructions.
*   [**Database Setup**](docs/DATABASE_SETUP.md): Understanding the junction table schema.
*   [**Patient Switching Guide**](docs/PATIENT_SWITCHING_GUIDE.md): Multi-patient configuration.
*   [**RLS Fix Guide**](docs/RLS_FIX_MANUAL_GUIDE.md): Row Level Security setup for multi-tenancy.

## 💻 Tech Stack

*   **Frontend:** Vanilla Javascript (Web), CSS3, Tailwind CSS.
*   **Backend:** Supabase (PostgreSQL, Auth, Realtime, RPC).
*   **Deployment:** Netlify.

---

## 📝 Changelog

### Version 2.1 (January 6, 2026) - CURRENT
- **Fix:** Corrected Admin Transfer logic to update `caregiver_patients` table.
- **Fix:** `handleSwitchPatient` now correctly updates local `isAdmin` state from the junction table.
- **Fix:** Fixed emoji rendering issues (UT8-BOM support).
- **New:** Added privacy toggle (Visible/Hidden) during patient creation.
- **New:** Persisted `lastPatientId` in localStorage.

### Version 2.0 (January 5, 2026)
- **New:** Implemented collapsible Admin Panel.
- **New:** Added Session Timeout with countdown warnings.
- **New:** Multi-tenant junction table integration (`caregiver_patients`).

---

**Last Updated**: January 6, 2026
**Version**: CareCircle-Beta-v2.1
**Status**: ✅ Beta Stable

*Generated for CareCircle Development*
