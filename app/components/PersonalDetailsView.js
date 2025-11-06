import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import EditPersonalDetailsModal from './EditPersonalDetailsModal';
import { getAuth } from 'firebase/auth';
import { useSelector } from 'react-redux';
import { selectUserData } from '../redux/slices/userProfileSlice';
import { selectAnswers } from '../redux/slices/userInfoSlice';
import { questionsData } from '../collect-user-info';
import { firebaseAuth, firestore } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const Row = ({ label, value }) => (
    <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value || '—'}</Text>
    </View>
);

const PersonalDetailsView = ({ visible, onClose, currentDetails, onUpdated }) => {
    const [editVisible, setEditVisible] = useState(false);
    const [savedContacts, setSavedContacts] = useState({ phone: null, address: null });
    const auth = getAuth();
    const user = auth.currentUser;
    
    // Get user data from Redux store
    const userData = useSelector(selectUserData);
    const localAnswers = useSelector(selectAnswers);

    // Load saved contacts from Firestore/Redux when modal opens (same as medical-wallet)
    useEffect(() => {
        if (visible) {
            loadSavedContacts();
        }
    }, [visible, localAnswers]);

    const loadSavedContacts = async () => {
        try {
            // Load phone and address from Firestore/Redux (same as medical-wallet)
            let phoneValue = '';
            let addressValue = '';
            
            // Find the indices for phone and address in questionsData
            const phoneIndex = questionsData.findIndex(q => q.question.includes('Phone Number'));
            const addressIndex = questionsData.findIndex(q => q.question.includes('Home Address'));
            
            // Try to get from Redux first
            if (localAnswers && Object.keys(localAnswers).length > 0) {
                phoneValue = localAnswers[phoneIndex]?.answer || '';
                addressValue = localAnswers[addressIndex]?.answer || '';
            }
            
            // If not in Redux, try to load from Firestore
            if (!phoneValue && !addressValue) {
                const user = firebaseAuth.currentUser;
                if (user) {
                    const snap = await getDoc(doc(firestore, 'users', user.uid));
                    if (snap.exists() && Array.isArray(snap.data()?.answers)) {
                        const fbAnswers = snap.data().answers;
                        phoneValue = fbAnswers[phoneIndex]?.answer || '';
                        addressValue = fbAnswers[addressIndex]?.answer || '';
                    }
                }
            }
            
            console.log("🔍 PersonalDetailsView: Loading phone and address from Firestore/Redux:", { phoneValue, addressValue });
            setSavedContacts({ phone: phoneValue, address: addressValue });
        } catch (error) {
            console.error('Error loading saved contacts:', error);
        }
    };

    console.log("currentDetails", currentDetails);
    console.log("savedContacts", savedContacts);

    // No need for complex extraction - just use savedContacts directly
    // Phone and address come from AsyncStorage (same as search-history)
    // Name and email come from Redux store

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose}><Icon name="x" size={22} color="#22577A" /></TouchableOpacity>
                    <Text style={styles.title}>Personal Details</Text>
                    <TouchableOpacity>
                        {/* <Icon name="edit-2" size={20} color="#22577A" /> */}
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <Row label="Name" value={userData.displayName || user?.displayName} />
                    <Row label="Phone Number" value={savedContacts.phone} />
                    <Row label="Email" value={userData.email || user.email} />
                    <Row label="Address" value={savedContacts.address} />
                </View>
            </View>

            <EditPersonalDetailsModal
                visible={editVisible}
                onClose={() => setEditVisible(false)}
                currentDetails={currentDetails}
                onSave={() => {
                    setEditVisible(false);
                    onUpdated && onUpdated();
                    // Reload saved contacts after update
                    loadSavedContacts();
                }}
            />
        </Modal>
    );
};

export default PersonalDetailsView;

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
        backgroundColor: '#FFF' 
    },
    title: { fontSize: 18, fontWeight: 'bold', color: '#22577A' },
    card: { 
        margin: 12, 
        backgroundColor: '#E9E7E1', 
        borderRadius: 16, 
        padding: 16 
    },
    row: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        paddingVertical: 8, 
        borderBottomWidth: 1, 
        borderBottomColor: '#E7E4DC' 
    },
    label: { 
        color: '#22577A', 
        fontWeight: '700', 
        width: '40%' 
    },
    value: { 
        color: '#444', 
        textAlign: 'right',
        flex: 1
    },
    valueContainer: {
        width: '58%',
        alignItems: 'flex-end'
    },
    savedBadge: {
        color: '#00C853',
        fontWeight: 'bold'
    },
    savedNote: {
        fontSize: 10,
        color: '#666',
        fontStyle: 'italic',
        marginTop: 2
    },
    infoBox: {
        margin: 12,
        padding: 16,
        backgroundColor: '#E3F2FD',
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#2196F3'
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1976D2',
        marginBottom: 8
    },
    infoText: {
        fontSize: 14,
        color: '#444',
        marginBottom: 4
    },
    infoNote: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        marginTop: 4
    }
});