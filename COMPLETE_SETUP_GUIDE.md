# CareCircle - Complete Setup Guide

This guide provides comprehensive, step-by-step instructions for setting up the CareCircle application, including the Supabase database and Netlify deployment.

## Prerequisites

*   **Node.js**: Version 16 or higher.
*   **Git**: For version control.
*   **Supabase Account**: For the database and backend services.
*   **Netlify Account**: For hosting the web application.
*   **GitHub Account**: For hosting the source code.

## 1. Repository Setup

1.  **Clone the repository**:
    ```bash
    git clone <your-repo-url>
    cd carecircle-template
    ```
    *Note: The main application code is located in the `carecircle-template` directory.*

2.  **Install Dependencies**:
    Navigate to the template directory and install dependencies:
    ```bash
    cd carecircle-template
    npm install
    ```

## 2. Database Setup (Supabase)

1.  **Create a new Supabase Project**:
    *   Log in to [app.supabase.com](https://app.supabase.com).
    *   Click **New Project**.
    *   Select your organization.
    *   Enter a **Name** (e.g., "CareCircle").
    *   Enter a strong **Database Password**.
    *   Select a **Region** close to your users.
    *   Click **Create new project**.

2.  **Get Project Credentials**:
    *   Once the project is created, go to **Project Settings** (gear icon) -> **API**.
    *   Copy the `Project URL` and `anon` public key. You will need these for the next steps.

3.  **Initialize the Database**:
    *   Go to the **SQL Editor** (terminal icon) in the Supabase dashboard sidebar.
    *   Click **New Query**.
    *   Open the file `carecircle-template/database/FINAL_DB_SETUP.sql` from this repository.
    *   Copy the **entire content** of the file.
    *   Paste it into the Supabase SQL Editor.
    *   Click **Run** (bottom right).
    *   *Success Check*: You should see "Success" or "No rows returned" in the results pane.

4.  **Apply Additional Migrations (Optional)**:
    *   If you are using advanced features (like Care Circles) that might have newer migrations not yet consolidated, check the `supabase/migrations` folder in the root of the repository.
    *   Run any SQL files with a timestamp *newer* than the setup script if necessary.

## 3. Local Development Configuration

1.  **Configure Environment Variables**:
    *   In the `carecircle-template` directory, create a `.env` file (copy from `.env.example` if available):
        ```bash
        cp config/.env.example .env
        ```
        *(If `.env.example` is missing, create a new `.env` file)*
    *   Add your Supabase credentials:
        ```env
        VITE_SUPABASE_URL=your_supabase_project_url
        VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
        ```

2.  **Run the Application**:
    ```bash
    npm run dev
    ```
    *   Open your browser to the URL shown (usually `http://localhost:5173`).
    *   Verify you can see the login screen.

## 4. Netlify Deployment

1.  **Connect to GitHub**:
    *   Log in to [Netlify](https://app.netlify.com).
    *   Click **Add new site** -> **Import an existing project**.
    *   Select **GitHub**.
    *   Authorize Netlify to access your GitHub account.
    *   Search for and select your `carecircle-template` repository.

2.  **Configure Build Settings**:
    *   **Base directory**: `carecircle-template`
        *(This is crucial because the app lives inside this subfolder)*
    *   **Build command**: `npm run build:web`
        *(Or `vite build --mode production` if the script name differs)*
    *   **Publish directory**: `carecircle-template/dist`
        *(Vite builds to `dist` by default)*

3.  **Set Environment Variables**:
    *   Click **Show advanced** -> **New variable**.
    *   Add the following variables (copy values from your Supabase project):
        *   Key: `VITE_SUPABASE_URL`
        *   Value: `your_supabase_project_url`
        *   Key: `VITE_SUPABASE_ANON_KEY`
        *   Value: `your_supabase_anon_key`

4.  **Deploy**:
    *   Click **Deploy site**.
    *   Netlify will start the build process. You can view the logs to monitor progress.

5.  **Verify Deployment**:
    *   Once the deploy status is "Published", click the site URL (e.g., `https://your-site-name.netlify.app`).
    *   **Test Login**: Create a new account or log in.
    *   **Test Data**: Add a medication to verify the database connection is working.

## 5. Troubleshooting

*   **"Page Not Found" on Refresh**:
    *   Single Page Apps (SPAs) like this one need a redirect rule.
    *   Ensure a `_redirects` file exists in your `public` folder or `dist` folder with the content: `/* /index.html 200`.
    *   Alternatively, create a `netlify.toml` file in `carecircle-template/` with:
        ```toml
        [[redirects]]
          from = "/*"
          to = "/index.html"
          status = 200
        ```

*   **Database Connection Failed**:
    *   Double-check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Netlify **Site configuration > Environment variables**.
    *   Ensure you didn't accidentally paste extra spaces or quotes.

*   **Build Failed**:
    *   Check the Netlify deploy logs. Common issues include missing dependencies or type errors.
    *   Ensure `npm install` is running in the correct directory (`carecircle-template`).

## 6. GitHub Repository Management

To push your local changes and documentation to GitHub:

```bash
# Stage all changes
git add .

# Commit changes
git commit -m "Add comprehensive setup guide and consolidated database script"

# Push to remote
git push origin main
```
