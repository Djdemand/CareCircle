import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CheckCircle, Clock, Pill } from 'lucide-react-native';

interface MedCardProps {
  name: string;
  dosage: string;
  windowLabel: string;
  isTaken: boolean;
  takenBy?: string;
  onPress: () => void;
  daysInfo: string;
}

/**
 * MedicationCard - Refactored for Dark Theme (USA Standard)
 */
export const MedicationCard = ({ 
  name, 
  dosage, 
  windowLabel, 
  isTaken, 
  takenBy, 
  onPress,
  daysInfo
}: MedCardProps) => {
  return (
    <View style={[styles.card, isTaken && styles.cardTaken]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Pill color="#3b82f6" size={20} />
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{windowLabel}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.dosage}>{dosage} • {daysInfo}</Text>
      </View>

      {isTaken ? (
        <View style={styles.statusRow}>
          <CheckCircle color="#34d399" size={14} />
          <Text style={styles.statusText}>Administered by {takenBy}</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.button} onPress={onPress}>
          <Text style={styles.buttonText}>Mark as Taken</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b', // Dark Slate
    borderRadius: 28,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  cardTaken: {
    opacity: 0.6,
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: '#f59e0b', // Urgent Orange
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fff',
    textTransform: 'uppercase',
  },
  content: {
    marginBottom: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  dosage: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.05)',
    paddingVertical: 10,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34d399',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }
});
