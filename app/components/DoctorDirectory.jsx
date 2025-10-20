// src/components/DoctorDirectory.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

// adjust paths if different in your project
import {
  getDoctorDetails,
  deleteDoctorDetails,
  saveDoctorDetails,
} from '../services/firebaseService';

import EditDoctorModal from './EditDoctorModal'; // <-- you already have this

const DoctorDirectory = ({ visible, onClose }) => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editVisible, setEditVisible] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const list = await getDoctorDetails();
      const sorted = (list || []).slice().sort((a, b) =>
        String(a?.doctorName || '').localeCompare(String(b?.doctorName || ''))
      );
      setDoctors(sorted);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to load doctors.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const onAdd = () => {
    setEditingDoctor(null);
    setEditVisible(true);
  };

  const onEdit = (doc) => {
    setEditingDoctor(doc);
    setEditVisible(true);
  };

  const onDelete = (id) => {
    Alert.alert('Delete Doctor', 'Are you sure you want to delete this doctor?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoctorDetails(id);
            await load();
          } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to delete doctor.');
          }
        },
      },
    ]);
  };

  const onSetPrimary = async (doctor) => {
    try {
      // First, remove primary from all doctors
      for (const doc of doctors) {
        if (doc.isPrimary && doc.id !== doctor.id) {
          await saveDoctorDetails({ ...doc, isPrimary: false });
        }
      }
      // Set this doctor as primary
      await saveDoctorDetails({ ...doctor, isPrimary: true });
      await load();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to set primary doctor.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
            <Icon name="x" size={22} color="#22577A" />
          </TouchableOpacity>
          <Text style={styles.title}>Doctors</Text>
          <TouchableOpacity onPress={onAdd}>
            <Icon name="plus-circle" size={22} color="#22577A" />
          </TouchableOpacity>
        </View>

        {/* Table */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, { flex: 1.2 }]}>Name</Text>
            <Text style={[styles.th, { flex: 1.2 }]}>Specialization</Text>
            <Text style={[styles.th, { flex: 1 }]}>Phone</Text>
            <Text style={[styles.th, { flex: 1 }]}>Hospital</Text>
            <Text style={[styles.th, { width: 60, textAlign: 'center' }]}>Primary</Text>
            <Text style={[styles.th, { width: 80, textAlign: 'center' }]}>Action</Text>
          </View>

          <ScrollView style={{ maxHeight: '85%' }}>
            {(doctors || []).length === 0 && !loading ? (
              <View style={{ paddingVertical: 18 }}>
                <Text style={{ textAlign: 'center', color: '#666' }}>
                  No doctors added yet
                </Text>
              </View>
            ) : (
              (doctors || []).map((d, idx) => (
                <View key={d?.id || idx} style={styles.tr}>
                  <Text
                    style={[
                      styles.td,
                      { flex: 1.2, fontWeight: '700', color: '#22577A' },
                    ]}
                  >
                    {d?.doctorName || '—'}
                  </Text>
                  <Text style={[styles.td, { flex: 1.2 }]}>
                    {(d?.specialization && String(d?.specialization)) || '—'}
                  </Text>
                  <Text style={[styles.td, { flex: 1 }]}>{d?.phoneNo || '—'}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>
                    {d?.hospitalName || '—'}
                  </Text>
                  <View
                    style={{
                      width: 60,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {d?.isPrimary ? (
                      <View style={styles.primaryBadge}>
                        <Icon name="star" size={14} color="#FFD700" />
                        <Text style={styles.primaryText}>Primary</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => onSetPrimary(d)}
                        style={styles.setPrimaryBtn}
                      >
                        <Text style={styles.setPrimaryText}>Set Primary</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View
                    style={{
                      width: 80,
                      justifyContent: 'center',
                      alignItems: 'center',
                      flexDirection: 'row',
                      gap: 8,
                    }}
                  >
                    <TouchableOpacity onPress={() => onEdit(d)} style={styles.iconBtn}>
                      <Icon name="edit" size={16} color="#22577A" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onDelete(d?.id)}
                      style={[styles.iconBtn, { backgroundColor: '#FFF0F0' }]}
                    >
                      <Icon name="trash-2" size={16} color="#dc3545" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>

      {/* Reuse your existing modal for Add/Edit */}
      <EditDoctorModal
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        currentDoctor={editingDoctor}
        onSave={() => {
          setEditVisible(false);
          load();
        }}
      />
    </Modal>
  );
};

export default DoctorDirectory;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F6F2' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E4DE',
    backgroundColor: '#FFFFFF',
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#22577A' },
  tableCard: {
    margin: 10,
    backgroundColor: '#E9E7E1',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#D7F9F1',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  th: { fontWeight: 'bold', color: '#22577A' },
  tr: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 6,
    alignItems: 'center',
  },
  td: { color: '#444' },
  iconBtn: {
    padding: 8,
    backgroundColor: 'rgba(34,87,122,0.08)',
    borderRadius: 10,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8DC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  primaryText: {
    fontSize: 10,
    color: '#B8860B',
    fontWeight: 'bold',
    marginLeft: 2,
  },
  setPrimaryBtn: {
    backgroundColor: '#22577A',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  setPrimaryText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: 'bold',
  },
});
