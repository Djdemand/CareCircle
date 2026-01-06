import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../utils/supabase';
import { MedicationCard } from '../components/MedicationCard';
import { Plus, RefreshCw } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';
import { calculateDoseWindows } from '../utils/doseCalc';

type Props = NativeStackScreenProps<RootStackParamList, 'MedicationList'>;

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency_hours: number;
  duration_days: number;
  start_date: string;
  position?: number;
}

interface MedLog {
  id: string;
  medication_id: string;
  taken_at: string;
  taken_by: string;
}

interface Caregiver {
  id: string;
  name: string;
}

interface DoseWindow {
  start: Date;
  end: Date;
  label: string;
}

export const MedicationList = ({ navigation }: Props) => {
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medLogs, setMedLogs] = useState<MedLog[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    setupRealtimeSubscription();
  }, []);

  const loadData = async () => {
    try {
      // Load medications ordered by position (for custom ordering)
      const { data: medsData } = await supabase
        .from('medications')
        .select('*')
        .order('position', { ascending: true, nullsFirst: false });

      // Load medication logs for today - use local midnight to avoid timezone issues
      const now = new Date();
      const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      
      const { data: logsData } = await supabase
        .from('med_logs')
        .select('*')
        .gte('taken_at', localMidnight)
        .order('taken_at', { ascending: false });

      // Load caregivers
      const { data: caregiversData } = await supabase
        .from('caregivers')
        .select('*');

      if (medsData) setMedications(medsData);
      if (logsData) setMedLogs(logsData);
      if (caregiversData) setCaregivers(caregiversData);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('medications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'medications' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'med_logs' }, () => {
        loadData();
      })
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleMarkTaken = async (medicationId: string) => {
    if (!user) return;

    try {
      // Check if already taken in current window - use local midnight to avoid timezone issues
      const now = new Date();
      const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      
      const existingLog = medLogs.find(log => 
        log.medication_id === medicationId && 
        log.taken_at >= localMidnight
      );

      if (existingLog) {
        Alert.alert('Already Taken', 'This medication has already been logged today.');
        return;
      }

      // Fetch current user's patient_id
      const { data: currentUserCaregiver } = await supabase
        .from('caregivers')
        .select('patient_id')
        .eq('id', user.id)
        .single();

      if (!currentUserCaregiver?.patient_id) {
        throw new Error('Could not find your patient circle');
      }

      // Create new log entry
      const { error } = await supabase
        .from('med_logs')
        .insert({
          medication_id: medicationId,
          taken_at: now.toISOString(),
          taken_by: user.id,
          patient_id: currentUserCaregiver.patient_id,
        });

      if (error) throw error;

      Alert.alert('Success', 'Medication marked as taken');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const getActiveMedications = () => {
    const now = new Date();
    return medications.filter(med => {
      const startDate = new Date(med.start_date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + med.duration_days);
      return now >= startDate && now <= endDate;
    });
  };

  const getMedicationStatus = (medication: Medication) => {
    // Use local midnight to avoid timezone issues
    const now = new Date();
    const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    
    const todayLogs = medLogs.filter(log => 
      log.medication_id === medication.id && 
      log.taken_at >= localMidnight
    );

    if (todayLogs.length > 0) {
      const latestLog = todayLogs[0];
      const caregiver = caregivers.find(c => c.id === latestLog.taken_by);
      return {
        isTaken: true,
        takenBy: caregiver?.name || 'Unknown',
      };
    }

    return { isTaken: false };
  };

  const getDaysRemaining = (medication: Medication) => {
    const startDate = new Date(medication.start_date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + medication.duration_days);
    const now = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 ? `${daysLeft} days left` : 'Last day';
  };

  const getCurrentWindow = (medication: Medication) => {
    const windows = calculateDoseWindows(medication.frequency_hours);
    const now = new Date();
    
    for (const window of windows) {
      if (now >= window.start && now <= window.end) {
        return window.label;
      }
    }
    
    return 'Outside window';
  };

  const activeMeds = getActiveMedications();

  const handleEdit = (medication: Medication) => {
    navigation.navigate('AddMedication', {
      caregiverId: user?.id || '',
      editingMedication: medication
    });
  };

  const handleDelete = (medicationId: string) => {
    Alert.alert(
      'Delete Medication',
      'Are you sure you want to delete this medication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('medications')
                .delete()
                .eq('id', medicationId);

              if (error) throw error;
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    const newMeds = [...medications];
    const [movedItem] = newMeds.splice(fromIndex, 1);
    newMeds.splice(toIndex, 0, movedItem);

    // Update positions in database
    const updates = newMeds.map((med, index) => ({
      id: med.id,
      position: index
    }));

    try {
      for (const update of updates) {
        await supabase
          .from('medications')
          .update({ position: update.position })
          .eq('id', update.id);
      }
      setMedications(newMeds);
    } catch (error: any) {
      Alert.alert('Error', error.message);
      loadData(); // Reload on error
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Medications</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddMedication', { caregiverId: user?.id || '' })}
        >
          <Plus size={20} color="#f8fafc" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeMeds.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Active Medications</Text>
            <Text style={styles.emptyText}>
              Tap the + button to add a medication to the care schedule
            </Text>
          </View>
        ) : (
          activeMeds.map((medication, index) => {
            const status = getMedicationStatus(medication);
            const daysInfo = getDaysRemaining(medication);
            const windowLabel = getCurrentWindow(medication);

            return (
              <MedicationCard
                key={medication.id}
                name={medication.name}
                dosage={medication.dosage}
                windowLabel={windowLabel}
                isTaken={status.isTaken}
                takenBy={status.takenBy}
                onPress={() => handleMarkTaken(medication.id)}
                daysInfo={daysInfo}
                onEdit={() => handleEdit(medication)}
                onDelete={() => handleDelete(medication.id)}
                onLongPress={() => {
                  // Simple reorder prompt for now
                  // In a full implementation, this would trigger drag-and-drop
                  Alert.alert(
                    'Reorder Medication',
                    'Move this medication to a new position (0 = top)',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Move to Top',
                        onPress: () => handleReorder(index, 0),
                      },
                      {
                        text: 'Move Up',
                        onPress: () => handleReorder(index, Math.max(0, index - 1)),
                      },
                      {
                        text: 'Move Down',
                        onPress: () => handleReorder(index, Math.min(activeMeds.length - 1, index + 1)),
                      },
                    ]
                  );
                }}
                isDragging={draggedItem === medication.id}
              />
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#f8fafc',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});