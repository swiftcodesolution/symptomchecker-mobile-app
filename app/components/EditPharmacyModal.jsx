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
import DateTimePicker from '@react-native-community/datetimepicker';
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
    
    // Time picker states
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [openingTime, setOpeningTime] = useState(new Date());
    const [closingTime, setClosingTime] = useState(new Date());
    const [isSettingOpeningTime, setIsSettingOpeningTime] = useState(true);

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
            // Parse existing operating hours
            const { opening, closing } = parseOperatingHours(currentPharmacy.operatingHours);
            setOpeningTime(opening);
            setClosingTime(closing);
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
            // Set default times
            const defaultOpening = new Date();
            defaultOpening.setHours(9, 0, 0, 0);
            const defaultClosing = new Date();
            defaultClosing.setHours(21, 0, 0, 0);
            setOpeningTime(defaultOpening);
            setClosingTime(defaultClosing);
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

    // Time picker functions
    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const parseOperatingHours = (hoursString) => {
        if (!hoursString) return { opening: new Date(), closing: new Date() };
        
        const timeRegex = /(\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i;
        const match = hoursString.match(timeRegex);
        
        if (match) {
            const openingTimeStr = match[1];
            const closingTimeStr = match[2];
            
            const today = new Date();
            const openingTime = new Date(`${today.toDateString()} ${openingTimeStr}`);
            const closingTime = new Date(`${today.toDateString()} ${closingTimeStr}`);
            
            return { opening: openingTime, closing: closingTime };
        }
        
        return { opening: new Date(), closing: new Date() };
    };

    const handleTimeChange = (event, selectedTime) => {
        if (Platform.OS === 'android') {
            setShowTimePicker(false);
        }
        
        if (selectedTime) {
            if (isSettingOpeningTime) {
                setOpeningTime(selectedTime);
            } else {
                setClosingTime(selectedTime);
            }
            
            // Update the operating hours string
            const openingStr = formatTime(isSettingOpeningTime ? selectedTime : openingTime);
            const closingStr = formatTime(isSettingOpeningTime ? closingTime : selectedTime);
            updateField('operatingHours', `${openingStr} - ${closingStr}`);
        }
    };

    const openTimePicker = (isOpening) => {
        setIsSettingOpeningTime(isOpening);
        setShowTimePicker(true);
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
                        {currentPharmacy ? 'Edit Pharmacy' : 'Add Pharmacy'}
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
                        <View style={styles.timePickerContainer}>
                            <View style={styles.timeButtonContainer}>
                                <Text style={styles.timeLabel}>Opening Time</Text>
                                <TouchableOpacity 
                                    style={styles.timeButton}
                                    onPress={() => openTimePicker(true)}
                                >
                                    <Icon name="clock" size={16} color="#6B705B" />
                                    <Text style={styles.timeButtonText}>
                                        {formatTime(openingTime)}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            
                            <View style={styles.timeSeparator}>
                                <Text style={styles.separatorText}>to</Text>
                            </View>
                            
                            <View style={styles.timeButtonContainer}>
                                <Text style={styles.timeLabel}>Closing Time</Text>
                                <TouchableOpacity 
                                    style={styles.timeButton}
                                    onPress={() => openTimePicker(false)}
                                >
                                    <Icon name="clock" size={16} color="#6B705B" />
                                    <Text style={styles.timeButtonText}>
                                        {formatTime(closingTime)}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                        {/* Display formatted operating hours */}
                        <View style={styles.operatingHoursDisplay}>
                            <Text style={styles.operatingHoursText}>
                                {formatTime(openingTime)} - {formatTime(closingTime)}
                            </Text>
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
            </KeyboardAvoidingView>
            
            {/* Time Picker Modal */}
            {showTimePicker && (
                <DateTimePicker
                    value={isSettingOpeningTime ? openingTime : closingTime}
                    mode="time"
                    is24Hour={false}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                />
            )}
            
            {/* iOS Time Picker Modal */}
            {Platform.OS === 'ios' && showTimePicker && (
                <View style={styles.timePickerModal}>
                    <View style={styles.timePickerHeader}>
                        <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.timePickerTitle}>
                            {isSettingOpeningTime ? 'Opening Time' : 'Closing Time'}
                        </Text>
                        <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                            <Text style={styles.doneText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                    <DateTimePicker
                        value={isSettingOpeningTime ? openingTime : closingTime}
                        mode="time"
                        is24Hour={false}
                        display="spinner"
                        onChange={handleTimeChange}
                        style={styles.timePicker}
                    />
                </View>
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
    // Time picker styles
    timePickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    timeButtonContainer: {
        flex: 1,
        alignItems: 'center',
    },
    timeLabel: {
        fontSize: 12,
        color: '#6B705B',
        marginBottom: 4,
        fontWeight: '500',
    },
    timeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderWidth: 1,
        borderColor: '#E9E9E0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        minWidth: 100,
        justifyContent: 'center',
    },
    timeButtonText: {
        fontSize: 14,
        color: '#22577A',
        marginLeft: 6,
        fontWeight: '500',
    },
    timeSeparator: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    separatorText: {
        fontSize: 14,
        color: '#6B705B',
        fontWeight: '500',
    },
    operatingHoursDisplay: {
        backgroundColor: '#F0F4F8',
        borderWidth: 1,
        borderColor: '#D1E7DD',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    operatingHoursText: {
        fontSize: 16,
        color: '#22577A',
        fontWeight: '600',
    },
    timePickerModal: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 34, // Safe area padding
    },
    timePickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    timePickerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#22577A',
    },
    cancelText: {
        fontSize: 16,
        color: '#666',
    },
    doneText: {
        fontSize: 16,
        color: '#22577A',
        fontWeight: 'bold',
    },
    timePicker: {
        height: 200,
    },
});

export default EditPharmacyModal;
