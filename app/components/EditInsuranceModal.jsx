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
import { saveInsuranceDetails } from '../services/firebaseService';
import Icon from "react-native-vector-icons/Feather";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

const EditInsuranceModal = ({ visible, onClose, currentInsurance, onSave }) => {
    const [formData, setFormData] = useState({
        companyName: '',
        policyNo: '',
        contactPersonName: '',
        contactPersonNo: '',
        issueDate: '',
        expiryDate: '',
        coverageAmount: '',
        policyType: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recognizing, setRecognizing] = useState(false);
    const [currentField, setCurrentField] = useState(null);
    const [showIssuePicker, setShowIssuePicker] = useState(false);
    const [showExpiryPicker, setShowExpiryPicker] = useState(false);


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

    const formatDate = (dateObj) => {
        if (!dateObj) return '';
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const parseDate = (dateStr) => {
        if (!dateStr || typeof dateStr !== 'string') return new Date();
        const parts = dateStr.split('/');
        if (parts.length !== 3) return new Date();
        const [dd, mm, yyyy] = parts.map(p => parseInt(p, 10));
        if (!dd || !mm || !yyyy) return new Date();
        const d = new Date(yyyy, mm - 1, dd);
        return isNaN(d.getTime()) ? new Date() : d;
    };

    useEffect(() => {
        if (currentInsurance) {
            setFormData(currentInsurance);
        } else {
            // Reset form for new insurance
            setFormData({
                companyName: '',
                policyNo: '',
                contactPersonName: '',
                contactPersonNo: '',
                issueDate: '',
                expiryDate: '',
                coverageAmount: '',
                policyType: '',
                notes: ''
            });
        }
    }, [currentInsurance]);

    const handleSave = async () => {
        if (!formData.companyName || !formData.policyNo) {
            Alert.alert('Error', 'Company name and policy number are required.');
            return;
        }

        try {
            setLoading(true);

            // Filter out empty fields safely
            const filteredData = {};
            Object.keys(formData).forEach(key => {
                const value = formData[key];

                // Only process if the value exists
                if (value !== undefined && value !== null) {
                    // If it's a string, trim it and only include if not empty
                    if (typeof value === 'string') {
                        const trimmedValue = value.trim();
                        if (trimmedValue !== '') {
                            filteredData[key] = trimmedValue;
                        }
                    } else {
                        // For non-string values (numbers, dates), include as-is
                        filteredData[key] = value;
                    }
                }
            });

            await saveInsuranceDetails(filteredData);
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving insurance details:', error);
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
                        {currentInsurance ? 'Edit Insurance' : 'Add Insurance'}
                    </Text>
                    <TouchableOpacity onPress={handleSave} disabled={loading}>
                        <Text style={[styles.saveButton, loading && styles.disabledButton]}>
                            {loading ? 'Saving...' : 'Save'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Company Name *</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                value={formData.companyName}
                                onChangeText={(value) => updateField('companyName', value)}
                                placeholder="Enter insurance company name"
                            />
                            {/* <TouchableOpacity
                                style={[styles.voiceButton, isRecording && currentField === 'companyName' && styles.recordingButton]}
                                onPress={() => handleVoiceInput('companyName')}
                            >
                                <Icon
                                    name={isRecording && currentField === 'companyName' ? 'pause' : 'mic'}
                                    size={20}
                                    color={isRecording && currentField === 'companyName' ? '#E63946' : '#6B705B'}
                                />
                                {recognizing && currentField === 'companyName' && (
                                    <View style={styles.recordingIndicator} />
                                )}
                            </TouchableOpacity> */}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Policy Number *</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                value={formData.policyNo}
                                onChangeText={(value) => updateField('policyNo', value)}
                                placeholder="Enter policy number"
                            />
                            {/* <TouchableOpacity
                                style={[styles.voiceButton, isRecording && currentField === 'policyNo' && styles.recordingButton]}
                                onPress={() => handleVoiceInput('policyNo')}
                            >
                                <Icon
                                    name={isRecording && currentField === 'policyNo' ? 'pause' : 'mic'}
                                    size={20}
                                    color={isRecording && currentField === 'policyNo' ? '#E63946' : '#6B705B'}
                                />
                                {recognizing && currentField === 'policyNo' && (
                                    <View style={styles.recordingIndicator} />
                                )}
                            </TouchableOpacity> */}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Contact Person Name</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                value={formData.contactPersonName}
                                onChangeText={(value) => updateField('contactPersonName', value)}
                                placeholder="Enter contact person name"
                            />
                            {/* <TouchableOpacity
                                style={[styles.voiceButton, isRecording && currentField === 'contactPersonName' && styles.recordingButton]}
                                onPress={() => handleVoiceInput('contactPersonName')}
                            >
                                <Icon
                                    name={isRecording && currentField === 'contactPersonName' ? 'pause' : 'mic'}
                                    size={20}
                                    color={isRecording && currentField === 'contactPersonName' ? '#E63946' : '#6B705B'}
                                />
                                {recognizing && currentField === 'contactPersonName' && (
                                    <View style={styles.recordingIndicator} />
                                )}
                            </TouchableOpacity> */}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Contact Person Number</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                value={formData.contactPersonNo}
                                onChangeText={(value) => updateField('contactPersonNo', value)}
                                placeholder="Enter contact number"
                                keyboardType="phone-pad"
                            />
                            {/* <TouchableOpacity
                                style={[styles.voiceButton, isRecording && currentField === 'contactPersonNo' && styles.recordingButton]}
                                onPress={() => handleVoiceInput('contactPersonNo')}
                            >
                                <Icon
                                    name={isRecording && currentField === 'contactPersonNo' ? 'pause' : 'mic'}
                                    size={20}
                                    color={isRecording && currentField === 'contactPersonNo' ? '#E63946' : '#6B705B'}
                                />
                                {recognizing && currentField === 'contactPersonNo' && (
                                    <View style={styles.recordingIndicator} />
                                )}
                            </TouchableOpacity> */}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Issue Date</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                value={formData.issueDate}
                                onChangeText={(value) => updateField('issueDate', value)}
                                placeholder="DD/MM/YYYY"
                            />
                            <TouchableOpacity
                                style={styles.voiceButton}
                                onPress={() => setShowIssuePicker(true)}
                                accessibilityLabel="Pick issue date"
                            >
                                <Icon name="calendar" size={20} color="#6B705B" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.voiceButton, isRecording && currentField === 'issueDate' && styles.recordingButton]}
                                onPress={() => handleVoiceInput('issueDate')}
                            >
                                <Icon
                                    name={isRecording && currentField === 'issueDate' ? 'pause' : 'mic'}
                                    size={20}
                                    color={isRecording && currentField === 'issueDate' ? '#E63946' : '#6B705B'}
                                />
                                {recognizing && currentField === 'issueDate' && (
                                    <View style={styles.recordingIndicator} />
                                )}
                            </TouchableOpacity>
                        </View>
                        {showIssuePicker && (
                            <DateTimePicker
                                value={parseDate(formData.issueDate)}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, selectedDate) => {
                                    if (Platform.OS !== 'ios') setShowIssuePicker(false);
                                    if (event?.type === 'dismissed') return;
                                    const dateToSet = selectedDate || parseDate(formData.issueDate);
                                    updateField('issueDate', formatDate(dateToSet));
                                }}
                                maximumDate={parseDate(formData.expiryDate)}
                            />
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Expiry Date</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                value={formData.expiryDate}
                                onChangeText={(value) => updateField('expiryDate', value)}
                                placeholder="DD/MM/YYYY"
                            />
                            <TouchableOpacity
                                style={styles.voiceButton}
                                onPress={() => setShowExpiryPicker(true)}
                                accessibilityLabel="Pick expiry date"
                            >
                                <Icon name="calendar" size={20} color="#6B705B" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.voiceButton, isRecording && currentField === 'expiryDate' && styles.recordingButton]}
                                onPress={() => handleVoiceInput('expiryDate')}
                            >
                                <Icon
                                    name={isRecording && currentField === 'expiryDate' ? 'pause' : 'mic'}
                                    size={20}
                                    color={isRecording && currentField === 'expiryDate' ? '#E63946' : '#6B705B'}
                                />
                                {recognizing && currentField === 'expiryDate' && (
                                    <View style={styles.recordingIndicator} />
                                )}
                            </TouchableOpacity>
                        </View>
                        {showExpiryPicker && (
                            <DateTimePicker
                                value={parseDate(formData.expiryDate)}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, selectedDate) => {
                                    if (Platform.OS !== 'ios') setShowExpiryPicker(false);
                                    if (event?.type === 'dismissed') return;
                                    const dateToSet = selectedDate || parseDate(formData.expiryDate);
                                    updateField('expiryDate', formatDate(dateToSet));
                                }}
                                minimumDate={parseDate(formData.issueDate)}
                            />
                        )}
                    </View>
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
        width: "85%"
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: '100%'
    },
    voiceButton: {
        padding: 10,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E9E9E0',
        position: 'relative',
        width: '15%',
        justifyContent: 'center',
        alignItems: 'center'
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

export default EditInsuranceModal;
