# Database Setup Guide

CareCircle uses Supabase (PostgreSQL) for data storage and authentication. This guide explains how to set up and manage your database.

## 🗄️ Schema Overview

The database consists of the following tables:

1.  **`caregivers`**: User profiles linked to Supabase Auth.
2.  **`medications`**: Stores medication details (name, dosage, frequency).
3.  **`med_logs`**: Records of administered doses.
4.  **`hydration_logs`**: Records of water intake.
5.  **`juice_logs`**: Records of juice intake.
6.  **`bm_logs`**: Records of bowel movements.
7.  **`team_settings`**: Global settings for the care team (goals).
8.  **`messages`**: Team chat messages.

## 🚀 Initial Setup

1.  **Open SQL Editor**
    In your Supabase Dashboard, navigate to the **SQL Editor** tab.

2.  **Run Setup Script**
    *   Open `database/setup_database.sql` from the project files.
    *   Copy the entire content.
    *   Paste it into the SQL Editor.
    *   Click **Run**.

    This script will:
    *   Enable necessary extensions (UUID).
    *   Create all tables.
    *   Set up Row Level Security (RLS) policies.
    *   Insert default team settings.

## 🔒 Security (RLS)

Row Level Security (RLS) is enabled on all tables to ensure data privacy.

*   **Current Policy:** "Team Access"
*   **Behavior:** All authenticated users (caregivers) have full read/write access to all tables.
*   **Note:** This template is configured for a single care team. If you plan to support multiple independent teams, you will need to modify the RLS policies to filter by a `team_id`.

## 🛠️ Common Operations

### Resetting Data

To clear all logs (e.g., for testing):

```sql
TRUNCATE med_logs, hydration_logs, juice_logs, bm_logs, messages;
```

### Adding a New Admin

By default, the first user is not an admin. To make a user an admin manually:

1.  Go to **Table Editor** > **caregivers**.
2.  Find the user.
3.  Check the `is_admin` box.
4.  Click **Save**.

## ⚠️ Troubleshooting

*   **"relation does not exist"**: Ensure you ran the setup script successfully.
*   **"permission denied"**: Check if RLS policies are active and you are logged in.
*   **UUID errors**: Ensure the `uuid-ossp` extension is enabled (included in setup script).
