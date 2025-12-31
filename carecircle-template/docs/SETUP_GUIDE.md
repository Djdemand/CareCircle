# CareCircle Setup Guide

Welcome to CareCircle! This guide will help you set up your own instance of the CareCircle application.

## 📋 Prerequisites

Before you begin, ensure you have the following:

1.  **Node.js (v18 or higher)**
    *   Download: [https://nodejs.org/](https://nodejs.org/)
    *   Verify: Run `node -v` in your terminal

2.  **Supabase Account**
    *   Sign up: [https://supabase.com/](https://supabase.com/)
    *   Free tier is sufficient

3.  **Netlify Account** (for web deployment)
    *   Sign up: [https://www.netlify.com/](https://www.netlify.com/)

## 🚀 Quick Start

1.  **Unzip the Package**
    Extract the `carecircle-template.zip` file to a folder on your computer.

2.  **Run the Setup Script**
    *   **Windows:** Double-click `scripts/setup.bat`
    *   **Mac/Linux:** Open terminal, navigate to the folder, and run `./scripts/setup.sh`

    The script will:
    *   Install dependencies
    *   Ask for your Supabase credentials (see below)
    *   Configure the application
    *   Build the web app

## 🛠️ Manual Setup (Detailed)

If you prefer to set up manually or the script fails:

### 1. Create Supabase Project

1.  Log in to Supabase Dashboard.
2.  Click **"New Project"**.
3.  Enter a name (e.g., "CareCircle") and database password.
4.  Wait for the project to be created (takes ~1-2 minutes).

### 2. Initialize Database

1.  In Supabase Dashboard, go to **SQL Editor** (icon on the left).
2.  Click **"New Query"**.
3.  Open the file `database/setup_database.sql` from this package.
4.  Copy the entire content and paste it into the SQL Editor.
5.  Click **"Run"**.
6.  Verify "Success" message.

### 3. Get Credentials

1.  Go to **Project Settings** (gear icon) > **API**.
2.  Find **Project URL** and **anon public** key.
3.  You will need these for the setup script.

### 4. Configure Application

1.  Copy `config/.env.example` to `.env` in the root directory.
2.  Open `.env` and paste your Supabase URL and Key.
3.  Copy `config/config.js.template` to `web/src/config.js`.
4.  Update `web/src/config.js` with the same credentials.

### 5. Build Web App

Open a terminal in the project folder and run:

```bash
npm install
npm run build:web
```

This will create a `dist` folder ready for deployment.

## 🌐 Deployment

### Deploy to Netlify

1.  Log in to Netlify.
2.  Go to **"Sites"**.
3.  Drag and drop the `dist` folder onto the page.
4.  Your site is now live!

### Configure Netlify Environment

For better security and to ensure everything works:

1.  Go to **Site Settings** > **Environment Variables**.
2.  Add the following variables:
    *   `VITE_SUPABASE_URL`: Your Supabase URL
    *   `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
3.  Trigger a new deploy (or drag the folder again).

## 📱 Mobile App Setup

To run the mobile app:

1.  Install Expo Go on your phone.
2.  Run `npx expo start` in the terminal.
3.  Scan the QR code with your phone.

## 🆘 Troubleshooting

See `docs/TROUBLESHOOTING.md` for common issues and solutions.
