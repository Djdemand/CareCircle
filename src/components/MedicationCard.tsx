import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, GestureResponderEvent } from 'react-native';
import { CheckCircle, Clock, Pill, Edit2, Trash2, GripVertical } from 'lucide-react-native';

interface MedCardProps {
  name: string;
  dosage: string;
  windowLabel: string;
  isTaken: boolean;
  takenBy?: string;
  onPress: () => void;
  daysInfo: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  isDragging?: boolean;
}

/**
 * MedicationCard - Refactored for Dark Theme (USA Standard)
 * - Status badge moved to top left
 * - Added edit/delete action buttons
 * - Added drag handle for reordering
 */
export const MedicationCard = ({
  name,
  dosage,
  windowLabel,
  isTaken,
  takenBy,
  onPress,
  daysInfo,
  onEdit,
  onDelete,
  onLongPress,
  isDragging
}: MedCardProps) => {
  return (
    <View
      style={[styles.card, isTaken && styles.cardTaken, isDragging && styles.cardDragging]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{windowLabel}</Text>
          </View>
          <View style={styles.iconContainer}>
            <Pill color="#3b82f6" size={20} />
          </View>
        </View>
        <TouchableOpacity
          style={styles.dragHandle}
          onPressIn={onLongPress}
          activeOpacity={0.7}
        >
          <GripVertical color="#64748b" size={20} />
        </TouchableOpacity>
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

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {onEdit && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onEdit}
            activeOpacity={0.7}
          >
            <Edit2 size={20} color="#3b82f6" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={onDelete}
            activeOpacity={0.7}
          >
            <Trash2 size={20} color="#ef4444" />
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
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
  cardDragging: {
    opacity: 0.8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  dragHandle: {
    padding: 8,
    borderRadius: 8,
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
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  actionButtonText: {
    color: '#3b82f6',
    fontWeight: '700',
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  deleteButtonText: {
    color: '#ef4444',
  },
});
