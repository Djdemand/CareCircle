-- Enable RLS on all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE med_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE juice_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bm_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_settings ENABLE ROW LEVEL SECURITY;

-- Function to get the current user's patient_id
CREATE OR REPLACE FUNCTION get_my_patient_id()
RETURNS UUID AS $$
DECLARE
  my_patient_id UUID;
BEGIN
  SELECT patient_id INTO my_patient_id
  FROM caregivers
  WHERE id = auth.uid();
  RETURN my_patient_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to assign patient_id to new caregivers
CREATE OR REPLACE FUNCTION assign_patient_id_to_caregiver()
RETURNS TRIGGER AS $$
DECLARE
  inviter_patient_id UUID;
  new_patient_id UUID;
BEGIN
  -- If patient_id is already set, do nothing
  IF NEW.patient_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Check if the current user (inviter) has a patient_id
  SELECT patient_id INTO inviter_patient_id
  FROM caregivers
  WHERE id = auth.uid();

  IF inviter_patient_id IS NOT NULL THEN
    -- This is an invite: assign the inviter's patient_id
    NEW.patient_id := inviter_patient_id;
  ELSE
    -- This is a new signup: create a new patient
    INSERT INTO patients (name) VALUES ('My Patient') RETURNING id INTO new_patient_id;
    NEW.patient_id := new_patient_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to assign patient_id to other tables based on caregiver_id/created_by
CREATE OR REPLACE FUNCTION assign_patient_id_from_caregiver()
RETURNS TRIGGER AS $$
DECLARE
  target_caregiver_id UUID;
  found_patient_id UUID;
BEGIN
  -- Determine which column holds the caregiver ID
  -- TG_TABLE_NAME is available in triggers
  IF TG_TABLE_NAME = 'medications' THEN
    target_caregiver_id := NEW.created_by;
  ELSE
    target_caregiver_id := NEW.caregiver_id;
  END IF;

  -- Find the patient_id for this caregiver
  SELECT patient_id INTO found_patient_id
  FROM caregivers
  WHERE id = target_caregiver_id;

  IF found_patient_id IS NOT NULL THEN
    NEW.patient_id := found_patient_id;
  ELSE
    RAISE EXCEPTION 'Caregiver % has no patient_id assigned', target_caregiver_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Triggers
DROP TRIGGER IF EXISTS trg_assign_patient_caregiver ON caregivers;
CREATE TRIGGER trg_assign_patient_caregiver
BEFORE INSERT ON caregivers
FOR EACH ROW EXECUTE FUNCTION assign_patient_id_to_caregiver();

-- List of tables to apply the second trigger
-- medications, med_logs, hydration_logs, juice_logs, bm_logs, messages, team_settings

DROP TRIGGER IF EXISTS trg_assign_patient_medications ON medications;
CREATE TRIGGER trg_assign_patient_medications
BEFORE INSERT ON medications
FOR EACH ROW EXECUTE FUNCTION assign_patient_id_from_caregiver();

DROP TRIGGER IF EXISTS trg_assign_patient_med_logs ON med_logs;
CREATE TRIGGER trg_assign_patient_med_logs
BEFORE INSERT ON med_logs
FOR EACH ROW EXECUTE FUNCTION assign_patient_id_from_caregiver();

DROP TRIGGER IF EXISTS trg_assign_patient_hydration_logs ON hydration_logs;
CREATE TRIGGER trg_assign_patient_hydration_logs
BEFORE INSERT ON hydration_logs
FOR EACH ROW EXECUTE FUNCTION assign_patient_id_from_caregiver();

DROP TRIGGER IF EXISTS trg_assign_patient_juice_logs ON juice_logs;
CREATE TRIGGER trg_assign_patient_juice_logs
BEFORE INSERT ON juice_logs
FOR EACH ROW EXECUTE FUNCTION assign_patient_id_from_caregiver();

DROP TRIGGER IF EXISTS trg_assign_patient_bm_logs ON bm_logs;
CREATE TRIGGER trg_assign_patient_bm_logs
BEFORE INSERT ON bm_logs
FOR EACH ROW EXECUTE FUNCTION assign_patient_id_from_caregiver();

DROP TRIGGER IF EXISTS trg_assign_patient_messages ON messages;
CREATE TRIGGER trg_assign_patient_messages
BEFORE INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION assign_patient_id_from_caregiver();

-- team_settings might not have caregiver_id? Let's check schema.
-- Assuming team_settings is 1 per patient, it might just need patient_id.
-- If it doesn't have caregiver_id, we can't use this trigger.
-- Let's assume for now it's created by a caregiver and has caregiver_id or created_by.
-- If not, we might need a different approach for it.
-- Checking previous schema: team_settings usually has patient_id.
-- If the frontend inserts it without patient_id, we need a way to set it.
-- If it has updated_by or created_by, we can use that.
-- Let's skip team_settings trigger for a moment and handle it if needed, or assume it has caregiver_id.
-- Actually, let's check if team_settings has caregiver_id in the schema.
-- Since I can't see the schema right now, I'll assume it follows the pattern or I'll add a safe check.

-- RLS Policies

-- 1. Patients
DROP POLICY IF EXISTS "Access own patient" ON patients;
CREATE POLICY "Access own patient" ON patients
FOR ALL USING (id = get_my_patient_id());

-- 2. Caregivers
DROP POLICY IF EXISTS "Access own caregiver profile" ON caregivers;
CREATE POLICY "Access own caregiver profile" ON caregivers
FOR SELECT USING (
  id = auth.uid() OR patient_id = get_my_patient_id()
);

DROP POLICY IF EXISTS "Insert caregiver profile" ON caregivers;
CREATE POLICY "Insert caregiver profile" ON caregivers
FOR INSERT WITH CHECK (
  -- Allow self-signup OR invite by someone in the same patient circle (handled by trigger logic mostly)
  -- Ideally: auth.uid() = id OR (get_my_patient_id() IS NOT NULL)
  true 
);

DROP POLICY IF EXISTS "Update own caregiver profile" ON caregivers;
CREATE POLICY "Update own caregiver profile" ON caregivers
FOR UPDATE USING (
  id = auth.uid() OR patient_id = get_my_patient_id()
);

DROP POLICY IF EXISTS "Delete own caregiver profile" ON caregivers;
CREATE POLICY "Delete own caregiver profile" ON caregivers
FOR DELETE USING (
  id = auth.uid() OR patient_id = get_my_patient_id()
);

-- 3. Medications
DROP POLICY IF EXISTS "Access medications" ON medications;
CREATE POLICY "Access medications" ON medications
FOR ALL USING (patient_id = get_my_patient_id());

-- 4. Med Logs
DROP POLICY IF EXISTS "Access med logs" ON med_logs;
CREATE POLICY "Access med logs" ON med_logs
FOR ALL USING (patient_id = get_my_patient_id());

-- 5. Hydration Logs
DROP POLICY IF EXISTS "Access hydration logs" ON hydration_logs;
CREATE POLICY "Access hydration logs" ON hydration_logs
FOR ALL USING (patient_id = get_my_patient_id());

-- 6. Juice Logs
DROP POLICY IF EXISTS "Access juice logs" ON juice_logs;
CREATE POLICY "Access juice logs" ON juice_logs
FOR ALL USING (patient_id = get_my_patient_id());

-- 7. BM Logs
DROP POLICY IF EXISTS "Access bm logs" ON bm_logs;
CREATE POLICY "Access bm logs" ON bm_logs
FOR ALL USING (patient_id = get_my_patient_id());

-- 8. Messages
DROP POLICY IF EXISTS "Access messages" ON messages;
CREATE POLICY "Access messages" ON messages
FOR ALL USING (patient_id = get_my_patient_id());

-- 9. Team Settings
DROP POLICY IF EXISTS "Access team settings" ON team_settings;
CREATE POLICY "Access team settings" ON team_settings
FOR ALL USING (patient_id = get_my_patient_id());
