import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  TextInput
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../utils/supabase';
import { insertBMLog, getPatientCaregivers } from '../utils/multitenancyHelper';
import { CheckCircle, XCircle, Trash2, TrendingUp, Calendar } from 'lucide-react-native';

interface BMLog {
  id: string;
  had_bm: boolean;
  notes: string;
  logged_at: string;
  caregiver_id: string;
}

interface Caregiver {
  id: string;
  name: string;
}

export const BMTracker = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<BMLog[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadLogs();
    setupRealtimeSubscription();
  }, []);

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('bm_logs')
        .select('*')
        .order('logged_at', { ascending: false })
        .limit(20);

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
      .channel('bm-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bm_logs' }, () => {
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

  const handleLogBM = async (hadBM: boolean) => {
    if (!user) return;

    try {
      await insertBMLog(hadBM, notes, user.id);
      setNotes('');
      Alert.alert('Success', 'BM logged successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this log?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('bm_logs')
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

  const getLastBM = () => {
    return logs.find(log => log.had_bm);
  };

  const lastBM = getLastBM();
  const daysSinceLastBM = lastBM 
    ? Math.floor((new Date().getTime() - new Date(lastBM.logged_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIcon, daysSinceLastBM !== null && daysSinceLastBM > 2 ? styles.statusIconWarning : null]}>
              <Calendar size={32} color={daysSinceLastBM !== null && daysSinceLastBM > 2 ? "#ef4444" : "#10b981"} />
            </View>
            <View>
              <Text style={styles.statusTitle}>Bowel Health</Text>
              <Text style={[styles.statusSubtitle, daysSinceLastBM !== null && daysSinceLastBM > 2 ? styles.textWarning : null]}>
                {lastBM 
                  ? `Last BM: ${daysSinceLastBM === 0 ? 'Today' : `${daysSinceLastBM} days ago`}`
                  : 'No records yet'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Log Today</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Notes (optional)"
            placeholderTextColor="#64748b"
            value={notes}
            onChangeText={setNotes}
          />

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.yesButton]}
              onPress={() => handleLogBM(true)}
            >
              <CheckCircle size={24} color="#10b981" />
              <Text style={[styles.actionButtonText, styles.yesText]}>Had BM</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.noButton]}
              onPress={() => handleLogBM(false)}
            >
              <XCircle size={24} color="#ef4444" />
              <Text style={[styles.actionButtonText, styles.noText]}>No BM</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>History</Text>
            <View style={styles.trendBadge}>
              <TrendingUp size={12} color="#34d399" />
              <Text style={styles.trendText}>{logs.length} entries</Text>
            </View>
          </View>

          {logs.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={48} color="#475569" />
              <Text style={styles.emptyText}>No logs recorded</Text>
            </View>
          ) : (
            logs.map(log => {
              const caregiver = caregivers.find(c => c.id === log.caregiver_id); // Note: schema uses caregiver_id
              return (
                <View key={log.id} style={styles.logItem}>
                  <View style={styles.logIcon}>
                    {log.had_bm ? (
                      <CheckCircle size={16} color="#10b981" />
                    ) : (
                      <XCircle size={16} color="#ef4444" />
                    )}
                  </View>
                  <View style={styles.logContent}>
                    <Text style={[styles.logStatus, log.had_bm ? styles.textSuccess : styles.textError]}>
                      {log.had_bm ? 'Had BM' : 'No BM'}
                    </Text>
                    <Text style={styles.logInfo}>
                      {new Date(log.logged_at).toLocaleDateString()} • {new Date(log.logged_at).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}
                    </Text>
                    {log.notes ? <Text style={styles.logNotes}>{log.notes}</Text> : null}
                    <Text style={styles.logAuthor}>by {caregiver?.name || 'Unknown'}</Text>
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
  statusCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statusIconWarning: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  textWarning: {
    color: '#ef4444',
    fontWeight: '700',
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
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    color: '#f8fafc',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  yesButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  noButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  yesText: {
    color: '#10b981',
  },
  noText: {
    color: '#ef4444',
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
    alignItems: 'flex-start',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  logIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  logContent: {
    flex: 1,
  },
  logStatus: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  textSuccess: {
    color: '#10b981',
  },
  textError: {
    color: '#ef4444',
  },
  logInfo: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
  },
  logNotes: {
    color: '#cbd5e1',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  logAuthor: {
    color: '#64748b',
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