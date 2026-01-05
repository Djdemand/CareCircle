-- RPC Function to handle safe signup with RLS
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION create_patient_and_caregiver(
    patient_name TEXT,
    caregiver_name TEXT,
    caregiver_email TEXT,
    caregiver_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres), bypassing RLS
AS $$
DECLARE
    new_patient_id UUID;
BEGIN
    -- 1. Insert Patient
    INSERT INTO patients (name)
    VALUES (patient_name)
    RETURNING id INTO new_patient_id;

    -- 2. Insert Caregiver linked to Patient
    INSERT INTO caregivers (id, name, email, patient_id, is_admin)
    VALUES (caregiver_id, caregiver_name, caregiver_email, new_patient_id, true);

    -- 3. Return IDs
    RETURN jsonb_build_object(
        'patient_id', new_patient_id,
        'caregiver_id', caregiver_id
    );
END;
$$;Apple goods. Really, do whatever you want. Oh. 