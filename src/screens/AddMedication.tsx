import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { supabase } from '../utils/supabase';

export const AddMedication = ({ caregiverId }: { caregiverId: string }) => {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [freq, setFreq] = useState('8'); // hours

  const saveMed = async () => {
    const { error } = await supabase
      .from('medications')
      .insert({
        name,
        dosage,
        frequency_hours: parseInt(freq),
        duration_days: 7,
        start_date: new Date().toISOString(),
        created_by: caregiverId
      });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Medication added to the team schedule');
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
