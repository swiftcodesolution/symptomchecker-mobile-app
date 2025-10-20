import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert
} from 'react-native';
import { savePharmacyDetails } from '../services/firebaseService';
import Icon from "react-native-vector-icons/Feather";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";

const EditPharmacyModal = ({ visible, onClose, currentPharmacy, onSave }) => {
    const [formData, setFormData] = useState({
        pharmacyName: '',
        address: '',
        phoneNo: '',
        email: '',
        operatingHours: '',
        services: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recognizing, setRecognizing] = useState(false);
    const [currentField, setCurrentField] = useState(null);

    // Speech recognition setup
    useSpeechRecognitionEvent("start", () => setRecognizing(true));
    useSpeechRecognitionEvent("end", () => {
        setRecognizing(false);
        setIsRecording(false);
    });
    useSpeechRecognitionEvent("result", (event) => {
        const transcript = event.results[0].transcript;
        if (currentField) {
            updateField(currentField, transcript);
        }
        if (event.isFinal) {
            stopVoiceRecognition();
        }
    });
    useSpeechRecognitionEvent("error", (event) => {
        // Alert.alert("Error", "Voice recognition failed");
        setIsRecording(false);
        setRecognizing(false);
    });

    useEffect(() => {
        // Request permissions when component mounts
        (async () => {
            const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
            if (!result.granted) {
                console.warn("Permissions not granted", result);
            }
        })();

        return () => {
            if (isRecording) {
                stopVoiceRecognition();
            }
        };
    }, []);

    const startVoiceRecognition = async (field) => {
        try {
            setCurrentField(field);
            setIsRecording(true);
            await ExpoSpeechRecognitionModule.start({
                lang: "en-US",
                interimResults: true,
                continuous: true,
            });
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            setIsRecording(false);
            Alert.alert('Error', 'Failed to start voice recognition');
        }
    };

    const stopVoiceRecognition = async () => {
        try {
            await ExpoSpeechRecognitionModule.stop();
            setIsRecording(false);
        } catch (error) {
            console.error('Error stopping speech recognition:', error);
        }
    };

    const handleVoiceInput = (field) => {
        if (isRecording && currentField === field) {
            stopVoiceRecognition();
        } else {
            if (isRecording) {
                stopVoiceRecognition().then(() => startVoiceRecognition(field));
            } else {
                startVoiceRecognition(field);
            }
        }
    };

    useEffect(() => {
        if (currentPharmacy) {
            setFormData(currentPharmacy);
        } else {
            setFormData({
                pharmacyName: '',
                address: '',
                phoneNo: '',
                email: '',
                operatingHours: '',
                services: '',
                notes: ''
            });
        }
    }, [currentPharmacy]);

    const handleSave = async () => {
        if (!formData.pharmacyName || !formData.address) {
            Alert.alert('Error', 'Pharmacy name and address are required.');
            return;
        }

        try {
            setLoading(true);

            const filteredData = {};
            Object.keys(formData).forEach(key => {
                const value = formData[key];
                // Check if value exists and is a string before trimming
                if (value !== undefined && value !== null && typeof value === 'string') {
                    const trimmedValue = value.trim();
                    if (trimmedValue !== '') {
                        filteredData[key] = trimmedValue;
                    }
                } else if (value !== undefined && value !== null) {
                    // For non-string values (though your form seems to only have strings)
                    filteredData[key] = value;
                }
            });

            await savePharmacyDetails(filteredData);
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving pharmacy details:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} accessibilityLabel="Back">
                        <Icon name="arrow-left" size={22} color="#6B705B" />
                    </TouchableOpacity>
                    <Text style={styles.title}>
                        {currentPharmacy ? 'Edit Pharmacy' : 'Add Pharmacy'}
                    </Text>
                    <TouchableOpacity onPress={handleSave} disabled={loading}>
                        <Text style={[styles.saveButton, loading && styles.disabledButton]}>
                            {loading ? 'Saving...' : 'Save'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Pharmacy Name *</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                value={formData.pharmacyName}
                                onChangeText={(value) => updateField('pharmacyName', value)}
                                placeholder="Enter pharmacy name"
                            />
                            {/* <TouchableOpacity
                                style={[styles.voiceButton, isRecording && currentField === 'pharmacyName' && styles.recordingButton]}
                                onPress={() => handleVoiceInput('pharmacyName')}
                            >
                                <Icon
                                    name={isRecording && currentField === 'pharmacyName' ? 'pause' : 'mic'}
                                    size={20}
                                    color={isRecording && currentField === 'pharmacyName' ? '#E63946' : '#6B705B'}
                                />
                                {recognizing && currentField === 'pharmacyName' && (
                                    <View style={styles.recordingIndicator} />
                                )}
                            </TouchableOpacity> */}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Address *</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.address}
                                onChangeText={(value) => updateField('address', value)}
                                placeholder="Enter pharmacy address"
                                multiline
                                numberOfLines={3}
                            />
                            {/* <TouchableOpacity
                                style={[styles.voiceButton, isRecording && currentField === 'address' && styles.recordingButton]}
                                onPress={() => handleVoiceInput('address')}
                            >
                                <Icon
                                    name={isRecording && currentField === 'address' ? 'pause' : 'mic'}
                                    size={20}
                                    color={isRecording && currentField === 'address' ? '#E63946' : '#6B705B'}
                                />
                                {recognizing && currentField === 'address' && (
                                    <View style={styles.recordingIndicator} />
                                )}
                            </TouchableOpacity> */}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                value={formData.phoneNo}
                                onChangeText={(value) => updateField('phoneNo', value)}
                                placeholder="Enter phone number"
                                keyboardType="phone-pad"
                            />
                            {/* <TouchableOpacity
                                style={[styles.voiceButton, isRecording && currentField === 'phoneNo' && styles.recordingButton]}
                                onPress={() => handleVoiceInput('phoneNo')}
                            >
                                <Icon
                                    name={isRecording && currentField === 'phoneNo' ? 'pause' : 'mic'}
                                    size={20}
                                    color={isRecording && currentField === 'phoneNo' ? '#E63946' : '#6B705B'}
                                />
                                {recognizing && currentField === 'phoneNo' && (
                                    <View style={styles.recordingIndicator} />
                                )}
                            </TouchableOpacity> */}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                value={formData.email}
                                onChangeText={(value) => updateField('email', value)}
                                placeholder="Enter email address"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            {/* <TouchableOpacity
                                style={[styles.voiceButton, isRecording && currentField === 'email' && styles.recordingButton]}
                                onPress={() => handleVoiceInput('email')}
                            >
                                <Icon
                                    name={isRecording && currentField === 'email' ? 'pause' : 'mic'}
                                    size={20}
                                    color={isRecording && currentField === 'email' ? '#E63946' : '#6B705B'}
                                />
                                {recognizing && currentField === 'email' && (
                                    <View style={styles.recordingIndicator} />
                                )}
                            </TouchableOpacity> */}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Operating Hours</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                value={formData.operatingHours}
                                onChangeText={(value) => updateField('operatingHours', value)}
                                placeholder="e.g., 9:00 AM - 9:00 PM"
                            />
                            {/* <TouchableOpacity
                                style={[styles.voiceButton, isRecording && currentField === 'operatingHours' && styles.recordingButton]}
                                onPress={() => handleVoiceInput('operatingHours')}
                            >
                                <Icon
                                    name={isRecording && currentField === 'operatingHours' ? 'pause' : 'mic'}
                                    size={20}
                                    color={isRecording && currentField === 'operatingHours' ? '#E63946' : '#6B705B'}
                                />
                                {recognizing && currentField === 'operatingHours' && (
                                    <View style={styles.recordingIndicator} />
                                )}
                            </TouchableOpacity> */}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Services</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.services}
                                onChangeText={(value) => updateField('services', value)}
                                placeholder="Available services (e.g., Home delivery, 24/7)"
                                multiline
                                numberOfLines={2}
                            />
                            {/* <TouchableOpacity
                                style={[styles.voiceButton, isRecording && currentField === 'services' && styles.recordingButton]}
                                onPress={() => handleVoiceInput('services')}
                            >
                                <Icon
                                    name={isRecording && currentField === 'services' ? 'pause' : 'mic'}
                                    size={20}
                                    color={isRecording && currentField === 'services' ? '#E63946' : '#6B705B'}
                                />
                                {recognizing && currentField === 'services' && (
                                    <View style={styles.recordingIndicator} />
                                )}
                            </TouchableOpacity> */}
                        </View>
                    </View>

                    {/* <View style={styles.inputGroup}>
                        <Text style={styles.label}>Notes</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={formData.notes}
                            onChangeText={(value) => updateField('notes', value)}
                            placeholder="Additional notes"
                            multiline
                            numberOfLines={3}
                        />
                    </View> */}
                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#22577A',
    },
    cancelButton: {
        color: '#666',
        fontSize: 16,
    },
    saveButton: {
        color: '#22577A',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.5,
    },
    form: {
        flex: 1,
        padding: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#22577A',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
        width: '85%'
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: '100%',
    },
    voiceButton: {
        padding: 10,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E9E9E0',
        position: 'relative',
        width: '15%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    recordingButton: {
        backgroundColor: '#FFE5E7',
        borderColor: '#E63946',
    },
    recordingIndicator: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E63946',
    },
});

export default EditPharmacyModal;
