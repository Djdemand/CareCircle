# Database Migration Guide

To enable the new features in version 3.1.0 (Secure Messaging, Login Counter, Soft Delete), you need to update your Supabase database schema.

## Instructions

1.  **Log in to Supabase**
    *   Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and select your project.

2.  **Open the SQL Editor**
    *   Click on the **SQL Editor** icon (looks like a terminal prompt `>_`) in the left sidebar.

3.  **Create a New Query**
    *   Click **+ New Query**.
    *   Name it "Version 3.1 Migration" (optional).

4.  **Run the Migration Script**
    *   **IMPORTANT:** Copy the code below exactly as is. Do not include any extra words like "sql" or backticks (```) at the beginning or end.
    *   Alternatively, you can open the file `supabase/migrations/20251226000000_add_features.sql` in your code editor and copy the contents from there.

```sql
-- Migration: Add login count, soft delete, and messaging
-- Created: 2025-12-26

-- 1. Add columns to caregivers table
ALTER TABLE caregivers ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;
ALTER TABLE caregivers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES caregivers(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 4. Add policy for messages
-- Allow all authenticated users to read and insert messages
CREATE POLICY "Team access" ON messages FOR ALL USING (true);
```

5.  **Execute**
    *   Click the **Run** button (bottom right or top right depending on view).
    *   You should see a "Success" message.

## Verification

To verify the changes were applied:
1.  Go to the **Table Editor** (grid icon in sidebar).
2.  Check the `caregivers` table: it should now have `login_count` and `deleted_at` columns.
3.  Check the list of tables: you should see a new `messages` table.

## Troubleshooting

*   **"syntax error at or near 'sql'"**: This means you accidentally copied the word "sql" from the documentation. Make sure you only copy the code starting with `-- Migration: ...` and ending with `... USING (true);`.
*   **"relation already exists"**: This means the table or column already exists. The script uses `IF NOT EXISTS` so it should be safe to run multiple times.
*   **Permission denied**: Ensure you are logged in as an administrator/owner of the Supabase project.
