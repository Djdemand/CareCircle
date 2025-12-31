import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert 
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../utils/supabase';
import { 
  Pill, 
  Users, 
  Droplets, 
  Plus, 
  LogOut, 
  User,
  Clock,
  CheckCircle
} from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency_hours: number;
  duration_days: number;
  start_date: string;
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
  email: string;
}

export const Dashboard = ({ navigation }: Props) => {
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medLogs, setMedLogs] = useState<MedLog[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    setupRealtimeSubscription();
  }, []);

  const loadData = async () => {
    try {
      // Load medications
      const { data: medsData } = await supabase
        .from('medications')
        .select('*')
        .order('created_at', { ascending: false });

      // Load medication logs
      const { data: logsData } = await supabase
        .from('med_logs')
        .select('*')
        .gte('taken_at', new Date().toISOString().split('T')[0])
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
    } finally {
      setLoading(false);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const getTodayDoseCount = () => {
    const today = new Date().toISOString().split('T')[0];
    return medLogs.filter(log => log.taken_at.startsWith(today)).length;
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

  const activeMeds = getActiveMedications();
  const todayDoses = getTodayDoseCount();

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    color, 
    onPress 
  }: { 
    icon: any; 
    label: string; 
    value: string | number; 
    color: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.statIcon}>
        <Icon size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.email?.split('@')[0]}</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon={Pill}
            label="Active Meds"
            value={activeMeds.length}
            color="#3b82f6"
            onPress={() => navigation.navigate('MedicationList')}
          />
          <StatCard
            icon={CheckCircle}
            label="Today's Doses"
            value={todayDoses}
            color="#34d399"
            onPress={() => navigation.navigate('MedicationList')}
          />
          <StatCard
            icon={Users}
            label="Team Members"
            value={caregivers.length}
            color="#f59e0b"
            onPress={() => navigation.navigate('TeamManagement')}
          />
          <StatCard
            icon={Droplets}
            label="Hydration"
            value="Track"
            color="#06b6d4"
            onPress={() => navigation.navigate('HydrationTracker')}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddMedication', { caregiverId: user?.id || '' })}
          >
            <Plus size={20} color="#f8fafc" />
            <Text style={styles.actionButtonText}>Add Medication</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {medLogs.length === 0 ? (
            <View style={styles.emptyState}>
              <Clock size={40} color="#475569" />
              <Text style={styles.emptyText}>No medication logs today</Text>
            </View>
          ) : (
            medLogs.slice(0, 5).map(log => {
              const med = medications.find(m => m.id === log.medication_id);
              const caregiver = caregivers.find(c => c.id === log.taken_by);
              return (
                <View key={log.id} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <CheckCircle size={16} color="#34d399" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityMed}>{med?.name || 'Unknown'}</Text>
                    <Text style={styles.activityInfo}>
                      by {caregiver?.name || 'Unknown'} • {new Date(log.taken_at).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <User size={24} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('MedicationList')}
        >
          <Pill size={24} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('TeamManagement')}
        >
          <Users size={24} color="#64748b" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '900',
    color: '#f8fafc',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#94a3b8',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#f8fafc',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  actionButtonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: '#64748b',
    marginTop: 12,
    fontSize: 14,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  activityIcon: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityMed: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityInfo: {
    color: '#94a3b8',
    fontSize: 12,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1e293b',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  navItem: {
    padding: 8,
  },
});
