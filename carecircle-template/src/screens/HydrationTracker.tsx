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
import { Droplets, Plus, Trash2, Target, TrendingUp } from 'lucide-react-native';

interface HydrationLog {
  id: string;
  amount_ml: number;
  logged_at: string;
  logged_by: string;
}

interface Caregiver {
  id: string;
  name: string;
}

export const HydrationTracker = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<HydrationLog[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyGoal] = useState(2000); // 2 liters default goal

  useEffect(() => {
    loadLogs();
    setupRealtimeSubscription();
  }, []);

  const loadLogs = async () => {
    try {
      // Load today's hydration logs - use local midnight to avoid timezone issues
      const now = new Date();
      const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      
      const { data, error } = await supabase
        .from('hydration_logs')
        .select('*')
        .gte('logged_at', localMidnight)
        .order('logged_at', { ascending: false });

      if (error) throw error;

      if (data) setLogs(data);

      // Load caregivers
      const { data: caregiversData } = await supabase
        .from('caregivers')
        .select('*');

      if (caregiversData) setCaregivers(caregiversData);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('hydration-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hydration_logs' }, () => {
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

  const handleAddWater = async (amount: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('hydration_logs')
        .insert({
          amount_ml: amount,
          logged_at: new Date().toISOString(),
          logged_by: user.id,
        });

      if (error) throw error;
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this hydration log?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('hydration_logs')
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

  const getGlassesCount = () => {
    const total = getTodayTotal();
    return Math.floor(total / 250); // Assuming 250ml per glass
  };

  const formatAmount = (ml: number) => {
    if (ml >= 1000) {
      return `${(ml / 1000).toFixed(1)}L`;
    }
    // Convert ml to oz for display (1 oz ≈ 29.57 ml)
    const oz = (ml / 29.57).toFixed(0);
    return `${oz} oz`; // Ensure space between number and "oz"
  };

  const WaterButton = ({ amount, label }: { amount: number; label: string }) => (
    <TouchableOpacity 
      style={styles.waterButton}
      onPress={() => handleAddWater(amount)}
    >
      <Droplets size={24} color="#3b82f6" />
      <Text style={styles.waterButtonLabel}>{label}</Text>
      <Text style={styles.waterButtonAmount}>{formatAmount(amount)}</Text>
    </TouchableOpacity>
  );

  const todayTotal = getTodayTotal();
  const progress = getProgress();
  const remaining = getRemaining();
  const glasses = getGlassesCount();

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressIcon}>
              <Droplets size={32} color="#3b82f6" />
            </View>
            <View>
              <Text style={styles.progressTitle}>Today's Hydration</Text>
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
              <Text style={styles.statValue}>{glasses}</Text>
              <Text style={styles.statLabel}>Glasses</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatAmount(dailyGoal)}</Text>
              <Text style={styles.statLabel}>Goal</Text>
            </View>
          </View>
        </View>

        {/* Quick Add Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
          <View style={styles.waterButtonsGrid}>
            <WaterButton amount={150} label="Small" />
            <WaterButton amount={250} label="Glass" />
            <WaterButton amount={350} label="Large" />
            <WaterButton amount={500} label="Bottle" />
          </View>
        </View>

        {/* Today's Logs */}
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
              <Droplets size={48} color="#475569" />
              <Text style={styles.emptyText}>No hydration logged today</Text>
              <Text style={styles.emptyHint}>
                Tap a quick add button to start tracking
              </Text>
            </View>
          ) : (
            logs.map(log => {
              const caregiver = caregivers.find(c => c.id === log.logged_by);
              return (
                <View key={log.id} style={styles.logItem}>
                  <View style={styles.logIcon}>
                    <Droplets size={16} color="#3b82f6" />
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

        {/* Goal Info */}
        <View style={styles.infoBox}>
          <View style={styles.infoBoxHeader}>
            <Target size={20} color="#3b82f6" />
            <Text style={styles.infoBoxTitle}>Daily Goal</Text>
          </View>
          <Text style={styles.infoBoxText}>
            The recommended daily water intake is approximately 2 liters (8 glasses). 
            Adjust this goal based on your individual needs, activity level, and climate.
          </Text>
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
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
    backgroundColor: '#3b82f6',
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
  waterButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  waterButton: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  waterButtonLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  waterButtonAmount: {
    color: '#f8fafc',
    fontSize: 18,
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
  emptyHint: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 4,
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
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
  infoBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  infoBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoBoxTitle: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '700',
  },
  infoBoxText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
});
