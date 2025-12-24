# CareCircle - Medicine Care Team App

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📋 Project Overview

CareCircle is a **mobile-first**, **dark-themed** React Native application designed for clinical and home care teams (up to 5 users) to coordinate medication administration and hydration tracking for a patient. The app provides real-time synchronization across multiple devices, preventing double-dosing and ensuring safe medication management.

### Key Features

✅ **Real-Time Team Synchronization** - Live updates across all 5 caregiver devices  
✅ **Duplicate Dose Prevention** - Deterministic dose window locking to prevent double-dosing  
✅ **Push Notifications** - Team-wide reminders for medication schedules  
✅ **Hydration Tracking** - Shared water intake logs with visual progress indicators  
✅ **Audit Trail** - Complete history of who administered what and when  
✅ **Dark Theme UI** - Eye-friendly interface optimized for 24/7 care environments  
✅ **Offline Mode** - Local-only storage option for environments without internet  

---

## 🏗️ Architecture

### Technology Stack

- **Frontend**: React Native with Expo (v50.0.0)
- **Backend**: Supabase (PostgreSQL + Real-time subscriptions)
- **Authentication**: Supabase Auth with Expo SecureStore
- **Notifications**: Expo Notifications
- **State Management**: React Hooks
- **UI Library**: Lucide React Native Icons
- **Date Utilities**: date-fns

### Project Structure

```
CareCircle/
├── src/
│   ├── components/          # Reusable UI components
│   │   └── MedicationCard.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts       # Authentication logic
│   │   ├── useNotifications.ts  # Push notification setup
│   │   └── useRealtimeMeds.ts   # Real-time medication sync
│   ├── screens/             # Application screens
│   │   └── AddMedication.tsx
│   └── utils/               # Utility functions
│       ├── doseCalc.ts      # Dose window calculations
│       ├── localStorage.ts  # Local-only storage mode
│       ├── supabase.ts      # Supabase client configuration
│       └── teamService.ts   # Team invitation logic
├── supabase/
│   └── setup.sql            # Database schema and RLS policies
├── mockup.html              # Initial UI mockup
├── simulator.html           # Interactive dark theme simulator
├── eas.json                 # Expo Application Services config
├── deployment.md            # Deployment guide
└── requirements.txt         # Original design requirements

```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase account (for online mode)
- iOS Simulator / Android Emulator or physical device

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd "Medicne App"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Choose your deployment mode:**

#### Option A: Online Mode (Real-Time Team Sync)

1. Create a Supabase project at [database.new](https://database.new)
2. Execute the SQL schema from [`supabase/setup.sql`](supabase/setup.sql) in your Supabase SQL Editor
3. Create a `.env` file in the project root:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Configure email authentication in Supabase Dashboard > Authentication > Providers

#### Option B: Offline Mode (Local Storage)

No additional setup required! The app uses [`src/utils/localStorage.ts`](src/utils/localStorage.ts) to store all data locally on the device.

### Running the App

```bash
# Start Expo development server
npm start

# Run on specific platform
npm run android  # Android
npm run ios      # iOS
npm run web      # Web (limited functionality)
```

---

## 📊 Database Schema

The application uses a PostgreSQL database with the following tables:

### Tables

- **`caregivers`** - User profiles (max 5 per team)
- **`medications`** - Medication details, dosage, and schedules
- **`med_logs`** - Dose administration records with caregiver attribution
- **`hydration_logs`** - Water intake tracking

### Key Safety Features

- **Row Level Security (RLS)** - Team members can only access their team's data
- **Unique Constraints** - Prevents duplicate doses for the same time window
- **Real-time Subscriptions** - Instant updates when any team member logs a dose

See [`supabase/setup.sql`](supabase/setup.sql) for complete schema definition.

---

## 🎨 Features & Implementation Status

| Feature | Status | Files |
|---------|--------|-------|
| User Authentication | ✅ Complete | [`useAuth.ts`](src/hooks/useAuth.ts), [`supabase.ts`](src/utils/supabase.ts) |
| Real-time Medication Sync | ✅ Complete | [`useRealtimeMeds.ts`](src/hooks/useRealtimeMeds.ts) |
| Push Notifications | ✅ Complete | [`useNotifications.ts`](src/hooks/useNotifications.ts) |
| Medication Card UI | ✅ Complete | [`MedicationCard.tsx`](src/components/MedicationCard.tsx) |
| Add Medication Screen | ✅ Complete | [`AddMedication.tsx`](src/screens/AddMedication.tsx) |
| Team Invitations | ✅ Complete | [`teamService.ts`](src/utils/teamService.ts) |
| Dose Window Logic | ✅ Complete | [`doseCalc.ts`](src/utils/doseCalc.ts) |
| Local Storage Mode | ✅ Complete | [`localStorage.ts`](src/utils/localStorage.ts) |
| Dark Theme Simulator | ✅ Complete | [`simulator.html`](simulator.html) |
| App Navigation | ✅ Complete | [`App.tsx`](src/App.tsx) |
| Login Screen | ✅ Complete | [`Login.tsx`](src/screens/Login.tsx) |
| Main Dashboard | ✅ Complete | [`Dashboard.tsx`](src/screens/Dashboard.tsx) |
| Medication List | ✅ Complete | [`MedicationList.tsx`](src/screens/MedicationList.tsx) |
| Profile Screen | ✅ Complete | [`Profile.tsx`](src/screens/Profile.tsx) |
| Team Management | ✅ Complete | [`TeamManagement.tsx`](src/screens/TeamManagement.tsx) |
| Hydration Tracking UI | ✅ Complete | [`HydrationTracker.tsx`](src/screens/HydrationTracker.tsx) |
| Settings Screen | ⏳ Planned | - |
| Medication History | ⏳ Planned | - |

---

## 🔐 Security Considerations

- **Secure Token Storage**: Uses Expo SecureStore for persistent authentication
- **Row Level Security**: Supabase RLS policies ensure data isolation between teams
- **Environment Variables**: Sensitive keys stored in `.env` (excluded from git)
- **HTTPS Only**: All API communication encrypted via TLS

---

## 📱 Mobile Build & Deployment

The app is configured for deployment using Expo Application Services (EAS).

### Build for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Set environment secrets
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value <YOUR_URL>
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <YOUR_KEY>

# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production
```

For detailed instructions, see [`deployment.md`](deployment.md).

---

## 🛠️ Development Commands

```bash
# Start development server
npm start

# Run tests (when implemented)
npm test

# Type checking
npx tsc --noEmit

# Format code (configure prettier if needed)
npm run format
```

---

## 📝 Next Steps for Developers

### ✅ Completed Core Features

All core functionality has been implemented! The app is ready for testing and deployment.

### 🚀 Ready to Use

The application now includes:
- ✅ Complete authentication flow with email/password
- ✅ Real-time medication tracking across team devices
- ✅ Hydration tracking with visual progress
- ✅ Team management (up to 5 caregivers)
- ✅ User profile management
- ✅ Dark theme UI optimized for care environments

### 📱 Testing the App

1. **Start the development server:**
   ```bash
   npm start
   ```

2. **Test on device/simulator:**
   - Press `a` for Android
   - Press `i` for iOS
   - Scan QR code with Expo Go app

3. **Test core flows:**
   - Create account and login
   - Add a medication
   - Mark medication as taken
   - Log water intake
   - Invite team members

### 🔧 Optional Enhancements

1. **[ ] Settings Screen**
   - Notification preferences
   - Theme toggle (if light mode needed)
   - Data export options

2. **[ ] Medication History**
   - Audit log screen
   - Filter by date/caregiver/medication
   - Export to CSV/PDF

3. **[ ] Error Handling**
   - Network error boundaries
   - Offline mode detection
   - User-friendly error messages

4. **[ ] Testing**
   - Unit tests for utility functions
   - Integration tests for hooks
   - E2E tests for critical flows

5. **[ ] Onboarding Flow**
   - Welcome screens
   - Feature highlights
   - Initial setup wizard

6. **[ ] Accessibility**
   - Screen reader support
   - High contrast mode
   - Font size adjustments

7. **[ ] Analytics**
   - Track medication adherence
   - Team engagement metrics
   - Error monitoring (Sentry integration)

---

## 🐛 Known Issues

- None reported yet - this is a foundational implementation

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

## 👥 Team

Developed for care teams supporting patient medication management.

---

## 📞 Support

For questions or issues, please review the documentation files:
- [`requirements.txt`](requirements.txt) - Original design requirements
- [`deployment.md`](deployment.md) - Deployment guide
- [`changes.txt`](changes.txt) - Development history

---

**Last Updated**: December 24, 2024
