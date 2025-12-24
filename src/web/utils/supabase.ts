import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oy dyrdcnoygrzjapanbd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95ZHlyZGNub3lncnpqYXBhbmJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTE1MjIsImV4cCI6MjA4MjA2NzUyMn0.lvQkpUe4tSbElwKjUCz75RISH6E59U1JGuYZU9wDuDo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
