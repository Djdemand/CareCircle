# CareCircle - Medicine Care Team App

![Version](https://img.shields.io/badge/version-3.3.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📋 Project Overview

CareCircle is a **multi-platform** application designed for clinical and home care teams (up to 15 users) to coordinate medication administration and hydration tracking for a patient. The app provides real-time synchronization across multiple devices, preventing double-dosing and ensuring safe medication management.

### Key Features
  
  ✅ **Real-Time Team Synchronization** - Live updates across all 15 caregiver devices
  ✅ **Duplicate Dose Prevention** - Deterministic dose window locking to prevent double-dosing
  ✅ **Push Notifications** - Team-wide reminders for medication schedules
  ✅ **Hydration Tracking** - Shared water intake logs with visual progress indicators and glass effect
  ✅ **Custom Hydration Goals** - Users can set personalized daily water intake targets (default: 128oz)
  ✅ **"As Needed" Medications** - Mark medications as "As Needed" (frequency = 0) with no overdue status
  ✅ **Skip Dose Functionality** - Skip scheduled doses with logging and timer reset
  ✅ **Delete Individual Logs** - Remove specific medication or hydration log entries
  ✅ **Audit Trail** - Complete history of who administered what and when
  ✅ **Dark Theme UI** - Eye-friendly interface optimized for 24/7 care environments
  ✅ **Web Deployment** - Full-featured web app deployable to Netlify
  ✅ **Mobile App** - React Native/Expo mobile application
  ✅ **Countdown Timer** - Shows time remaining until next dose in hours and minutes
  ✅ **Overdue Status** - Displays overdue medications with red highlighting
  ✅ **Next Dose Time** - Shows exact date and time for next dose
  ✅ **Foreign Key Fixes** - Resolves FK constraints for all users across hydration and medication logging

---

## 🏗️ Architecture

### Technology Stack

**Mobile App:**
- **Frontend**: React Native with Expo (v50.0.0)
- **Authentication**: Supabase Auth with Expo SecureStore
- **Notifications**: Expo Notifications
- **UI Library**: Lucide React Native Icons

**Web App:**
- **Frontend**: Vanilla JavaScript with Tailwind CSS
- **Build Tool**: Vite
- **Deployment**: Netlify
- **Authentication**: Supabase Auth

**Backend (Shared):**
- **Database**: Supabase (PostgreSQL + Real-time subscriptions)
- **State Management**: React Hooks
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
│   │   ├── AddMedication.tsx
│   │   ├── Dashboard.tsx
│   │   ├── HydrationTracker.tsx
│   │   ├── Login.tsx
│   │   ├── MedicationList.tsx
│   │   ├── Profile.tsx
│   │   └── TeamManagement.tsx
│   ├── utils/               # Utility functions
│   │   ├── doseCalc.ts      # Dose window calculations
│   │   ├── localStorage.ts  # Local-only storage mode
│   │   ├── supabase.ts      # Supabase client configuration
│   │   └── teamService.ts   # Team invitation logic
│   └── web/                # Web-specific components
│       ├── App.tsx
│       ├── index.tsx
│       ├── screens/
│       │   ├── Dashboard.tsx
│       │   └── Login.tsx
│       ├── hooks/
│       │   └── useWebNavigation.ts
│       └── utils/
│           └── supabase.ts
├── web/
│   ├── index.html           # Web app entry point
│   ├── src/
│   │   ├── config.js       # Supabase configuration
│   │   └── main.js         # Main application logic
│   └── README.md           # Web-specific documentation
├── supabase/
│   ├── setup.sql            # Database schema and RLS policies
│   └── migrations/          # Database migrations
├── dist/                   # Production build output (for Netlify)
├── mockup.html            # Initial UI mockup
├── simulator.html          # Interactive dark theme simulator
├── eas.json               # Expo Application Services config
├── vite.config.ts         # Vite build configuration
├── netlify.toml           # Netlify deployment configuration
├── package.json            # Project dependencies
└── requirements.txt        # Original design requirements

```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`) - for mobile app
- Supabase account (for online mode)
- iOS Simulator / Android Emulator or physical device (for mobile)
- Modern web browser (for web app)

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

**Mobile App:**
```bash
# Start Expo development server
npm start

# Run on specific platform
npm run android  # Android
npm run ios      # iOS
```

**Web App:**
```bash
# Development server
npm run dev:web

# Build for production
npm run build:web

# Preview production build
npm run preview:web
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
| Edit Medication | ✅ Complete | [`main.js`](web/src/main.js) |
| Delete Medication | ✅ Complete | [`main.js`](web/src/main.js) |
| "As Needed" Medications | ✅ Complete | [`main.js`](web/src/main.js) |
| Skip Dose Functionality | ✅ Complete | [`main.js`](web/src/main.js) |
| Custom Hydration Goals | ✅ Complete | [`main.js`](web/src/main.js) |
| Delete Individual Logs | ✅ Complete | [`main.js`](web/src/main.js) |
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
| Glass Hydration Animation | ✅ Complete | [`main.js`](web/src/main.js) |
| Countdown Timer | ✅ Complete | [`main.js`](web/src/main.js) |
| Overdue Status | ✅ Complete | [`main.js`](web/src/main.js) |
| Next Dose Time Display | ✅ Complete | [`main.js`](web/src/main.js) |
| Foreign Key Constraint Fixes | ✅ Complete | [`main.js`](web/src/main.js) |
| Settings Screen | ⏳ Planned | - |
| Medication History | ⏳ Planned | - |

---

## 🔐 Security Considerations

- **Secure Token Storage**: Uses Expo SecureStore for persistent authentication
- **Row Level Security**: Supabase RLS policies ensure data isolation between teams
- **Environment Variables**: Sensitive keys stored in `.env` (excluded from git)
- **HTTPS Only**: All API communication encrypted via TLS

---

## 🌐 Web Deployment

The web app is ready for deployment to Netlify with all features working.

## 🎯 Recommended Features for Future Consideration

### 1. Enhanced Medication Management
- **Medication Reminders**: Push notifications for upcoming doses
- **Medication Interactions**: Check for drug interactions between medications
- **Refill Alerts**: Notify when medication supply is running low
- **Medication History Export**: Export medication history to PDF/CSV
- **Custom Dosage Schedules**: Different dosages for different times of day

### 2. Advanced Hydration Tracking
- **Hydration Goals**: Customizable daily goals based on weight/activity
- **Hydration Reminders**: Scheduled reminders throughout the day
- **Beverage Tracking**: Track different types of beverages (water, juice, tea)
- **Hydration Charts**: Visual charts showing hydration patterns over time

### 3. Team Collaboration Features
- **Task Assignment**: Assign specific medications to specific caregivers
- **Shift Scheduling**: Support for rotating caregiver shifts
- **Caregiver Performance Metrics**: Track response times and accuracy
- **Secure Messaging**: In-app messaging between team members

### 4. Patient Safety Features
- **Allergy Alerts**: Warn about medication allergies
- **Emergency Contacts**: Quick access to emergency contacts
- **Vital Signs Integration**: Track blood pressure, heart rate alongside medications
- **Fall Detection**: Integration with wearable devices for fall alerts

### 5. Reporting & Analytics
- **Compliance Reports**: Track medication adherence over time
- **Caregiver Activity Logs**: Detailed audit trail of all actions
- **Patient Health Trends**: Visual graphs showing health improvements
- **Export to EHR**: Integration with Electronic Health Records

### 6. User Experience Improvements
- **Dark Mode**: System-wide dark theme support
- **Accessibility**: WCAG 2.1 AA compliance for screen readers
- **Multi-language Support**: Spanish, French, German, etc.
- **Offline Mode**: Basic functionality without internet connection

### Quick Deploy to Netlify

```bash
# Build the web app
npm run build:web

# Deploy the dist folder to Netlify
# Option 1: Drag and drop the dist folder to https://app.netlify.com/drop
# Option 2: Connect GitHub repository to Netlify for automatic deployments
```

### Build Output

The build process creates a `dist/` folder containing:
- `index.html` - Main HTML file
- `config.js` - Supabase configuration
- `main.js` - Complete application logic

For detailed deployment instructions, see [`NETLIFY_DEPLOYMENT_GUIDE.md`](NETLIFY_DEPLOYMENT_GUIDE.md).

## 📱 Mobile Build & Deployment

The mobile app is configured for deployment using Expo Application Services (EAS).

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
- ✅ Add, edit, and delete medications
- ✅ **"As Needed" medications** - Mark medications as "As Needed" (frequency = 0) with no overdue status or countdown timers
- ✅ **Skip Dose functionality** - Skip scheduled doses with logging and timer reset
- ✅ **Custom Hydration Goals** - Users can set personalized daily water intake targets (default: 128oz, range: 1-256oz)
- ✅ **Delete Individual Logs** - Remove specific medication or hydration log entries without deleting entire records
- ✅ Hydration tracking with glass filling animation
- ✅ Team management (up to 15 caregivers)
- ✅ User profile management
- ✅ Dark theme UI optimized for care environments
- ✅ Countdown timer showing time until next dose
- ✅ Overdue status with red highlighting for late medications
- ✅ Next dose time display with date and time
- ✅ Foreign key constraint fixes for all users (hydration and medication logging)
- ✅ Retroactive medication logging (Log Past Dose)
- ✅ Secure in-app messaging
- ✅ Medication history export (CSV)
- ✅ Login counter with auto-collapsing user guide
- ✅ Enhanced privacy (hidden emails)
- ✅ Date/Time picker for retroactive logging
- ✅ Show/Hide password toggle
- ✅ Enter key support for login

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
- [`deployment.md`](deployment.md) - Mobile deployment guide
- [`NETLIFY_DEPLOYMENT_GUIDE.md`](NETLIFY_DEPLOYMENT_GUIDE.md) - Web deployment guide
- [`changes.txt`](changes.txt) - Development history

---

**Last Updated**: December 26, 2025
**Version**: 3.3.0
**Status**: ✅ Production Ready
