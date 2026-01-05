# CareCircle Template

![Version](https://img.shields.io/badge/version-4.0B-orange.svg)
![Status](https://img.shields.io/badge/status-BETA-yellow.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**A comprehensive, deployable template for the CareCircle medication management application.**

This package contains everything you need to set up your own instance of CareCircle, a multi-platform application for coordinating care teams.

## 🚀 Version 4.0 Beta Program

This is the **Beta release** of CareCircle v4.0, featuring significant improvements and new functionality currently in testing.

### 🆕 Beta Program Features (v4.0B)

| Feature | Status | Description |
|---------|--------|-------------|
| **Care Circles** | 🧪 Beta | Multi-patient support - manage multiple patients with separate care teams |
| **Patient Switching** | 🧪 Beta | Quick switch between different patient profiles |
| **Enhanced RLS Policies** | 🧪 Beta | Improved Row Level Security for better data isolation |
| **Multitenancy Support** | 🧪 Beta | Complete database restructuring for multi-patient architecture |
| **Production Dist Build** | ✅ Ready | Pre-built dist folder for immediate Netlify deployment |

### ⚠️ Beta Notice

This is a beta release intended for testing purposes. Please report any issues encountered during testing. Production use is not recommended until the stable v4.0 release.

---

## ✨ Features (Stable)

### Medication Management
*   **Medication Tracking:** Schedule, log, and monitor medications with countdown timers
*   **"As Needed" Medications:** Support for PRN medications without overdue alerts
*   **Skip/Take Early:** Flexibility to skip doses or administer early with logging
*   **Mandatory Medications:** Flag critical medications requiring strict adherence
*   **Drag-and-Drop Reordering:** Easily organize medication order

### Health Tracking
*   **Hydration Tracking:** Track water intake with visual glass-filling progress and custom daily goals
*   **Juice Tracking:** Separate juice intake monitor with customizable goals
*   **BM Tracking:** Daily bowel movement logging with health status indicators (Red/Yellow/Flashing alerts)
*   **Midnight Reset:** Automatic daily reset of tracking goals

### Team Collaboration
*   **Real-Time Synchronization:** Live updates across all 15 caregiver devices
*   **Duplicate Dose Prevention:** Smart locking to prevent double-dosing
*   **Team Messaging:** Secure in-app communication with visual alerts
*   **Audit Trail:** Complete history of who administered what and when
*   **Delete Individual Logs:** Remove specific log entries without affecting history

### User Experience
*   **Dark Theme UI:** Eye-friendly interface optimized for 24/7 care environments
*   **Mobile-Friendly:** Enhanced touch targets and responsive layout
*   **Smart "How to Use":** Auto-collapses for experienced users
*   **Push Notifications:** Team-wide reminders for medication schedules

---

## 📂 Package Contents

*   `src/` & `web/`: Complete source code
*   `dist/`: Production-ready build for immediate deployment
*   `database/`: SQL scripts to set up your database instantly
*   `scripts/`: Automated setup tools for Windows, Mac, and Linux
*   `docs/`: Comprehensive guides for every step

## ⚡ Quick Start

1.  **Prerequisites:** Ensure you have Node.js v18+ installed.
2.  **Setup:**
    *   **Windows:** Run `scripts/setup.bat`
    *   **Mac/Linux:** Run `scripts/setup.sh`
3.  **Follow the Wizard:** The script will guide you through configuration.

### Quick Deploy (Web)

```bash
# The dist folder is ready for immediate deployment
# Option 1: Drag and drop dist/ to https://app.netlify.com/drop
# Option 2: Use Netlify CLI
netlify deploy --prod --dir=dist
```

## 📚 Documentation

*   [**Setup Guide**](docs/SETUP_GUIDE.md): Step-by-step installation instructions
*   [**Deployment Guide**](docs/DEPLOYMENT_GUIDE.md): How to publish to Netlify and App Stores
*   [**Database Setup**](docs/DATABASE_SETUP.md): Understanding the data structure
*   [**Patient Switching Guide**](docs/PATIENT_SWITCHING_GUIDE.md): Multi-patient configuration (Beta)
*   [**RLS Fix Guide**](docs/RLS_FIX_MANUAL_GUIDE.md): Row Level Security setup
*   [**Testing Guide**](docs/TESTING_GUIDE.md): Verify your installation
*   [**Troubleshooting**](docs/TROUBLESHOOTING.md): Solutions to common issues

## 🛠️ Tech Stack

*   **Frontend:** React Native (Expo v50.0.0), Vanilla JS (Web)
*   **Backend:** Supabase (PostgreSQL, Auth, Realtime)
*   **Build:** Vite (Web), EAS (Mobile)
*   **Styling:** Tailwind CSS

---

## 📝 Changelog

### Version 4.0B (January 4, 2026) - BETA

**🆕 New Beta Features:**
- 🧪 Care Circles - Multi-patient support
- 🧪 Patient Switching - Quick profile switching
- 🧪 Enhanced RLS Policies - Improved data isolation
- 🧪 Multitenancy Support - Multi-patient architecture
- ✅ Production Dist Build - Ready for immediate deployment

---

**Last Updated**: January 5, 2026
**Version**: 4.0B (Beta)
**Status**: 🧪 Beta Testing

*Generated for CareCircle Distribution*
