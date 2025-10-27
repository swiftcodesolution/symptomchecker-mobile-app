import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { saveInsuranceDetails } from '../services/firebaseService';
import Icon from "react-native-vector-icons/Feather";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import DateTimePicker from '@react-native-community/datetimepicker';

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
            <KeyboardAvoidingView 
                style={styles.container} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
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

                <ScrollView 
                    style={styles.form}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    automaticallyAdjustKeyboardInsets={true}
                    keyboardDismissMode="interactive"
                >
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
                            <TouchableOpacity 
                                style={styles.input}
                                onPress={() => setShowIssuePicker(true)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.inputText, !formData.issueDate && styles.placeholderText]}>
                                    {formData.issueDate || "DD/MM/YYYY"}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.voiceButton}
                                onPress={() => setShowIssuePicker(true)}
                                accessibilityLabel="Pick issue date"
                            >
                                <Icon name="calendar" size={20} color="#6B705B" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Expiry Date</Text>
                        <View style={styles.inputRow}>
                            <TouchableOpacity 
                                style={styles.input}
                                onPress={() => setShowExpiryPicker(true)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.inputText, !formData.expiryDate && styles.placeholderText]}>
                                    {formData.expiryDate || "DD/MM/YYYY"}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.voiceButton}
                                onPress={() => setShowExpiryPicker(true)}
                                accessibilityLabel="Pick expiry date"
                            >
                                <Icon name="calendar" size={20} color="#6B705B" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Date Picker Modal */}
            {(showIssuePicker || showExpiryPicker) && (
                <Modal
                    visible={true}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => {
                        setShowIssuePicker(false);
                        setShowExpiryPicker(false);
                    }}
                >
                    <View style={styles.pickerOverlay}>
                        <View style={styles.pickerContainer}>
                            <View style={styles.pickerHeader}>
                                <TouchableOpacity 
                                    onPress={() => {
                                        setShowIssuePicker(false);
                                        setShowExpiryPicker(false);
                                    }}
                                    style={styles.pickerCancelButton}
                                >
                                    <Text style={styles.pickerCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <Text style={styles.pickerTitle}>
                                    {showIssuePicker ? 'Select Issue Date' : 'Select Expiry Date'}
                                </Text>
                                <TouchableOpacity 
                                    onPress={() => {
                                        if (showIssuePicker) {
                                            const dateToSet = parseDate(formData.issueDate);
                                            updateField('issueDate', formatDate(dateToSet));
                                        } else {
                                            const dateToSet = parseDate(formData.expiryDate);
                                            updateField('expiryDate', formatDate(dateToSet));
                                        }
                                        setShowIssuePicker(false);
                                        setShowExpiryPicker(false);
                                    }}
                                    style={styles.pickerDoneButton}
                                >
                                    <Text style={styles.pickerDoneText}>Done</Text>
                                </TouchableOpacity>
                            </View>
                            
                            {showIssuePicker && (
                                <DateTimePicker
                                    value={parseDate(formData.issueDate)}
                                    mode="date"
                                    display="spinner"
                                    onChange={(event, selectedDate) => {
                                        if (selectedDate) {
                                            updateField('issueDate', formatDate(selectedDate));
                                        }
                                    }}
                                    maximumDate={parseDate(formData.expiryDate)}
                                    style={styles.picker}
                                />
                            )}
                            
                            {showExpiryPicker && (
                                <DateTimePicker
                                    value={parseDate(formData.expiryDate)}
                                    mode="date"
                                    display="spinner"
                                    onChange={(event, selectedDate) => {
                                        if (selectedDate) {
                                            updateField('expiryDate', formatDate(selectedDate));
                                        }
                                    }}
                                    minimumDate={parseDate(formData.issueDate)}
                                    style={styles.picker}
                                />
                            )}
                        </View>
                    </View>
                </Modal>
            )}
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
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 100,
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
        width: "85%",
        justifyContent: 'center',
    },
    inputText: {
        fontSize: 16,
        color: '#222',
    },
    placeholderText: {
        color: '#999',
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
    pickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        width: '90%',
        maxWidth: 400,
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E9E9E0',
    },
    pickerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6B705B',
    },
    pickerCancelButton: {
        padding: 8,
    },
    pickerCancelText: {
        fontSize: 16,
        color: '#6B705B',
        fontWeight: '500',
    },
    pickerDoneButton: {
        padding: 8,
    },
    pickerDoneText: {
        fontSize: 16,
        color: '#6B705B',
        fontWeight: '600',
    },
    picker: {
        height: 200,
    },
});

export default EditInsuranceModal;
