# Netlify Deployment Guide for CareCircle

This guide provides step-by-step instructions for deploying the CareCircle Medicine Care Team App to Netlify with proper authentication and configuration.

## Prerequisites

- A Netlify account (free tier works)
- A Supabase project with authentication enabled
- Git repository with your code (GitHub, GitLab, or Bitbucket)
- **IMPORTANT**: Database tables must be created in Supabase (see Database Setup section below)

## Quick Start

### 0. Database Setup (CRITICAL - Must Do First!)

**Before deploying, you MUST create the database tables in Supabase:**

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (in the left sidebar)
4. Copy the entire contents of `supabase/setup.sql` file
5. Paste it into the SQL Editor
6. Click **"Run"** to execute the SQL script

This will create the following tables:
- `caregivers` - Store caregiver profiles
- `medications` - Store medication information
- `med_logs` - Track medication doses
- `hydration_logs` - Track hydration measurements

**Without this step, you will get errors like: "Could not find table 'public.medications' in schema cache"**

### 1. Prepare Your Repository

Ensure your repository contains:
- `netlify.toml` configuration file
- `vite.config.ts` build configuration
- `web/` directory with your web application
- `web/src/config.js` configuration file (contains Supabase credentials)

### 2. Configure Supabase Credentials

**CRITICAL STEP**: You must configure Supabase credentials in the `web/src/config.js` file for authentication to work.

#### Edit `web/src/config.js`:

```javascript
const SUPABASE_CONFIG = {
  URL: 'https://your-project.supabase.co',  // Your Supabase project URL
  ANON_KEY: 'your-anon-key-here'           // Your Supabase anon/public key
};
```

You can find these values in your Supabase dashboard:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Settings** > **API**
4. Copy the **Project URL** and **anon/public** key

### 3. Deploy to Netlify

#### Option A: Drag and Drop (Simplest)

1. Run the build command locally:
   ```bash
   npm run build:web
   ```

2. Navigate to the `dist` folder in your project directory

3. Drag and drop the entire `dist` folder to Netlify's deploy page at https://app.netlify.com/drop

**Exact path to drag:**
```
c:/Users/Admin/Desktop/Programming/Medicne App/dist
```

#### Option B: Connect Git Repository (Recommended)

1. In Netlify dashboard, click **"Add new site"** > **"Import an existing project"**
2. Connect your Git provider (GitHub, GitLab, or Bitbucket)
3. Select your repository
4. Configure build settings:
   - **Build command**: `npm run build:web`
   - **Publish directory**: `dist`
   - **Node version**: `18` (already configured in `netlify.toml`)
5. Click **"Deploy site"**

#### Option C: Deploy via Netlify CLI

```bash
# Install Netlify CLI (if not already installed)
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize Netlify
netlify init

# Deploy
netlify deploy --prod
```

## Authentication Setup

### Supabase Configuration

1. **Enable Email Authentication**:
   - Go to your Supabase project dashboard
   - Navigate to **Authentication** > **Providers**
   - Enable **Email** provider
   - Configure email settings (SMTP or use Supabase's default)

2. **Configure Redirect URLs**:
   - In Supabase dashboard, go to **Authentication** > **URL Configuration**
   - Add your Netlify site URL to **Site URL**
   - Add your Netlify site URL to **Redirect URLs**
   - Example: `https://your-site-name.netlify.app`

3. **Set Up Database Tables**:
   Run the SQL setup script in `supabase/setup.sql` to create required tables:
   - `medications` - Store medication information
   - `caregivers` - Store caregiver profiles
   - `med_logs` - Track medication doses

### Testing Authentication

After deployment:

1. Visit your Netlify site
2. Click **"Don't have an account? Sign Up"**
3. Enter email and password
4. Check your email for verification link
5. Verify your account
6. Sign in with your credentials

### ⚠️ Important: Email Redirect Configuration

If your email verification link redirects to `localhost:3000` instead of your Netlify site, you need to update your Supabase settings:

1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Set **Site URL** to your Netlify URL (e.g., `https://your-site.netlify.app`)
3. Add your Netlify URL to **Redirect URLs**
4. Click **Save**

## Troubleshooting

### Issue: "Could not find table 'public.medications' in schema cache"

**Solution**: Database tables haven't been created yet. You MUST run the SQL setup script:

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (in left sidebar)
4. Copy entire contents of `supabase/setup.sql` file
5. Paste it into SQL Editor
6. Click **"Run"** to execute the SQL script

This will create all required tables: `caregivers`, `medications`, `med_logs`, `hydration_logs`

### Issue: "Supabase configuration missing" error

**Solution**: Ensure Supabase credentials are configured in `web/src/config.js`:
- Open `web/src/config.js`
- Verify `URL` and `ANON_KEY` are set correctly
- Rebuild and redeploy: `npm run build:web`

### Issue: Build fails

**Solution**: Check the build logs in Netlify:
- Ensure Node.js version 18 is being used
- Verify all dependencies are installed
- Check for any build errors in the logs

### Issue: Authentication not working

**Solution**: 
1. Verify Supabase credentials are correct in `config.js`
2. Check Supabase dashboard for authentication logs
3. Ensure redirect URLs are configured in Supabase
4. Clear browser cache and cookies
5. Check browser console for errors

### Issue: White screen after deployment

**Solution**:
1. Check browser console for JavaScript errors
2. Verify the build completed successfully
3. Ensure all assets are properly loaded
4. Check that Supabase CDN is accessible

## Configuration Files

### `web/src/config.js`

This file contains your Supabase credentials. It's included in the build and deployed to Netlify.

```javascript
const SUPABASE_CONFIG = {
  URL: 'https://your-project.supabase.co',
  ANON_KEY: 'your-anon-key-here'
};
```

**Security Note**: This file contains sensitive credentials. While it's necessary for the app to work, consider:
- Using Row Level Security (RLS) in Supabase
- Rotating your keys periodically
- Monitoring authentication logs

### `netlify.toml`

Configuration for Netlify deployment:

```toml
[build]
  command = "npm run build:web"
  publish = "dist"
  
[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Build Configuration

The project uses Vite for building:

- **Entry point**: `web/index.html`
- **Source directory**: `web/src/`
- **Output directory**: `dist/`
- **Build command**: `npm run build:web`
- **Dev server**: `npm run dev:web`

The build process:
1. Runs Vite build in production mode
2. Bundles JavaScript and assets
3. Copies `config.js` to dist folder
4. Creates optimized production files

## Security Best Practices

1. **Never commit sensitive credentials** to version control (`.env` files are in `.gitignore`)
2. **Use Row Level Security (RLS)** in Supabase to protect your data
3. **Rotate your Supabase keys** periodically
4. **Enable email verification** for new user signups
5. **Use HTTPS** (Netlify provides this automatically)
6. **Monitor authentication logs** in Supabase dashboard
7. **Keep dependencies updated** to avoid security vulnerabilities

## Performance Optimization

The `netlify.toml` file includes caching headers for:

- `/assets/*` - Static assets (images, fonts)
- `/*.js` - JavaScript files
- `/*.css` - CSS files

These are cached for 1 year (31536000 seconds) to improve load times.

## Continuous Deployment

With Git integration, Netlify will automatically:

1. Detect new commits to your repository
2. Trigger a new build
3. Deploy the updated site
4. Provide a deploy preview for pull requests

## Support

For issues or questions:

1. Check the [Netlify documentation](https://docs.netlify.com/)
2. Check the [Supabase documentation](https://supabase.com/docs)
3. Review the browser console for errors
4. Check Netlify build logs
5. Check Supabase authentication logs

## Additional Resources

- [Netlify Build Configuration](https://docs.netlify.com/configure-builds/file-based-configuration/)
- [Vite Configuration](https://vitejs.dev/config/)
- [Supabase Authentication](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
