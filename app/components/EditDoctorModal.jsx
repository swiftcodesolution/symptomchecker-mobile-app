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
import { saveDoctorDetails } from '../services/firebaseService';
import Icon from "react-native-vector-icons/Feather";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";

const EditDoctorModal = ({ visible, onClose, currentDoctor, onSave }) => {
  const [formData, setFormData] = useState({
    doctorName: '',
    phoneNo: '',
    email: '',
    address: '',
    specialization: '',
    hospitalName: '',
    consultationFee: '',
    notes: '',
    isPrimary: false
  });
  const [loading, setLoading] = useState(false);
  const [selectedSpecializations, setSelectedSpecializations] = useState([]);
  const [otherSpecs, setOtherSpecs] = useState(['']);
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
    if (currentDoctor) {
      console.log('🔍 Loading existing doctor:', currentDoctor);
      console.log('🔍 isPrimary from currentDoctor:', currentDoctor.isPrimary);
      setFormData(currentDoctor);
      // initialize specialization selections from saved string
      if (currentDoctor.specialization) {
        const parts = String(currentDoctor.specialization).split(',').map(s => s.trim()).filter(Boolean);
        const known = parts.filter(p => COMMON_SPECIALIZATIONS.includes(p));
        const others = parts.filter(p => !COMMON_SPECIALIZATIONS.includes(p));
        setSelectedSpecializations(known);
        setOtherSpecs(others.length ? others : ['']);
      } else {
        setSelectedSpecializations([]);
        setOtherSpecs(['']);
      }
    } else {
      setFormData({
        doctorName: '',
        phoneNo: '',
        email: '',
        address: '',
        specialization: '',
        hospitalName: '',
        consultationFee: '',
        notes: '',
        isPrimary: false
      });
      setSelectedSpecializations([]);
      setOtherSpecs(['']);
    }
  }, [currentDoctor]);

  const handleSave = async () => {
    if (!formData.doctorName || !formData.phoneNo) {
      Alert.alert('Error', 'Doctor name and phone number are required.');
      return;
    }

    try {
      setLoading(true);

      // Safely filter and trim data
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
            // For non-string values (numbers, etc.), include as-is
            filteredData[key] = value;
          }
        }
      });

      // combine specialization from checkboxes and other fields
      const combinedSpecs = [
        ...selectedSpecializations,
        ...otherSpecs.map(s => s.trim()).filter(Boolean)
      ];
      filteredData.specialization = combinedSpecs.join(', ');

      console.log('💾 Saving doctor data:', filteredData);
      console.log('🔍 isPrimary value:', filteredData.isPrimary);

      await saveDoctorDetails(filteredData);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving doctor details:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const COMMON_SPECIALIZATIONS = [
    'Internal Medicine',
    'Family Medicine / General Practice',
    'Cardiologist',
    'Pediatric',
    'Obstetrics & Gynecology (OB-GYN)',
    'Dermatology',
    'Plastic Surgery',
    'Neurosurgery',
    'Orthopedic Surgery',
    'Otolaryngology (ENT)'
  ];

  const toggleSpecialization = (spec) => {
    setSelectedSpecializations(prev =>
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  const updateOtherSpec = (index, value) => {
    setOtherSpecs(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addOtherSpecField = () => {
    setOtherSpecs(prev => [...prev, '']);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
        <TouchableOpacity onPress={onClose} accessibilityLabel="Back">
            <Icon name="arrow-left" size={22} color="#6B705B" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {currentDoctor ? 'Edit Doctor' : 'Add Doctor'}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[styles.saveButton, loading && styles.disabledButton]}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Doctor Name *</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={formData.doctorName}
                onChangeText={(value) => updateField('doctorName', value)}
                placeholder="Enter doctor's name"
              />
              {/* <TouchableOpacity
                style={[styles.voiceButton, isRecording && currentField === 'doctorName' && styles.recordingButton]}
                onPress={() => handleVoiceInput('doctorName')}
              >
                <Icon
                  name={isRecording && currentField === 'doctorName' ? 'pause' : 'mic'}
                  size={20}
                  color={isRecording && currentField === 'doctorName' ? '#E63946' : '#6B705B'}
                />
                {recognizing && currentField === 'doctorName' && (
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
            <Text style={styles.label}>Specialization</Text>
            <View style={styles.checkboxGrid}>
              {COMMON_SPECIALIZATIONS.map((spec) => (
                <TouchableOpacity
                  key={spec}
                  style={[styles.checkboxItem, selectedSpecializations.includes(spec) && styles.checkboxItemSelected]}
                  onPress={() => toggleSpecialization(spec)}
                >
                  <View style={[styles.checkbox, selectedSpecializations.includes(spec) && styles.checkboxChecked]} />
                  <Text style={styles.checkboxLabel}>{spec}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.otherSpecsWrapper}>
              <Text style={styles.subLabel}>Other Specializations</Text>
              {otherSpecs.map((val, idx) => (
                <View key={idx} style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={val}
                    onChangeText={(v) => updateOtherSpec(idx, v)}
                    placeholder="Type another specialization"
                    autoCapitalize="none"
                  />
                </View>
              ))}
              <TouchableOpacity style={styles.addOtherBtn} onPress={addOtherSpecField}>
                <Text style={styles.addOtherBtnText}>+ Add another</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Primary Doctor Toggle */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Primary Doctor</Text>
            <TouchableOpacity
              style={styles.primaryToggle}
              onPress={() => updateField('isPrimary', !formData.isPrimary)}
            >
              <View style={[styles.toggleSwitch, formData.isPrimary && styles.toggleSwitchActive]}>
                <View style={[styles.toggleThumb, formData.isPrimary && styles.toggleThumbActive]} />
              </View>
              <Text style={styles.toggleLabel}>
                {formData.isPrimary ? 'Set as Primary Doctor' : 'Not Primary Doctor'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.toggleDescription}>
              Primary doctor will be shown in SOS section and emergency contacts
            </Text>
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
  checkboxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  checkboxItemSelected: {
    borderColor: '#22577A',
    backgroundColor: '#E9F6F2',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 3,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#22577A',
    borderColor: '#22577A',
  },
  checkboxLabel: {
    color: '#22577A',
    fontSize: 14,
    fontWeight: '600',
  },
  otherSpecsWrapper: {
    marginTop: 12,
    gap: 8,
  },
  subLabel: {
    fontSize: 14,
    color: '#465D69',
    marginBottom: 4,
    fontWeight: '600',
  },
  addOtherBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#22577A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addOtherBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  inputGroup: {
    marginBottom: 50,
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
  primaryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    marginRight: 12,
  },
  toggleSwitchActive: {
    backgroundColor: '#22577A',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    marginLeft: 2,
  },
  toggleThumbActive: {
    marginLeft: 22,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#22577A',
    fontWeight: '600',
  },
  toggleDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default EditDoctorModal;
