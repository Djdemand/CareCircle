/**
 * Multitenancy Helper Utility
 * 
 * This utility provides helper functions for database operations with automatic
 * patient_id handling to support multi-tenancy (patient circles).
 * 
 * All functions automatically fetch the current user's patient_id and include
 * it in database operations, ensuring proper row-level security (RLS) compliance.
 */

import { supabase } from './supabase';

/**
 * Get the current user's patient_id
 * @returns The patient_id for the authenticated user
 * @throws Error if user is not authenticated or has no patient_id
 */
export async function getCurrentPatientId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: caregiver, error } = await supabase
    .from('caregivers')
    .select('patient_id')
    .eq('id', user.id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch caregiver: ${error.message}`);
  }

  if (!caregiver?.patient_id) {
    throw new Error('User is not associated with a patient circle');
  }

  return caregiver.patient_id;
}

/**
 * Insert a hydration log with automatic patient_id
 * @param amount_oz - Amount in ounces
 * @param caregiver_id - ID of the caregiver who logged this
 * @returns The inserted record
 */
export async function insertHydrationLog(amount_oz: number, caregiver_id: string) {
  const patient_id = await getCurrentPatientId();
  
  const { data, error } = await supabase
    .from('hydration_logs')
    .insert({
      amount_oz,
      caregiver_id,
      patient_id,
      logged_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert hydration log: ${error.message}`);
  }

  return data;
}

/**
 * Insert a juice log with automatic patient_id
 * @param amount_oz - Amount in ounces
 * @param caregiver_id - ID of the caregiver who logged this
 * @returns The inserted record
 */
export async function insertJuiceLog(amount_oz: number, caregiver_id: string) {
  const patient_id = await getCurrentPatientId();
  
  const { data, error } = await supabase
    .from('juice_logs')
    .insert({
      amount_oz,
      caregiver_id,
      patient_id,
      logged_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert juice log: ${error.message}`);
  }

  return data;
}

/**
 * Insert a BM log with automatic patient_id
 * @param had_bm - Whether the patient had a bowel movement
 * @param notes - Optional notes
 * @param caregiver_id - ID of the caregiver who logged this
 * @returns The inserted record
 */
export async function insertBMLog(had_bm: boolean, notes: string, caregiver_id: string) {
  const patient_id = await getCurrentPatientId();
  
  const { data, error} = await supabase
    .from('bm_logs')
    .insert({
      had_bm,
      notes,
      caregiver_id,
      patient_id,
      logged_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert BM log: ${error.message}`);
  }

  return data;
}

/**
 * Insert a medication with automatic patient_id
 * @param medication - Medication data (without patient_id)
 * @returns The inserted record
 */
export async function insertMedication(medication: {
  name: string;
  dosage: string;
  frequency_hours: number;
  duration_days: number;
  start_date: string;
  end_date?: string;
  instructions?: string;
  created_by: string;
  is_mandatory?: boolean;
  position?: number;
}) {
  const patient_id = await getCurrentPatientId();
  
  const { data, error } = await supabase
    .from('medications')
    .insert({
      ...medication,
      patient_id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert medication: ${error.message}`);
  }

  return data;
}

/**
 * Insert a medication log with automatic patient_id
 * @param med_log - Medication log data (without patient_id)
 * @returns The inserted record
 */
export async function insertMedLog(med_log: {
  med_id: string;
  caregiver_id: string;
  window_start: string;
  window_end: string;
  notes?: string;
}) {
  const patient_id = await getCurrentPatientId();
  
  const { data, error } = await supabase
    .from('med_logs')
    .insert({
      ...med_log,
      patient_id,
      administered_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert medication log: ${error.message}`);
  }

  return data;
}

/**
 * Insert a message with automatic patient_id
 * @param content - Message content
 * @param sender_id - ID of the sender
 * @returns The inserted record
 */
export async function insertMessage(content: string, sender_id: string) {
  const patient_id = await getCurrentPatientId();
  
  const { data, error } = await supabase
    .from('messages')
    .insert({
      content,
      sender_id,
      patient_id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert message: ${error.message}`);
  }

  return data;
}

/**
 * Get or create team settings for the current patient
 * @returns Team settings record
 */
export async function getOrCreateTeamSettings() {
  const patient_id = await getCurrentPatientId();
  
  // Try to get existing settings
  const { data: existing, error: fetchError } = await supabase
    .from('team_settings')
    .select('*')
    .eq('patient_id', patient_id)
    .single();

  if (existing) {
    return existing;
  }

  // Create new settings if none exist
  const { data, error } = await supabase
    .from('team_settings')
    .insert({
      patient_id,
      hydration_goal: 128,
      juice_goal: 0,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create team settings: ${error.message}`);
  }

  return data;
}

/**
 * Update team settings for the current patient
 * @param settings - Settings to update
 * @returns Updated record
 */
export async function updateTeamSettings(settings: {
  hydration_goal?: number;
  juice_goal?: number;
}) {
  const patient_id = await getCurrentPatientId();
  
  const { data, error } = await supabase
    .from('team_settings')
    .update({
      ...settings,
      updated_at: new Date().toISOString(),
    })
    .eq('patient_id', patient_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update team settings: ${error.message}`);
  }

  return data;
}

/**
 * Get all caregivers in the current patient's circle
 * @returns Array of caregivers
 */
export async function getPatientCaregivers() {
  const patient_id = await getCurrentPatientId();
  
  const { data, error } = await supabase
    .from('caregivers')
    .select('*')
    .eq('patient_id', patient_id);

  if (error) {
    throw new Error(`Failed to fetch caregivers: ${error.message}`);
  }

  return data || [];
}

/**
 * Get patient information for the current user
 * @returns Patient record
 */
export async function getCurrentPatient() {
  const patient_id = await getCurrentPatientId();
  
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', patient_id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch patient: ${error.message}`);
  }

  return data;
}

/**
 * Update patient information
 * @param updates - Fields to update
 * @returns Updated patient record
 */
export async function updatePatient(updates: {
  name?: string;
}) {
  const patient_id = await getCurrentPatientId();
  
  const { data, error } = await supabase
    .from('patients')
    .update(updates)
    .eq('id', patient_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update patient: ${error.message}`);
  }

  return data;
}

/**
 * Add a caregiver to the current patient's circle
 * @param caregiver - Caregiver data
 * @returns Inserted caregiver record
 */
export async function addCaregiverToCircle(caregiver: {
  id: string;
  name: string;
  email: string;
  is_admin?: boolean;
}) {
  const patient_id = await getCurrentPatientId();
  
  const { data, error } = await supabase
    .from('caregivers')
    .insert({
      ...caregiver,
      patient_id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add caregiver: ${error.message}`);
  }

  return data;
}
