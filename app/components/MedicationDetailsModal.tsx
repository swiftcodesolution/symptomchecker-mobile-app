import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

interface MedicationDetailsModalProps {
  visible: boolean;
  medication: any;
  onClose: () => void;
  onEdit?: (medication: any) => void;
  onDelete?: (medicationId: string) => void;
}

const MedicationDetailsModal: React.FC<MedicationDetailsModalProps> = ({
  visible,
  medication,
  onClose,
  onEdit,
  onDelete
}) => {
  if (!medication) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleEdit = () => {
    onClose();
    if (onEdit) {
      onEdit(medication);
    }
  };

  const handleDelete = () => {
    onClose();
    if (onDelete) {
      onDelete(medication.id);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Medicine Details</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="x" size={24} color="#6B705B" />
              </TouchableOpacity>
            </View>

            {/* Medicine Details */}
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Medicine Name</Text>
                <Text style={styles.detailValue}>{medication.name}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Dosage</Text>
                <Text style={styles.detailValue}>{medication.dosage}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Frequency</Text>
                <Text style={styles.detailValue}>{medication.frequency} times per day</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time to Take</Text>
                <Text style={styles.detailValue}>{medication.timeToTake}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Refill Date</Text>
                <Text style={styles.detailValue}>{formatDate(medication.refillDate)}</Text>
              </View>

              {medication.createdAt && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Added On</Text>
                  <Text style={styles.detailValue}>{formatDate(medication.createdAt)}</Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            {onEdit && onDelete && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                  <Icon name="edit-2" size={18} color="#fff" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                  <Icon name="trash-2" size={18} color="#fff" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default MedicationDetailsModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6B705B',
  },
  closeButton: {
    padding: 5,
  },
  detailsContainer: {
    marginBottom: 30,
  },
  detailRow: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E9E9E0',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#24507A',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 18,
    color: '#495057',
    fontWeight: '400',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#6B705B',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#E63946',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
