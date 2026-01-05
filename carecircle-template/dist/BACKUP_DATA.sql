-- ============================================================================
-- BACKUP DATA SCRIPT
-- Run this in Supabase SQL Editor to view/export all your data
-- Copy the results to save as backup
-- ============================================================================

-- View all patients
SELECT * FROM patients;

-- View all caregivers
SELECT * FROM caregivers;

-- View all caregiver-patient relationships
SELECT * FROM caregiver_patients;

-- View all medications
SELECT * FROM medications;

-- View all medication logs
SELECT * FROM med_logs;

-- View all hydration logs
SELECT * FROM hydration_logs;

-- View all juice logs
SELECT * FROM juice_logs;

-- View all BM logs
SELECT * FROM bm_logs;

-- View all messages
SELECT * FROM messages;

-- View all team settings
SELECT * FROM team_settings;

-- ============================================================================
-- To export: Run each SELECT above, then click "Export" or copy the results
-- ============================================================================
