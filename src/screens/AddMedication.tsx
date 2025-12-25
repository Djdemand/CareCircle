import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { supabase } from '../utils/supabase';

export const AddMedication = ({ caregiverId }: { caregiverId: string }) => {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [freq, setFreq] = useState('8'); // hours

  const saveMed = async () => {
    // BMAD: Analyze - The caregiverId prop might be an Auth ID, but the DB expects a caregivers table ID.
    // We need to ensure a caregivers record exists for the current user.
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add medications');
      return;
    }

    // BMAD: Develop - Find or create the caregiver record
    let caregiverRecordId = caregiverId;

    // Try to find a caregiver record matching the user's email
    const { data: existingCaregiver, error: fetchError } = await supabase
      .from('caregivers')
      .select('id')
      .eq('email', user.email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found", which is expected if the user is new
      console.error('Error fetching caregiver:', fetchError);
    }

    if (existingCaregiver) {
      caregiverRecordId = existingCaregiver.id;
    } else {
      // Create a new caregiver record for this user
      const { data: newCaregiver, error: insertError } = await supabase
        .from('caregivers')
        .insert({
          email: user.email,
          name: user.email?.split('@')[0] || 'User' // Default name from email
        })
        .select('id')
        .single();

      if (insertError) {
        Alert.alert('Error', `Failed to create caregiver profile: ${insertError.message}`);
        return;
      }

      if (newCaregiver) {
        caregiverRecordId = newCaregiver.id;
      }
    }

    // Now insert the medication using the correct caregivers table ID
    const { error } = await supabase
      .from('medications')
      .insert({
        name,
        dosage,
        frequency_hours: parseInt(freq),
        duration_days: 7,
        start_date: new Date().toISOString(),
        created_by: caregiverRecordId
      });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Medication added to the team schedule');
      setName('');
      setDosage('');
      setFreq('8');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput 
        placeholder="Medication Name" 
        value={name} 
        onChangeText={setName} 
        style={styles.input}
      />
      <TextInput 
        placeholder="Dosage (e.g. 500mg)" 
        value={dosage} 
        onChangeText={setDosage} 
        style={styles.input}
      />
      <TextInput 
        placeholder="Frequency (hours)" 
        value={freq} 
        onChangeText={setFreq} 
        keyboardType="numeric"
        style={styles.input}
      />
      <Button title="Save Medication" onPress={saveMed} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8
  }
});
