import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import EditPersonalDetailsModal from './EditPersonalDetailsModal';
import { getAuth } from 'firebase/auth';
import { getSavedData } from '../utils/storage'; // Import your storage utility

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

    // Load saved contacts from local storage when modal opens
    useEffect(() => {
        if (visible) {
            loadSavedContacts();
        }
    }, [visible]);

    const loadSavedContacts = async () => {
        try {
            const data = await getSavedData();
            setSavedContacts(data);
            console.log('Loaded saved contacts for PersonalDetailsView:', data);
        } catch (error) {
            console.error('Error loading saved contacts:', error);
        }
    };

    console.log("currentDetails", currentDetails);
    console.log("savedContacts", savedContacts);

    const extractPersonalDetails = (details, savedContacts) => {
        if (!details) return {};

        let phoneNumber = savedContacts.phone || '—';
        let address = savedContacts.address || '—';
        let city = '—';
        let state = '—';
        let zipCode = '—';

        // Only use currentDetails if we don't have saved contacts
        if (details.address && address === '—') {
            const addressParts = details.address.split(', ');

            // Phone number usually last part with numbers only
            const possiblePhone = addressParts[addressParts.length - 1];

            // Check if this looks like a phone number (contains only digits and is 10-15 digits)
            if (/^\d{10,15}$/.test(possiblePhone.replace(/\D/g, ''))) {
                phoneNumber = phoneNumber === '—' ? possiblePhone : phoneNumber;
                // Remove phone number from address
                addressParts.pop();
                address = address === '—' ? addressParts.join(', ') : address;
            } else {
                address = address === '—' ? details.address : address;
            }
        }

        // Extract other fields if available
        if (details.contactNo && details.contactNo !== '14lb' && phoneNumber === '—') {
            phoneNumber = details.contactNo;
        }

        return {
            phoneNumber,
            address: address !== '—' ? address : (details.address || '—'),
            city: details.city || '—',
            state: details.state || '—',
            zipCode: details.zipCode || '—',
            dateOfBirth: details.dateOfBirth || details.name || '—', // name field mein DOB hai
            age: details.age || '—',
            gender: details.gender || '—',
            ethnicity: details.ethnicity || '—',
            height: details.height || '—',
            weight: details.weight || (details.email !== '25' ? details.email : '—'), // email field mein weight hai
            email: user?.email || '—'
        };
    };

    const cleanedDetails = extractPersonalDetails(currentDetails, savedContacts);

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
                    <Row label="Name" value={user?.displayName} />
                    <Row label="Phone Number" value={savedContacts.phone} />

                    <Row label="Email" value={user.email} />
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