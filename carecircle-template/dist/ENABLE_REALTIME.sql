-- ============================================================================
-- ENABLE REALTIME FOR ALL TABLES
-- This allows changes to sync in real-time between users
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Enable realtime for all application tables
ALTER PUBLICATION supabase_realtime ADD TABLE medications;
ALTER PUBLICATION supabase_realtime ADD TABLE med_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE hydration_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE juice_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE bm_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE caregivers;
ALTER PUBLICATION supabase_realtime ADD TABLE patients;
ALTER PUBLICATION supabase_realtime ADD TABLE team_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE caregiver_patients;

-- Verify replication is enabled
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- ============================================================================
-- NOTE: If you get an error saying a table is already in the publication,
-- that's fine - it means it's already enabled!
-- ============================================================================
