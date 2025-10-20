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
import { savePersonalDetails } from '../services/firebaseService';
import Icon from "react-native-vector-icons/Feather";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { getAuth } from 'firebase/auth';

const EditPersonalDetailsModal = ({ visible, onClose, currentDetails, onSave, name }) => {
  const [formData, setFormData] = useState({
    name: '',
    contactNo: '',
    address: '',
    email: '',
  });

  // Data extraction function - currentDetails se sahi data extract karega
  const extractPersonalDetails = (details) => {
    if (!details) return {
      name: '',
      contactNo: '', 
      address: '',
      email: '',
    };

    let phoneNumber = '';
    let cleanAddress = '';
    let userName = '';
    let userEmail = '';

    // Agar data mixed format mein hai (jo aapka current case hai)
    if (details.address && typeof details.address === 'string') {
      const addressParts = details.address.split(', ');
      
      // Last part check karo agar phone number hai
      const lastPart = addressParts[addressParts.length - 1];
      
      // Phone number extract karo (10-15 digits)
      if (/^\d{10,15}$/.test(lastPart.replace(/\D/g, ''))) {
        phoneNumber = lastPart;
        // Phone number ko address se hatao
        addressParts.pop();
        cleanAddress = addressParts.join(', ').trim();
      } else {
        cleanAddress = details.address;
      }
    }

    // Agar alag se contactNo field mein valid data hai
    if (details.contactNo && details.contactNo !== '14lb' && !isNaN(details.contactNo.replace(/\D/g, ''))) {
      phoneNumber = details.contactNo;
    }

    // Name field check karo - agar DOB hai toh ignore karo
    if (details.name && !details.name.includes('/')) { // Simple check for date format
      userName = details.name;
    }

    // Email field check karo - agar weight nahi hai toh use karo
    if (details.email && details.email !== '25' && details.email.includes('@')) {
      userEmail = details.email;
    }

    const auth = getAuth();
    const user = auth.currentUser;

    return {
      name: userName || user?.displayName || '',
      contactNo: phoneNumber || details.contactNo || '',
      address: cleanAddress || details.address || '',
      email: userEmail || user?.email || '',
      // Additional fields agar future mein chahiye
      city: details.city || '',
      state: details.state || '',
      zipCode: details.zipCode || '',
      dateOfBirth: details.dateOfBirth || '',
      age: details.age || '',
      gender: details.gender || '',
      ethnicity: details.ethnicity || '',
      height: details.height || '',
      weight: details.weight || '',
    };
  };

  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (visible && currentDetails) {
      const cleanedDetails = extractPersonalDetails(currentDetails);
      console.log("Extracted details:", cleanedDetails); // Debug ke liye
      
      setFormData({
        name: cleanedDetails.name || '',
        contactNo: cleanedDetails.contactNo || '',
        address: cleanedDetails.address || '',
        email: cleanedDetails.email || '',
      });
    }
  }, [visible, currentDetails]);

  // Speech recognition setup
  useSpeechRecognitionEvent("start", () => setRecognizing(true));
  useSpeechRecognitionEvent("end", () => {
    setRecognizing(false);
    setIsRecording(false);
  });
  useSpeechRecognitionEvent("result", (event) => {
    if (event.results && event.results.length > 0) {
      const transcript = event.results[0].transcript;
      if (currentField) {
        updateField(currentField, transcript);
      }
      if (event.results[0].isFinal) {
        stopVoiceRecognition();
      }
    }
  });
  useSpeechRecognitionEvent("error", (event) => {
    console.log("Speech recognition error:", event.error);
    setIsRecording(false);
    setRecognizing(false);
    // Alert.alert('Voice Error', 'Failed to recognize speech');
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
      setCurrentField(null);
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

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Data clean karo aur validate karo
      const filteredData = {
        name: formData.name?.trim() || '',
        contactNo: formData.contactNo?.trim() || '',
        address: formData.address?.trim() || '',
        email: formData.email?.trim() || '',
      };

      // Phone number validate karo
      if (filteredData.contactNo && !/^\d{10,15}$/.test(filteredData.contactNo.replace(/\D/g, ''))) {
        Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number');
        setLoading(false);
        return;
      }

      // Email validate karo
      if (filteredData.email && !filteredData.email.includes('@')) {
        Alert.alert('Invalid Email', 'Please enter a valid email address');
        setLoading(false);
        return;
      }

      console.log("Saving personal details:", filteredData);
      await savePersonalDetails(filteredData);
      onSave(filteredData);
      onClose();
      Alert.alert('Success', 'Personal details updated successfully');
    } catch (error) {
      console.error('Error saving personal details:', error);
      Alert.alert('Error', 'Failed to save personal details');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: value 
    }));
  };

  // Format phone number as user types
  const formatPhoneNumber = (value) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (value) => {
    const formatted = formatPhoneNumber(value);
    updateField('contactNo', formatted);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Back">
            <Icon name="arrow-left" size={22} color="#6B705B" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Personal Details</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[styles.saveButton, loading && styles.disabledButton]}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form}>
  

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(value) => updateField('name', value)}
                placeholder="Enter your full name"
                autoCapitalize="words"
              />
              <TouchableOpacity
                style={[styles.voiceButton, isRecording && currentField === 'name' && styles.recordingButton]}
                onPress={() => handleVoiceInput('name')}
              >
                <Icon
                  name={isRecording && currentField === 'name' ? 'square' : 'mic'}
                  size={20}
                  color={isRecording && currentField === 'name' ? '#E63946' : '#6B705B'}
                />
                {recognizing && currentField === 'name' && (
                  <View style={styles.recordingIndicator} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={formData.contactNo}
                onChangeText={handlePhoneChange}
                placeholder="(123) 456-7890"
                keyboardType="phone-pad"
                maxLength={14}
              />
              <TouchableOpacity
                style={[styles.voiceButton, isRecording && currentField === 'contactNo' && styles.recordingButton]}
                onPress={() => handleVoiceInput('contactNo')}
              >
                <Icon
                  name={isRecording && currentField === 'contactNo' ? 'square' : 'mic'}
                  size={20}
                  color={isRecording && currentField === 'contactNo' ? '#E63946' : '#6B705B'}
                />
                {recognizing && currentField === 'contactNo' && (
                  <View style={styles.recordingIndicator} />
                )}
              </TouchableOpacity>
            </View>
            {/* <Text style={styles.helperText}>
              {formData.contactNo && !/^\d{10,15}$/.test(formData.contactNo.replace(/\D/g, '')) 
                ? 'Please enter a valid 10-digit phone number' 
                : 'We will never share your phone number'}
            </Text> */}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.address}
                onChangeText={(value) => updateField('address', value)}
                placeholder="Enter your complete address"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.voiceButton, isRecording && currentField === 'address' && styles.recordingButton]}
                onPress={() => handleVoiceInput('address')}
              >
                <Icon
                  name={isRecording && currentField === 'address' ? 'square' : 'mic'}
                  size={20}
                  color={isRecording && currentField === 'address' ? '#E63946' : '#6B705B'}
                />
                {recognizing && currentField === 'address' && (
                  <View style={styles.recordingIndicator} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                placeholder="your.email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <TouchableOpacity
                style={[styles.voiceButton, isRecording && currentField === 'email' && styles.recordingButton]}
                onPress={() => handleVoiceInput('email')}
              >
                <Icon
                  name={isRecording && currentField === 'email' ? 'square' : 'mic'}
                  size={20}
                  color={isRecording && currentField === 'email' ? '#E63946' : '#6B705B'}
                />
                {recognizing && currentField === 'email' && (
                  <View style={styles.recordingIndicator} />
                )}
              </TouchableOpacity>
            </View>
            {/* <Text style={styles.helperText}>
              {formData.email && !formData.email.includes('@') 
                ? 'Please enter a valid email address' 
                : 'Your primary email address'}
            </Text> */}
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
    marginBottom: 20,
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
    flex: 1,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  voiceButton: {
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9E9E0',
    position: 'relative',
    minWidth: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center'
  },
  recordingButton: {
    backgroundColor: '#FFE5E7',
    borderColor: '#E63946',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E63946',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  debugSection: {
    backgroundColor: '#FFF0F0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFCCCB',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF4444',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
});

export default EditPersonalDetailsModal;