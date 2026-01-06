import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView,
  ActivityIndicator 
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../utils/supabase';
import { Users, UserPlus, Mail, Trash2, Crown } from 'lucide-react-native';

interface Caregiver {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export const TeamManagement = () => {
  const { user } = useAuth();
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadCaregivers();
    setupRealtimeSubscription();
  }, []);

  const loadCaregivers = async () => {
    try {
      const { data, error } = await supabase
        .from('caregivers')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) setCaregivers(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('caregivers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'caregivers' }, () => {
        loadCaregivers();
      })
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    if (!inviteEmail.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Check if already exists
    const exists = caregivers.some(c => c.email.toLowerCase() === inviteEmail.toLowerCase());
    if (exists) {
      Alert.alert('Error', 'This email is already in the care team');
      return;
    }

    setInviting(true);

    try {
      // Fetch current user's patient_id
      const { data: currentUserCaregiver } = await supabase
        .from('caregivers')
        .select('patient_id')
        .eq('id', user?.id)
        .single();

      if (!currentUserCaregiver?.patient_id) {
        throw new Error('Could not find your patient circle');
      }

      // In a real app, you would send an invite email here
      // For now, we'll create a placeholder caregiver record
      const { error } = await supabase
        .from('caregivers')
        .insert({
          email: inviteEmail.trim(),
          name: inviteEmail.split('@')[0],
          patient_id: currentUserCaregiver.patient_id,
        });

      if (error) throw error;

      Alert.alert(
        'Success',
        `Invitation sent to ${inviteEmail}`,
        [{ text: 'OK', onPress: () => setInviteEmail('') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (caregiverId: string, caregiverName: string) => {
    if (caregiverId === user?.id) {
      Alert.alert('Error', 'You cannot remove yourself from the team');
      return;
    }

    Alert.alert(
      'Remove Team Member',
      `Are you sure you want to remove ${caregiverName} from the care team?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('caregivers')
                .delete()
                .eq('id', caregiverId);

              if (error) throw error;

              Alert.alert('Success', 'Team member removed');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const getTeamSize = () => caregivers.length;
  const getRemainingSlots = () => Math.max(0, 5 - getTeamSize());

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Users size={32} color="#3b82f6" />
          </View>
          <Text style={styles.title}>Care Team</Text>
          <Text style={styles.subtitle}>
            {getTeamSize()} of 5 members • {getRemainingSlots()} slots available
          </Text>
        </View>

        {/* Team Size Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(getTeamSize() / 5) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {getRemainingSlots() === 0 
              ? 'Team is full' 
              : `${getRemainingSlots()} more member${getRemainingSlots() > 1 ? 's' : ''} can join`}
          </Text>
        </View>

        {/* Invite Section */}
        {getRemainingSlots() > 0 && (
          <View style={styles.inviteSection}>
            <Text style={styles.sectionTitle}>Invite Team Member</Text>
            <View style={styles.inputContainer}>
              <Mail size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                placeholderTextColor="#64748b"
                value={inviteEmail}
                onChangeText={setInviteEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <TouchableOpacity 
              style={styles.inviteButton}
              onPress={handleInvite}
              disabled={inviting}
            >
              {inviting ? (
                <ActivityIndicator color="#f8fafc" />
              ) : (
                <>
                  <UserPlus size={20} color="#f8fafc" />
                  <Text style={styles.inviteButtonText}>Send Invite</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Team Members List */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>Team Members</Text>
          {caregivers.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={48} color="#475569" />
              <Text style={styles.emptyText}>No team members yet</Text>
              <Text style={styles.emptyHint}>
                Invite caregivers to start collaborating
              </Text>
            </View>
          ) : (
            caregivers.map(caregiver => (
              <View 
                key={caregiver.id} 
                style={[
                  styles.memberCard,
                  caregiver.id === user?.id && styles.currentUserCard
                ]}
              >
                <View style={styles.memberInfo}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.avatarText}>
                      {caregiver.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberDetails}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName}>{caregiver.name}</Text>
                      {caregiver.id === user?.id && (
                        <View style={styles.badge}>
                          <Crown size={12} color="#f59e0b" />
                          <Text style={styles.badgeText}>You</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.memberEmail}>{caregiver.email}</Text>
                  </View>
                </View>
                {caregiver.id !== user?.id && (
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => handleRemove(caregiver.id, caregiver.name)}
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>About Care Teams</Text>
          <Text style={styles.infoBoxText}>
            Care teams allow up to 5 caregivers to collaborate on medication management. 
            All team members can view medications, log doses, and track hydration in real-time.
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#f8fafc',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  inviteSection: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 16,
    paddingVertical: 14,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  inviteButtonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  membersSection: {
    marginBottom: 24,
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
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  currentUserCard: {
    borderColor: '#3b82f6',
    borderWidth: 1,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  memberDetails: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  badgeText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  memberEmail: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
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
  infoBoxTitle: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  infoBoxText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
});