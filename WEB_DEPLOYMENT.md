# CareCircle - Web Deployment Guide for Netlify

## 🎯 Current Status

The CareCircle application has been built as a **React Native/Expo mobile app** with the following completed features:

### ✅ Completed Features
- Full authentication system with Supabase
- Real-time medication tracking
- Team management (up to 5 caregivers)
- Hydration tracking
- Dashboard with stats and activity feed
- All core screens implemented
- Database schema deployed to Supabase
- GitHub repository: https://github.com/Djdemand/CareCircle

## 🌐 Web Deployment Options

### Option 1: Expo Web (Recommended for Quick Deployment)

Expo includes web support out of the box. To deploy using Expo's web build:

1. **Build for web:**
   ```bash
   npm run web
   ```

2. **Export static files:**
   ```bash
   npx expo export:web
   ```

3. **Deploy the `web-build` folder to Netlify**

### Option 2: Use Netlify's Expo/React Native Web Support

Create a `netlify.toml` file (already created) and deploy via GitHub:

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select the CareCircle repository
4. Use these settings:
   - **Build command:** `npx expo export:web`
   - **Publish directory:** `web-build`
   - **Environment variables:**
     - `EXPO_PUBLIC_SUPABASE_URL`: `https://oydyrdcnoygrzjapanbd.supabase.co`
     - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: (from your .env file)

### Option 3: Create a Separate Web-Only Version

For a pure web version without React Native dependencies:

1. Create a new React app:
   ```bash
   npx create-react-app carecircle-web
   cd carecircle-web
   npm install @supabase/supabase-js react-router-dom date-fns
   ```

2. Copy the web-specific components from `src/web/` folder

3. Deploy to Netlify

## 📦 Files Created for Web Deployment

- [`netlify.toml`](netlify.toml) - Netlify configuration
- [`vite.config.ts`](vite.config.ts) - Vite build configuration  
- [`src/web/App.tsx`](src/web/App.tsx) - Web-specific app component
- [`src/web/index.tsx`](src/web/index.tsx) - Web entry point
- [`src/web/screens/Login.tsx`](src/web/screens/Login.tsx) - Web login screen
-[`src/web/screens/Dashboard.tsx`](src/web/screens/Dashboard.tsx) - Web dashboard

## 🚀 Recommended Deployment Steps

### Using Expo Web (Easiest):

1. **Install Expo CLI globally:**
   ```bash
   npm install -g expo-cli
   ```

2. **Export for web:**
   ```bash
   npx expo export:web
   ```

3. **Deploy to Netlify:**
   - Drag and drop the `web-build` folder to Netlify's deploy interface
   - Or use Netlify CLI:
     ```bash
     npm install -g netlify-cli
     cd web-build
     netlify deploy --prod
     ```

### Environment Variables for Netlify:

Set these in Netlify Dashboard → Site settings → Environment variables:

```
EXPO_PUBLIC_SUPABASE_URL=https://oydyrdcnoygrzjapanbd.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95ZHlyZGNub3lncnpqYXBhbmJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTE1MjIsImV4cCI6MjA4MjA2NzUyMn0.lvQkpUe4tSbElwKjUCz75RISH6E59U1JGuYZU9wDuDo
```

## ⚠️ Important Notes

1. **React Native Web Limitations:**
   - Some React Native components don't work perfectly on web
   - The app was designed primarily for mobile
   - Consider creating a simplified web version if full features aren't working

2. **Supabase Configuration:**
   - Ensure real-time replication is enabled in Supabase Dashboard
   - Database → Replication → Enable for: medications, med_logs, hydration_logs

3. **Authentication:**
   - Email auth is already enabled in Supabase  
   - Users can sign up and login via the web interface

## 🐛 Troubleshooting

### Build Errors:
- Clear cache: `rm -rf node_modules .expo && npm install`
- Try: `npx expo start --web` to test locally first

### Deployment Issues:
- Check Netlify build logs for specific errors
- Ensure all environment variables are set correctly
- Verify Supabase URL and keys are correct

## 📱Alternative: Keep as Mobile-Only

Given that this is a **care team coordination app**, you might want to keep it mobile-only:

1. Build with EAS (Expo Application Services):
   ```bash
   npm install -g eas-cli
   eas build --platform android
   eas build --platform ios
   ```

2. Distribute via:
   - Google Play Store (Android)
   - Apple App Store (iOS)
   - Direct APK download for Android
   - TestFlight for iOS testing

## 📚 Additional Resources

- [Expo Web Documentation](https://docs.expo.dev/workflow/web/)
- [Netlify Deployment Guide](https://docs.netlify.com/)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/installing)

## ✅ Next Steps

1. Choose your deployment option (recommend Expo Web for easiest path)
2. Run `npx expo export:web` to create web build
3. Deploy to Netlify via GitHub integration or drag-and-drop
4. Test the deployed app with your Supabase backend
5. Invite your care team to start using it!

---

**Last Updated:** December 24, 2024  
**Repository:** https://github.com/Djdemand/CareCircle
