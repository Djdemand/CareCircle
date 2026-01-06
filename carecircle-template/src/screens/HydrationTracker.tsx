import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, TextInput } from 'react-native';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import { getCurrentPatientId, insertHydrationLog } from '../utils/multitenancyHelper';

export default function HydrationTracker() {
  const { user } = useAuth();
  const [waterAmount, setWaterAmount] = useState('');
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  const [dailyGoal, setDailyGoal] = useState(128);  // Default 128 oz
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadPatientId();
    }
  }, [user]);

  useEffect(() => {
    if (user && patientId) {
      loadTodayLogs();
      loadDailyGoal();
    }
  }, [user, patientId]);

  const loadPatientId = async () => {
    try {
      const id = await getCurrentPatientId();
      setPatientId(id);
    } catch (error: any) {
      console.error('Error loading patient ID:', error);
      Alert.alert('Error', 'Could not load patient information');
    }
  };

  const loadTodayLogs = async () => {
    if (!user || !patientId) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('hydration_logs')
        .select('*')
        .eq('patient_id', patientId)
        .gte('logged_at', today.toISOString())
        .lt('logged_at', tomorrow.toISOString())
        .order('logged_at', { ascending: false });

      if (error) {
        console.error('Error loading hydration logs:', error);
        return;
      }

      setTodayLogs(data || []);
    } catch (error) {
      console.error('Error in loadTodayLogs:', error);
    }
  };

  const loadDailyGoal = async () => {
    if (!user || !patientId) return;

    try {
      const { data, error } = await supabase
        .from('team_settings')
        .select('hydration_goal')
        .eq('patient_id', patientId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading daily goal:', error);
        return;
      }

      if (data && data.hydration_goal) {
        setDailyGoal(data.hydration_goal);
      }
    } catch (error) {
      console.error('Error in loadDailyGoal:', error);
    }
  };

  const addWater = async () => {
    const amount = parseInt(waterAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    setLoading(true);

    try {
      await insertHydrationLog(amount, user.id);
      
      setWaterAmount('');
      loadTodayLogs();
      Alert.alert('Success', `Added ${amount}oz of water`);
    } catch (error: any) {
      console.error('Error adding water:', error);
      Alert.alert('Error', error.message || 'Failed to add water log');
    } finally {
      setLoading(false);
    }
  };

  const deleteLog = async (logId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('hydration_logs')
        .delete()
        .eq('id', logId);

      if (error) {
        console.error('Error deleting log:', error);
        Alert.alert('Error', 'Failed to delete log');
        return;
      }

      loadTodayLogs();
    } catch (error) {
      console.error('Error in deleteLog:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const totalWater = todayLogs.reduce((sum, log) => sum + (log.amount_oz || 0), 0);
  const progress = Math.min((totalWater / dailyGoal) * 100, 100);

  if (!patientId) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hydration Tracker</Text>
        <Text style={styles.subtitle}>Track your daily water intake</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {totalWater}oz / {dailyGoal}oz
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={waterAmount}
          onChangeText={setWaterAmount}
          placeholder="Amount (oz)"
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={[styles.addButton, loading && styles.buttonDisabled]}
          onPress={addWater}
          disabled={loading}
        >
          <Text style={styles.addButtonText}>
            {loading ? 'Adding...' : 'Add'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logsContainer}>
        <Text style={styles.logsTitle}>Today's Logs</Text>
        {todayLogs.length === 0 ? (
          <Text style={styles.noLogs}>No logs yet today</Text>
        ) : (
          todayLogs.map((log) => (
            <View key={log.id} style={styles.logItem}>
              <View style={styles.logInfo}>
                <Text style={styles.logAmount}>{log.amount_oz}oz</Text>
                <Text style={styles.logTime}>
                  {new Date(log.logged_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteLog(log.id)}
              >
                <Text style={styles.deleteButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  header: {
    padding: 20,
    backgroundColor: '#3498db',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#ecf0f1',
    marginTop: 5,
  },
  progressContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressBar: {
    height: 20,
    backgroundColor: '#ecf0f1',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498db',
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    margin: 20,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  addButton: {
    backgroundColor: '#3498db',
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logsContainer: {
    margin: 20,
  },
  logsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  noLogs: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    padding: 20,
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logInfo: {
    flex: 1,
  },
  logAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  logTime: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 5,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
