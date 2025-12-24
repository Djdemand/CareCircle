import React, { useEffect } from 'react';
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

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  MedicationList: undefined;
  AddMedication: { caregiverId: string };
  Profile: undefined;
  TeamManagement: undefined;
  HydrationTracker: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const { user, loading } = useAuth();

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
                options={{ title: 'CareCircle' }}
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
