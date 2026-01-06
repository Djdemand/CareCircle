import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../utils/supabase';
import { insertJuiceLog, getPatientCaregivers } from '../utils/multitenancyHelper';
import { Droplets, Plus, Trash2, Target, TrendingUp, CupSoda } from 'lucide-react-native';

interface JuiceLog {
  id: string;
  amount_ml: number;
  logged_at: string;
  logged_by: string;
}

interface Caregiver {
  id: string;
  name: string;
}

export const JuiceTracker = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<JuiceLog[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyGoal] = useState(500); // 500ml default goal for juice

  useEffect(() => {
    loadLogs();
    setupRealtimeSubscription();
  }, []);

  const loadLogs = async () => {
    try {
      const now = new Date();
      const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      
      const { data, error } = await supabase
        .from('juice_logs')
        .select('*')
        .gte('logged_at', localMidnight)
        .order('logged_at', { ascending: false });

      if (error) throw error;

      if (data) setLogs(data);

      const caregiversData = await getPatientCaregivers();
      if (caregiversData) setCaregivers(caregiversData);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('juice-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'juice_logs' }, () => {
        loadLogs();
      })
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  };

  const handleAddJuice = async (amount: number) => {
    if (!user) return;

    try {
      await insertJuiceLog(amount, user.id);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this juice log?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('juice_logs')
                .delete()
                .eq('id', logId);

              if (error) throw error;
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const getTodayTotal = () => {
    return logs.reduce((sum, log) => sum + log.amount_ml, 0);
  };

  const getProgress = () => {
    const total = getTodayTotal();
    return Math.min((total / dailyGoal) * 100, 100);
  };

  const getRemaining = () => {
    const total = getTodayTotal();
    return Math.max(0, dailyGoal - total);
  };

  const formatAmount = (ml: number) => {
    const oz = (ml / 29.57).toFixed(0);
    return `${oz} oz`;
  };

  const JuiceButton = ({ amount, label }: { amount: number; label: string }) => (
    <TouchableOpacity 
      style={styles.juiceButton}
      onPress={() => handleAddJuice(amount)}
    >
      <CupSoda size={24} color="#f97316" />
      <Text style={styles.juiceButtonLabel}>{label}</Text>
      <Text style={styles.juiceButtonAmount}>{formatAmount(amount)}</Text>
    </TouchableOpacity>
  );

  const todayTotal = getTodayTotal();
  const progress = getProgress();
  const remaining = getRemaining();

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressIcon}>
              <CupSoda size={32} color="#f97316" />
            </View>
            <View>
              <Text style={styles.progressTitle}>Today's Juice</Text>
              <Text style={styles.progressSubtitle}>
                {remaining > 0 ? `${formatAmount(remaining)} remaining` : 'Goal reached! 🎉'}
              </Text>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatAmount(todayTotal)}</Text>
              <Text style={styles.statLabel}>Consumed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatAmount(dailyGoal)}</Text>
              <Text style={styles.statLabel}>Goal</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
          <View style={styles.juiceButtonsGrid}>
            <JuiceButton amount={120} label="Small" />
            <JuiceButton amount={240} label="Cup" />
            <JuiceButton amount={350} label="Large" />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Log</Text>
            {logs.length > 0 && (
              <View style={styles.trendBadge}>
                <TrendingUp size={12} color="#34d399" />
                <Text style={styles.trendText}>{logs.length} entries</Text>
              </View>
            )}
          </View>

          {logs.length === 0 ? (
            <View style={styles.emptyState}>
              <CupSoda size={48} color="#475569" />
              <Text style={styles.emptyText}>No juice logged today</Text>
            </View>
          ) : (
            logs.map(log => {
              const caregiver = caregivers.find(c => c.id === log.logged_by);
              return (
                <View key={log.id} style={styles.logItem}>
                  <View style={styles.logIcon}>
                    <CupSoda size={16} color="#f97316" />
                  </View>
                  <View style={styles.logContent}>
                    <Text style={styles.logAmount}>{formatAmount(log.amount_ml)}</Text>
                    <Text style={styles.logInfo}>
                      by {caregiver?.name || 'Unknown'} • {new Date(log.logged_at).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteLog(log.id)}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
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
  },
  scrollContent: {
    padding: 20,
  },
  progressCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    flex: 1,
    height: 12,
    backgroundColor: '#0f172a',
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f97316',
    borderRadius: 6,
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    minWidth: 45,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#334155',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  trendText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '600',
  },
  juiceButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  juiceButton: {
    width: '30%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  juiceButtonLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  juiceButtonAmount: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  logIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logContent: {
    flex: 1,
  },
  logAmount: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  logInfo: {
    color: '#94a3b8',
    fontSize: 12,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});