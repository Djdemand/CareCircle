import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Alert, ScrollView, TouchableOpacity, Text } from 'react-native';
import { supabase } from '../utils/supabase';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency_hours: number;
  duration_days: number;
  start_date: string;
  position?: number;
  is_mandatory?: boolean;
}

type Props = NativeStackScreenProps<RootStackParamList, 'AddMedication'>;

export const AddMedication = ({ route, navigation }: Props) => {
  const editingMedication = route.params?.editingMedication;
  const caregiverId = route.params?.caregiverId || '';
  
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [freq, setFreq] = useState('8'); // hours
  const [duration, setDuration] = useState('7'); // days
  const [isMandatory, setIsMandatory] = useState(false);

  useEffect(() => {
    if (editingMedication) {
      setName(editingMedication.name);
      setDosage(editingMedication.dosage);
      setFreq(editingMedication.frequency_hours.toString());
      setDuration(editingMedication.duration_days.toString());
      setIsMandatory(editingMedication.is_mandatory || false);
    }
  }, [editingMedication]);

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

    // Get current max position for new medications
    let position = 0;
    if (!editingMedication) {
      const { data: existingMeds } = await supabase
        .from('medications')
        .select('position')
        .order('position', { ascending: false })
        .limit(1);
      
      if (existingMeds && existingMeds.length > 0) {
        position = (existingMeds[0].position || 0) + 1;
      }
    } else {
      position = editingMedication.position || 0;
    }

    if (editingMedication) {
      // Update existing medication
      const { error } = await supabase
        .from('medications')
        .update({
          name,
          dosage,
          frequency_hours: parseInt(freq),
          duration_days: parseInt(duration),
          is_mandatory: isMandatory,
        })
        .eq('id', editingMedication.id);

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Medication updated successfully');
        navigation.goBack();
      }
    } else {
      // Insert new medication at the top (position 0)
      const { error } = await supabase
        .from('medications')
        .insert({
          name,
          dosage,
          frequency_hours: parseInt(freq),
          duration_days: parseInt(duration),
          start_date: new Date().toISOString(),
          created_by: caregiverRecordId,
          is_mandatory: isMandatory,
          position: 0, // Always add new medications at the top
        });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Medication added to the team schedule');
        setName('');
        setDosage('');
        setFreq('8');
        setDuration('7');
        setIsMandatory(false);
        navigation.goBack();
      }
    }
  };

  const handleMandatoryQuestion = () => {
    Alert.alert(
      'Is this medication mandatory?',
      'Should this medication be marked as mandatory?',
      [
        {
          text: 'Yes',
          onPress: () => setIsMandatory(true),
        },
        {
          text: 'No',
          onPress: () => setIsMandatory(false),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>
        {editingMedication ? 'Edit Medication' : 'Add New Medication'}
      </Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Medication Name</Text>
        <TextInput 
          placeholder="e.g., Aspirin" 
          value={name} 
          onChangeText={setName} 
          style={styles.input}
          placeholderTextColor="#64748b"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Dosage</Text>
        <TextInput 
          placeholder="e.g., 500mg" 
          value={dosage} 
          onChangeText={setDosage} 
          style={styles.input}
          placeholderTextColor="#64748b"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Frequency (hours between doses)</Text>
        <TextInput 
          placeholder="e.g., 8" 
          value={freq} 
          onChangeText={setFreq} 
          keyboardType="numeric"
          style={styles.input}
          placeholderTextColor="#64748b"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Duration (days)</Text>
        <TextInput 
          placeholder="e.g., 7" 
          value={duration} 
          onChangeText={setDuration} 
          keyboardType="numeric"
          style={styles.input}
          placeholderTextColor="#64748b"
        />
      </View>

      <TouchableOpacity 
        style={[styles.mandatoryButton, isMandatory && styles.mandatoryButtonActive]}
        onPress={handleMandatoryQuestion}
      >
        <Text style={[styles.mandatoryButtonText, isMandatory && styles.mandatoryButtonTextActive]}>
          {isMandatory ? '✓ Mandatory' : 'Mark as Mandatory'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveButton} onPress={saveMed}>
        <Text style={styles.saveButtonText}>
          {editingMedication ? 'Update Medication' : 'Add Medication'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#f8fafc',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    borderRadius: 12,
    color: '#f8fafc',
    fontSize: 16,
  },
  mandatoryButton: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  mandatoryButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3b82f6',
  },
  mandatoryButtonText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  mandatoryButtonTextActive: {
    color: '#3b82f6',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
});
