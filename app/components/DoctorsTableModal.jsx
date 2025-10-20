// components/DoctorsTableModal.js
import React, { useEffect, useState, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import Icon from "react-native-vector-icons/Feather";
import {
    getDoctorDetails,
    deleteDoctorDetails
} from "../services/firebaseService";
import EditDoctorModal from "../components/EditDoctorModal";

const DoctorsTableModal = ({ visible, onClose, onChanged, doctors }) => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editVisible, setEditVisible] = useState(false);
    const [currentRow, setCurrentRow] = useState(null); // pass into EditDoctorModal
    const [showLimitAlert, setShowLimitAlert] = useState(false);
    console.log("doctors length in table modal:", doctors.length);


    const load = useCallback(async () => {
        try {
            setLoading(true);
            const docs = await getDoctorDetails();
            setRows(docs || []);
        } catch (e) {
            console.error('Failed to load doctors', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (visible) load();
    }, [visible, load]);

    const openAdd = () => {
        if (rows.length >= 1) {
            setShowLimitAlert(true);
            return;
        }
        setCurrentRow(null);
        setEditVisible(true);
    };

    const openEdit = (row) => {
        setCurrentRow(row);
        setEditVisible(true);
    };

    const handleDelete = async (id) => {
        Alert.alert(
            'Delete Doctor',
            'Are you sure you want to delete this doctor?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoctorDetails(id);
                            // ✅ Immediately update local state
                            setRows(prev => prev.filter(row => row.id !== id));
                            // ✅ Call onChanged to update parent
                            if (onChanged) onChanged();
                            // ✅ Show success message
                            Alert.alert('Success', 'Doctor deleted successfully');
                        } catch (e) {
                            console.error('Delete error:', e);
                            Alert.alert('Error', 'Failed to delete doctor');
                        }
                    }
                }
            ]
        );
    };

    const handleSaved = async () => {
        setEditVisible(false);
        await load();
        if (onChanged) onChanged();
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
                        <Icon name="x" size={22} color="#6B705B" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Doctors</Text>
                    <TouchableOpacity onPress={openAdd}>
                        {doctors.length === 0 && (
                            <Text style={styles.addBtn}>+ Add</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Body */}
                {loading ? (
                    <View style={styles.loader}>
                        <ActivityIndicator size="large" color="#22577A" />
                    </View>
                ) : (
                    <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }}>
                        {/* Table header */}
                        <View style={[styles.row, styles.headRow]}>
                            <Text style={[styles.cell, styles.headCell, { flex: 1.3 }]}>Doctor Name</Text>
                            <Text style={[styles.cell, styles.headCell]}>Specialization</Text>
                            <Text style={[styles.cell, styles.headCell]}>Phone</Text>
                            <Text style={[styles.cell, styles.headCell]}>Hospital</Text>
                            <Text style={[styles.cell, styles.headCell, styles.actionsCol]}>Actions</Text>
                        </View>

                        {/* Rows */}
                        {rows.length === 0 ? (
                            <View style={styles.emptyWrap}>
                                <Text style={styles.emptyText}>No doctors added yet.</Text>
                            </View>
                        ) : (
                            rows.map(r => (
                                <View key={r.id} style={styles.row}>
                                    <Text style={[styles.cell, { flex: 1.3 }]} numberOfLines={1} ellipsizeMode="tail">
                                        {r.doctorName || '—'}
                                    </Text>
                                    <Text style={styles.cell} numberOfLines={1} ellipsizeMode="tail">
                                        {r.specialization || '—'}
                                    </Text>
                                    <Text style={styles.cell} numberOfLines={1} ellipsizeMode="tail">
                                        {r.phoneNo || '—'}
                                    </Text>
                                    <Text style={styles.cell} numberOfLines={1} ellipsizeMode="tail">
                                        {r.hospitalName || '—'}
                                    </Text>
                                    <View style={[styles.cell, styles.actionsCol]}>
                                        <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(r)}>
                                            <Icon name="edit-2" size={16} color="#22577A" />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(r.id)}>
                                            <Icon name="trash-2" size={16} color="#EB2F29" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
                )}
            </View>

            {/* Re-use your existing EditDoctorModal for add/edit */}
            <EditDoctorModal
                visible={editVisible}
                onClose={() => setEditVisible(false)}
                currentDoctor={currentRow}
                onSave={handleSaved}
            />
        </Modal>
    );
};

export default DoctorsTableModal;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0'
    },
    title: { fontSize: 18, fontWeight: 'bold', color: '#22577A' },
    addBtn: { color: '#22577A', fontSize: 16, fontWeight: 'bold' },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    body: { paddingHorizontal: 12, paddingTop: 12 },

    headRow: {
        backgroundColor: '#F3F5F7',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    row: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
    },
    headCell: { fontWeight: '700', color: '#465D69' },
    cell: {
        flex: 1,
        color: '#2a3a44',
        fontSize: 14,
        paddingRight: 8,
    },
    actionsCol: {
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'flex-start',
        alignItems: 'center',
        flex: 0.9,
    },
    iconBtn: {
        padding: 6,
        backgroundColor: '#EEF5F2',
        borderRadius: 6,
    },
    emptyWrap: { paddingVertical: 24, alignItems: 'center' },
    emptyText: { color: '#6b6b6b' },
});
