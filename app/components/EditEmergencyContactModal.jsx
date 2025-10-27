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
import { saveEmergencyContact } from '../services/firebaseService';
import Icon from "react-native-vector-icons/Feather";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";

const EditEmergencyContactModal = ({ visible, onClose, currentContact, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    relation: '',
    phone: '',
    email: '',
    address: '',
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
    if (currentContact) {
      setFormData(currentContact);
    } else {
      setFormData({
        name: '',
        relation: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
      });
    }
  }, [currentContact]);

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      Alert.alert('Error', 'Name and phone number are required.');
      return;
    }

    try {
      setLoading(true);

      // Safely filter and trim data
      const filteredData = {};
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        if (value !== undefined && value !== null) {
          if (typeof value === 'string') {
            const trimmedValue = value.trim();
            if (trimmedValue !== '') {
              filteredData[key] = trimmedValue;
            }
          } else {
            filteredData[key] = value;
          }
        }
      });

      await saveEmergencyContact(filteredData);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving emergency contact:', error);
      Alert.alert('Error', 'Failed to save contact. Please try again.');
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
            {currentContact ? 'Edit Contact' : 'Add Contact'}
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
            <Text style={styles.label}>Name *</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(value) => updateField('name', value)}
                placeholder="Enter contact name"
              />
              {/* <TouchableOpacity
                style={[styles.voiceButton, isRecording && currentField === 'name' && styles.recordingButton]}
                onPress={() => handleVoiceInput('name')}
              >
                <Icon
                  name={isRecording && currentField === 'name' ? 'pause' : 'mic'}
                  size={20}
                  color={isRecording && currentField === 'name' ? '#E63946' : '#6B705B'}
                />
                {recognizing && currentField === 'name' && (
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
                value={formData.relation}
                onChangeText={(value) => updateField('relation', value)}
                placeholder="E.g. Father, Mother, Friend"
              />
              {/* <TouchableOpacity
                style={[styles.voiceButton, isRecording && currentField === 'relation' && styles.recordingButton]}
                onPress={() => handleVoiceInput('relation')}
              >
                <Icon
                  name={isRecording && currentField === 'relation' ? 'pause' : 'mic'}
                  size={20}
                  color={isRecording && currentField === 'relation' ? '#E63946' : '#6B705B'}
                />
                {recognizing && currentField === 'relation' && (
                  <View style={styles.recordingIndicator} />
                )}
              </TouchableOpacity> */}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(value) => updateField('phone', value)}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
              {/* <TouchableOpacity
                style={[styles.voiceButton, isRecording && currentField === 'phone' && styles.recordingButton]}
                onPress={() => handleVoiceInput('phone')}
              >
                <Icon
                  name={isRecording && currentField === 'phone' ? 'pause' : 'mic'}
                  size={20}
                  color={isRecording && currentField === 'phone' ? '#E63946' : '#6B705B'}
                />
                {recognizing && currentField === 'phone' && (
                  <View style={styles.recordingIndicator} />
                )}
              </TouchableOpacity> */}

            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    justifyContent: 'center',
    alignItems: 'center',
    width: '15%'
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

export default EditEmergencyContactModal;