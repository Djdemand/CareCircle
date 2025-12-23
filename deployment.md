# CareCircle Cloud Deployment Strategy

This guide provides step-by-step instructions for deploying CareCircle to production, including backend setup, mobile builds, and distribution to caregivers.

---

## Prerequisites

Before starting deployment, ensure you have:

- [ ] Node.js v18+ installed
- [ ] npm or yarn package manager
- [ ] Git installed and configured
- [ ] Expo account (free tier available)
- [ ] Supabase account (free tier available)
- [ ] Apple Developer Account ($99/year - for iOS deployment)
- [ ] Google Play Developer Account ($25 one-time - for Android deployment)

---

## Phase 1: Backend Deployment (Supabase)

### 1.1 Create Supabase Project

1. **Navigate to Supabase**: Go to [database.new](https://database.new)
2. **Sign up/Login**: Use your email or GitHub account
3. **Create New Project**:
   - Project Name: `carecircle-production`
   - Database Password: Generate a strong password (save it securely!)
   - Region: Choose closest to your users
   - Plan: Start with Free tier (1GB database, 50MB file storage)

### 1.2 Execute Database Schema

1. Navigate to **SQL Editor** in Supabase Dashboard
2. Create a new query
3. Copy the entire contents of [`./supabase/setup.sql`](./supabase/setup.sql)
4. Paste into the SQL Editor
5. Click **Run** to execute
6. Verify tables are created in **Table Editor**

Expected tables:
- `caregivers`
- `medications`
- `med_logs`
- `hydration_logs`

### 1.3 Configure Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates (optional):
   - Customize confirmation email
   - Add app branding
4. Enable **Email Confirmations** if required

### 1.4 Capture API Credentials

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon/Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. **IMPORTANT**: Keep these secure! Never commit to git.

### 1.5 Enable Real-time (if not already enabled)

1. Go to **Database** → **Replication**
2. Enable replication for tables:
   - `medications`
   - `med_logs`
   - `hydration_logs`
3. This allows real-time subscriptions across caregiver devices

---

## Phase 2: Mobile Build Pipeline (Expo Application Services)

### 2.1 Install EAS CLI

```bash
npm install -g eas-cli
```

### 2.2 Login to Expo

```bash
eas login
```

If you don't have an account:
```bash
eas whoami  # Check if logged in
```

### 2.3 Configure EAS Build

```bash
eas build:configure
```

This creates/updates [`eas.json`](./eas.json) with build profiles.

### 2.4 Set Environment Secrets

Store Supabase credentials securely in Expo:

```bash
# Set Supabase URL
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value https://your-project.supabase.co

# Set Supabase Anon Key
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value your-anon-key
```

Verify secrets are set:
```bash
eas secret:list
```

### 2.5 Build for Android

**Preview Build (APK for testing):**
```bash
eas build --platform android --profile preview
```

**Production Build (AAB for Google Play):**
```bash
eas build --platform android --profile production
```

Build takes 10-20 minutes. You'll receive a download link when complete.

### 2.6 Build for iOS

**Prerequisites:**
- Enroll in Apple Developer Program ($99/year)
- Add Apple credentials to Expo:
  ```bash
  eas credentials
  ```

**Preview Build (Simulator):**
```bash
eas build --platform ios --profile preview
```

**Production Build (App Store):**
```bash
eas build --platform ios --profile production
```

---

## Phase 3: Distribution

### 3.1 Internal Testing (Recommended First Step)

**For Android:**
1. Download the APK from EAS build output
2. Transfer to caregiver devices via email/cloud storage
3. Enable "Install from Unknown Sources" on Android devices
4. Install APK directly

**For iOS:**
1. Use **TestFlight** for internal testing
2. Upload build to App Store Connect:
   ```bash
   eas submit --platform ios --latest
   ```
3. Create internal test group in App Store Connect
4. Invite caregivers via email

### 3.2 Google Play Console Deployment

1. **Create App**:
   - Go to [Google Play Console](https://play.google.com/console)
   - Create new app
   - Fill out app details

2. **Upload Build**:
   - Download AAB file from EAS
   - Upload to **Production** or **Internal Testing** track

3. **Complete Store Listing**:
   - App icon (512x512 PNG)
   - Screenshots (at least 2)
   - Description (from README.md)
   - Privacy policy URL

4. **Submit for Review** (1-7 days)

### 3.3 Apple App Store Deployment

1. **Create App in App Store Connect**:
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Create new iOS app
   - Bundle ID: `com.yourcompany.carecircle`

2. **Upload Build**:
   ```bash
   eas submit --platform ios --latest
   ```
   
   Or use Xcode Transporter for manual upload

3. **Complete App Information**:
   - App icon (1024x1024 PNG)
   - Screenshots (iPhone and iPad)
   - Description and keywords
   - Privacy policy

4. **Submit for Review** (1-3 days typically)

---

## Phase 4: Over-the-Air (OTA) Updates

Expo allows instant updates without app store approval for non-native code changes.

### 4.1 Configure EAS Update

```bash
eas update:configure
```

### 4.2 Publish an Update

```bash
# Publish to production channel
eas update --branch production --message "Fixed medication reminder bug"
```

### 4.3 What Can Be Updated via OTA:

✅ JavaScript/TypeScript code  
✅ React components and screens  
✅ UI styling and colors  
✅ Business logic  

❌ Native dependencies (require new build)  
❌ Expo SDK version changes  
❌ App permissions  

---

## Phase 5: CI/CD Automation (Optional but Recommended)

### 5.1 GitHub Actions Setup

Create `.github/workflows/build.yml`:

```yaml
name: EAS Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build preview
        run: eas build --platform android --profile preview --non-interactive
```

Store `EXPO_TOKEN` in GitHub Secrets.

### 5.2 Automated OTA Deployments

Automatically publish updates on merge to main:

```yaml
- name: Publish update
  run: eas update --branch production --message "${{ github.event.head_commit.message }}"
```

---

## Phase 6: Monitoring & Maintenance

### 6.1 Error Tracking

**Integrate Sentry:**

```bash
npm install @sentry/react-native
```

Configure in `App.tsx`:
```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'your-sentry-dsn',
  enableAutoSessionTracking: true,
});
```

### 6.2 Database Backups

**Supabase Free Tier**: Manual backups via dashboard  
**Supabase Pro ($25/mo)**: Automated daily backups with point-in-time recovery

To download manual backup:
1. Go to **Database** → **Backups**
2. Click **Download** for latest backup
3. Store securely

### 6.3 Performance Monitoring

Monitor using Supabase Dashboard:
- Database query performance
- API request rates
- Real-time connection count
- Storage usage

### 6.4 User Feedback

Set up in-app feedback:
```bash
npm install react-native-in-app-review
```

Prompt for reviews after successful medication logs.

---

## Next Steps for Production Readiness

### Immediate (Before First User Deployment)

- [ ] **Create production Supabase project** and execute schema
- [ ] **Set up environment secrets** in EAS
- [ ] **Build preview APK** for internal testing with 5 caregivers
- [ ] **Test all critical flows**:
  - [ ] User registration and login
  - [ ] Add medication
  - [ ] Log dose (test duplicate prevention)
  - [ ] Verify real-time sync across 2+ devices
  - [ ] Push notification delivery
  - [ ] Hydration tracking
- [ ] **Gather caregiver feedback** and iterate
- [ ] **Create privacy policy** (required for app stores)
- [ ] **Design app icon** (1024x1024 for iOS, 512x512 for Android)
- [ ] **Capture screenshots** on real devices

### Short-term (1-2 Weeks)

- [ ] **Complete missing screens**:
  - [ ] Main Dashboard (`src/screens/Dashboard.tsx`)
  - [ ] Login Screen (`src/screens/Login.tsx`)
  - [ ] Medication List (`src/screens/MedicationList.tsx`)
  - [ ] Settings Screen (`src/screens/Settings.tsx`)
- [ ] **Set up navigation** with React Navigation
- [ ] **Implement error boundaries** for production stability
- [ ] **Add loading states** for all async operations
- [ ] **Configure app icon and splash screen**:
  ```bash
  npx expo install expo-splash-screen
  ```
- [ ] **Test on both iOS and Android** devices

### Medium-term (1 Month)

- [ ] **App Store submission**:
  - [ ] Complete store listings
  - [ ] Submit to Google Play
  - [ ] Submit to Apple App Store
- [ ] **Set up analytics** (Firebase or Amplitude)
- [ ] **Implement Sentry** for crash reporting
- [ ] **Add unit tests** for critical functions
- [ ] **Document API** for future developers
- [ ] **Create user onboarding flow**

### Long-term (Ongoing)

- [ ] **Monitor user feedback** and ratings
- [ ] **Track medication adherence metrics**
- [ ] **Implement requested features** from caregivers
- [ ] **Regular security audits** of Supabase RLS policies
- [ ] **Optimize performance** based on real usage data
- [ ] **Scale Supabase plan** if needed (monitor database size)
- [ ] **Implement accessibility features** (screen readers, high contrast)
- [ ] **Consider internationalization** if expanding to other regions

---

## Troubleshooting

### Build Fails on EAS

1. Check build logs in Expo dashboard
2. Verify all dependencies are compatible with Expo SDK 50
3. Ensure environment secrets are set correctly

### Real-time Not Working

1. Verify Supabase Replication is enabled for tables
2. Check network connectivity
3. Review RLS policies in Supabase

### Push Notifications Not Delivering

1. Verify Expo push token is being registered
2. Check device notification permissions
3. Test with Expo push notification tool

### App Rejected by Store

**Common reasons:**
- Missing privacy policy
- Incomplete metadata
- Crashes on review device
- Missing required screenshots

---

## Cost Breakdown

| Service | Free Tier | Paid Option | Notes |
|---------|-----------|-------------|-------|
| Supabase | 500MB DB, 1GB storage | $25/mo Pro | Start with free |
| Expo EAS | 30 builds/month | $29/mo Production | Free tier sufficient initially |
| Apple Developer | N/A | $99/year | Required for iOS |
| Google Play | N/A | $25 one-time | Required for Android |
| Sentry | 5K errors/month | $26/mo Team | Free tier adequate |

**Estimated Monthly Cost**: $0-50 (excluding Apple/Google one-time fees)

---

## Security Checklist

- [ ] All Supabase credentials stored in environment secrets (never in code)
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] HTTPS enforced for all API calls
- [ ] User authentication required for all sensitive operations
- [ ] Team size limited to 5 caregivers in business logic
- [ ] Input validation on all medication entry forms
- [ ] Rate limiting configured in Supabase (if needed)

---

## Support & Resources

- **Expo Documentation**: https://docs.expo.dev
- **Supabase Documentation**: https://supabase.com/docs
- **React Native Documentation**: https://reactnative.dev
- **EAS Build Guide**: https://docs.expo.dev/build/introduction/

---

**Last Updated**: December 23, 2024  
**Deployment Status**: Ready for Phase 1 (Backend Setup)
