import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from './hooks/useAuth';
import { Login } from './screens/Login';
import { Dashboard } from './screens/Dashboard';
import { MedicationList } from './screens/MedicationList';
import { AddMedication } from './screens/AddMedication';
import { Profile } from './screens/Profile';
import { TeamManagement } from './screens/TeamManagement';
import { HydrationTracker } from './screens/HydrationTracker';
import { supabase } from './utils/supabase';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency_hours: number;
  duration_days: number;
  start_date: string;
  position?: number;
}

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  MedicationList: { editingMedId?: string };
  AddMedication: { caregiverId?: string; editingMedication?: Medication } | undefined;
  Profile: undefined;
  TeamManagement: undefined;
  HydrationTracker: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const { user, loading } = useAuth();
  const [patientName, setPatientName] = useState<string>('');

  useEffect(() => {
    if (user) {
      const fetchPatient = async () => {
        const { data: caregiver } = await supabase
          .from('caregivers')
          .select('patient_id')
          .eq('id', user.id)
          .single();
        
        if (caregiver?.patient_id) {
          const { data: patient } = await supabase
            .from('patients')
            .select('name')
            .eq('id', caregiver.patient_id)
            .single();
          
          if (patient) {
            setPatientName(patient.name);
          }
        }
      };
      fetchPatient();
    } else {
      setPatientName('');
    }
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#0f172a',
            },
            headerTintColor: '#f8fafc',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            contentStyle: {
              backgroundColor: '#0f172a',
            },
          }}
        >
          {!user ? (
            <Stack.Screen 
              name="Login" 
              component={Login} 
              options={{ headerShown: false }}
            />
          ) : (
            <>
              <Stack.Screen 
                name="Dashboard" 
                component={Dashboard}
                options={{ title: patientName ? `CareCircle for: ${patientName}` : 'CareCircle' }}
              />
              <Stack.Screen 
                name="MedicationList" 
                component={MedicationList}
                options={{ title: 'Medications' }}
              />
              <Stack.Screen
                name="AddMedication"
                component={AddMedication}
                options={{ title: 'Add Medication' }}
                initialParams={{ caregiverId: user?.id || '' }}
              />
              <Stack.Screen 
                name="Profile" 
                component={Profile}
                options={{ title: 'My Profile' }}
              />
              <Stack.Screen 
                name="TeamManagement" 
                component={TeamManagement}
                options={{ title: 'Care Team' }}
              />
              <Stack.Screen 
                name="HydrationTracker" 
                component={HydrationTracker}
                options={{ title: 'Hydration' }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
});
