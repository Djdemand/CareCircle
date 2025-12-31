# Deployment Guide

This guide covers how to deploy the CareCircle application to production.

## 🌐 Web Deployment (Netlify)

We recommend Netlify for hosting the web application. It's free, fast, and easy to use.

### Option 1: Drag & Drop (Easiest)

1.  **Build the Project**
    Run the setup script or execute:
    ```bash
    npm run build:web
    ```
    This creates a `dist` folder in your project directory.

2.  **Deploy**
    *   Log in to [Netlify](https://app.netlify.com/).
    *   Go to the **Sites** tab.
    *   Drag the `dist` folder into the "Drag and drop your site output folder here" area.

3.  **Configure Environment**
    *   Go to **Site configuration** > **Environment variables**.
    *   Click **Add a variable**.
    *   Add `VITE_SUPABASE_URL` with your project URL.
    *   Add `VITE_SUPABASE_ANON_KEY` with your anon key.

### Option 2: Git Integration (Recommended for Updates)

1.  **Push to GitHub/GitLab/Bitbucket**
    Create a repository and push your code.

2.  **Connect to Netlify**
    *   In Netlify, click **"Add new site"** > **"Import from an existing project"**.
    *   Connect your Git provider and select the repository.

3.  **Configure Build Settings**
    *   **Build command:** `npm run build:web`
    *   **Publish directory:** `dist`

4.  **Add Environment Variables**
    *   Click **"Show advanced"** or go to Site Settings after creation.
    *   Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

5.  **Deploy**
    Click **"Deploy site"**.

## 📱 Mobile Deployment (Expo)

To publish the mobile app to the Apple App Store and Google Play Store, you'll use EAS (Expo Application Services).

### Prerequisites

1.  **Expo Account:** Sign up at [expo.dev](https://expo.dev/).
2.  **EAS CLI:** Install globally:
    ```bash
    npm install -g eas-cli
    ```
3.  **Login:**
    ```bash
    eas login
    ```

### Configuration

1.  **Configure Project**
    ```bash
    eas build:configure
    ```

2.  **Set Secrets**
    Upload your Supabase credentials to EAS:
    ```bash
    eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "YOUR_URL"
    eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_KEY"
    ```

### Build for Stores

1.  **Android Build**
    ```bash
    eas build --platform android --profile production
    ```

2.  **iOS Build**
    ```bash
    eas build --platform ios --profile production
    ```

3.  **Submit**
    Follow the [Expo Submission Guide](https://docs.expo.dev/submit/introduction/) to upload your binaries to the stores.

## 🔄 Updates

*   **Web:** Simply rebuild and drag-and-drop the `dist` folder again, or push changes to Git.
*   **Mobile (OTA):** For small JavaScript changes, you can publish an update without a new store build:
    ```bash
    eas update
    ```
