// components/DoctorsTableModal.tsx
import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import Icon from "react-native-vector-icons/Feather";

const DoctorsTablesModal = ({ visible, onClose, doctors = [], onAdd, onEdit, onDelete }) => {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Back">
            <Icon name="arrow-left" size={22} color="#6B705B" />
          </TouchableOpacity>
          <Text style={styles.title}>Doctors</Text>
          <TouchableOpacity onPress={onAdd} style={styles.addBtn}>
            <Icon name="plus" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Add Doctor</Text>
          </TouchableOpacity>
        </View>

        {/* Table header */}
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.th, { flex: 1.2 }]}>Name</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>Specialization</Text>
          <Text style={[styles.th, { flex: 1 } ]}>Phone</Text>
          <Text style={[styles.th, { flex: 0.8 }]}>Hospital</Text>
          <Text style={[styles.th, { flex: 0.6 }]}>Action</Text>
        </View>

        {/* Table body */}
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {doctors.length === 0 ? (
            <View style={styles.emptyState}><Text style={styles.emptyText}>No doctors added yet</Text></View>
          ) : (
            doctors.map((d, idx) => (
              <View key={d.id || idx} style={styles.tr}>
                <Text style={[styles.td, { flex: 1.2 }]} numberOfLines={1}>{d?.doctorName || '—'}</Text>
                <Text style={[styles.td, { flex: 1.2 }]} numberOfLines={1}>{d?.specialization || '—'}</Text>
                <Text style={[styles.td, { flex: 1 }]} numberOfLines={1}>{d?.phoneNo || '—'}</Text>
                <Text style={[styles.td, { flex: 0.8 }]} numberOfLines={1}>{d?.hospitalName || '—'}</Text>
                <View style={[styles.td, { flex: 0.6, flexDirection: 'row', justifyContent: 'center', gap: 8 }]}>
                  <TouchableOpacity onPress={() => onEdit(d)} style={styles.iconButton}>
                    <Icon name="edit" size={18} color="#22577A" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => d?.id && onDelete(d.id)} style={styles.iconButton}>
                    <Icon name="trash-2" size={18} color="#dc3545" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

export default DoctorsTablesModal;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0'
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#22577A' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#22577A', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: 'bold' },

  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#D7F9F1', paddingVertical: 10, paddingHorizontal: 12 },
  th: { fontWeight: 'bold', color: '#22577A' },

  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  td: { color: '#444' },

  emptyState: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#666' },

  iconButton: { padding: 6, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)' },
});
