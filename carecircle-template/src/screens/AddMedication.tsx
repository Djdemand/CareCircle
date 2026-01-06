import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../utils/supabase';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { getCurrentPatientId, insertMedication } from '../utils/multitenancyHelper';

type RootStackParamList = {
  AddMedication: { patientId?: string; caregiverId?: string };
  MedicationList: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'AddMedication'>;

export default function AddMedication({ route, navigation }: Props) {
  const { user } = useAuth();
  const { patientId: routePatientId, caregiverId: routeCaregiverId } = route.params || {};
  
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [freq, setFreq] = useState('8');
  const [duration, setDuration] = useState('7');
  const [isMandatory, setIsMandatory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadPatientId();
    }
  }, [user]);

  const loadPatientId = async () => {
    try {
      const id = await getCurrentPatientId();
      setPatientId(id);
    } catch (error: any) {
      console.error('Error loading patient ID:', error);
      Alert.alert('Error', 'Could not load patient information');
    }
  };

  const saveMed = async () => {
    if (!name.trim() || !dosage.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to add medications');
      return;
    }

    if (!patientId) {
      Alert.alert('Error', 'Patient information not loaded');
      return;
    }

    setLoading(true);

    try {
      // Get caregiver record ID
      let caregiverRecordId = routeCaregiverId;
      
      // Try to find a caregiver record matching the user's email
      const { data: existingCaregiver, error: fetchError } = await supabase
        .from('caregivers')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching caregiver:', fetchError);
      }

      if (existingCaregiver) {
        caregiverRecordId = existingCaregiver.id;
      } else {
        // Create a new caregiver record
        const { data: newCaregiver, error: insertError } = await supabase
          .from('caregivers')
          .insert({
            id: user.id,
            email: user.email,
            name: user.email?.split('@')[0] || 'User',
            patient_id: patientId
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('Error creating caregiver:', insertError);
          Alert.alert('Error', 'Failed to create caregiver record');
          return;
        }

        caregiverRecordId = newCaregiver.id;
      }

      // Check if medication already exists
      const { data: existingMeds } = await supabase
        .from('medications')
        .select('id, position')
        .eq('name', name.trim())
        .eq('patient_id', patientId)
        .order('position', { ascending: true })
        .limit(1);

      if (existingMeds && existingMeds.length > 0) {
        // Update existing medication
        const { error: updateError } = await supabase
          .from('medications')
          .update({
            dosage: dosage.trim(),
            frequency_hours: parseInt(freq),
            duration_days: parseInt(duration),
            is_mandatory: isMandatory
          })
          .eq('id', existingMeds[0].id);

        if (updateError) {
          console.error('Error updating medication:', updateError);
          Alert.alert('Error', 'Failed to update medication');
          return;
        }

        Alert.alert('Success', 'Medication updated successfully');
        navigation.goBack();
      } else {
        // Get the highest position for new medication
        const { data: maxPos } = await supabase
          .from('medications')
          .select('position')
          .eq('patient_id', patientId)
          .order('position', { ascending: false })
          .limit(1);

        const newPosition = maxPos && maxPos.length > 0 ? (maxPos[0].position || 0) + 1 : 0;

        // Insert new medication using helper
        if (!caregiverRecordId) {
          Alert.alert('Error', 'Caregiver ID not found');
          return;
        }

        await insertMedication({
          name: name.trim(),
          dosage: dosage.trim(),
          frequency_hours: parseInt(freq),
          duration_days: parseInt(duration),
          start_date: new Date().toISOString(),
          created_by: caregiverRecordId,
          is_mandatory: isMandatory,
          position: newPosition
        });

        Alert.alert('Success', 'Medication added to the team schedule');
        setName('');
        setDosage('');
        setFreq('8');
        setDuration('7');
        setIsMandatory(false);
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Error in saveMed:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!patientId) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Add Medication</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Medication Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Lisinopril"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Dosage</Text>
          <TextInput
            style={styles.input}
            value={dosage}
            onChangeText={setDosage}
            placeholder="e.g., 10mg"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Frequency (hours)</Text>
          <TextInput
            style={styles.input}
            value={freq}
            onChangeText={setFreq}
            placeholder="e.g., 8"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Duration (days)</Text>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={setDuration}
            placeholder="e.g., 7"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
        </View>

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setIsMandatory(!isMandatory)}
        >
          <View style={[styles.checkbox, isMandatory && styles.checkboxChecked]}>
            {isMandatory && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Mark as mandatory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={saveMed}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Saving...' : 'Save Medication'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#3498db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3498db',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#34495e',
  },
  button: {
    backgroundColor: '#3498db',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
