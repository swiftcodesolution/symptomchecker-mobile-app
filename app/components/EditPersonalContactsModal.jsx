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
import { savePersonalContact } from '../services/firebaseService';
import Icon from "react-native-vector-icons/Feather";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";

const EditPersonalContactsModal = ({ visible, onClose, currentContact, onSave }) => {
    const [formData, setFormData] = useState({
        Name: '',
        Relation: '',
        ContactNumber: '',
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
        if (currentContact) {
            setFormData(currentContact);
        } else {
            // Reset form for new contact
            setFormData({
                Name: '',
                Relation: '',
                ContactNumber: '',
            });
        }
    }, [currentContact]);

    const handleSave = async () => {
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

            await savePersonalContact(filteredData);
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving contact:', error);
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
                        {currentContact ? 'Edit Contact' : 'Add Contact'}
                    </Text>
                    <TouchableOpacity onPress={handleSave} disabled={loading}>
                        <Text style={[styles.saveButton, loading && styles.disabledButton]}>
                            {loading ? 'Saving...' : 'Save'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Name *</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                value={formData.Name}
                                onChangeText={(value) => updateField('Name', value)}
                                placeholder="Enter contact name"
                            />
                            {/* <TouchableOpacity
                                style={[styles.voiceButton, isRecording && currentField === 'Name' && styles.recordingButton]}
                                onPress={() => handleVoiceInput('Name')}
                            >
                                <Icon
                                    name={isRecording && currentField === 'Name' ? 'pause' : 'mic'}
                                    size={20}
                                    color={isRecording && currentField === 'Name' ? '#E63946' : '#6B705B'}
                                />
                                {recognizing && currentField === 'Name' && (
                                    <View style={styles.recordingIndicator} />
                                )}
                            </TouchableOpacity> */}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Relation *</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                value={formData.Relation}
                                onChangeText={(value) => updateField('Relation', value)}
                                placeholder="Enter relationship"
                            />
                            {/* <TouchableOpacity
                                style={[styles.voiceButton, isRecording && currentField === 'Relation' && styles.recordingButton]}
                                onPress={() => handleVoiceInput('Relation')}
                            >
                                <Icon
                                    name={isRecording && currentField === 'Relation' ? 'pause' : 'mic'}
                                    size={20}
                                    color={isRecording && currentField === 'Relation' ? '#E63946' : '#6B705B'}
                                />
                                {recognizing && currentField === 'Relation' && (
                                    <View style={styles.recordingIndicator} />
                                )}
                            </TouchableOpacity> */}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Contact Number *</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                value={formData.ContactNumber}
                                onChangeText={(value) => updateField('ContactNumber', value)}
                                placeholder="Enter phone number"
                                keyboardType="phone-pad"
                            />
                            {/* <TouchableOpacity
                                style={[styles.voiceButton, isRecording && currentField === 'ContactNumber' && styles.recordingButton]}
                                onPress={() => handleVoiceInput('ContactNumber')}
                            >
                                <Icon
                                    name={isRecording && currentField === 'ContactNumber' ? 'pause' : 'mic'}
                                    size={20}
                                    color={isRecording && currentField === 'ContactNumber' ? '#E63946' : '#6B705B'}
                                />
                                {recognizing && currentField === 'ContactNumber' && (
                                    <View style={styles.recordingIndicator} />
                                )}
                            </TouchableOpacity> */}
                        </View>
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
        width: '85%'
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
        width: "15%",
        justifyContent: 'center',
        alignItems: 'center',
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

export default EditPersonalContactsModal;