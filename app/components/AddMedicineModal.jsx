import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';
import { firestore } from '../config/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { schedulePushNotification, cancelScheduledNotification } from '../utils/notificationUtils';

const AddMedicineModal = ({ 
  visible, 
  onClose, 
  onMedicineAdded, 
  editingMedicine = null, 
  showSuccessAlert, 
  showErrorAlert, 
  notificationsEnabled,
  scheduleNotificationForMedicine 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: '',
    timeToTake: '',
    refillDate: '',
    date: '', // For one-time notifications
    daysOfWeek: [] // For weekly notifications
  });
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const [showRefillPicker, setShowRefillPicker] = useState(false);
  const [refillDateObj, setRefillDateObj] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeObj, setTimeObj] = useState(null);

  const auth = getAuth();
  const user = auth.currentUser;

  // Reset form when modal opens/closes or editing medicine changes
  useEffect(() => {
    if (editingMedicine) {
      setFormData({
        name: editingMedicine.name || '',
        dosage: editingMedicine.dosage || '',
        frequency: editingMedicine.frequency || '',
        timeToTake: editingMedicine.timeToTake || '',
        refillDate: editingMedicine.refillDate || '',
        date: editingMedicine.date || '',
        daysOfWeek: editingMedicine.daysOfWeek || []
      });
      setRefillDateObj(parseDateString(editingMedicine.refillDate || ''));
      setTimeObj(parseTimeString(editingMedicine.timeToTake || ''));
    } else {
      setFormData({
        name: '',
        dosage: '',
        frequency: '',
        timeToTake: '',
        refillDate: '',
        date: '',
        daysOfWeek: []
      });
      setRefillDateObj(null);
      setTimeObj(null);
    }
  }, [editingMedicine, visible]);

  // Speech recognition events
  useSpeechRecognitionEvent("start", () => setRecognizing(true));
  useSpeechRecognitionEvent("end", () => {
    setRecognizing(false);
    setIsRecording(false);
  });
  
  useSpeechRecognitionEvent("result", (event) => {
    console.log("Speech recognition result:", event);
    
    const transcript = event.results[0]?.transcript;
    console.log("currentField:", currentField);
    
    if (currentField && transcript) {
      // Block voice input for medicine name by ignoring results
      if (currentField === 'name') {
        return;
      }

      let value = transcript;
      if (currentField === 'refillDate') {
        value = normalizeDateString(transcript);
      } else if (currentField === 'timeToTake') {
        value = normalizeTimeString(transcript);
      }
      
      handleInputChange(currentField, value);
      console.log(`Recognized text for ${currentField}:`, value);
    }
    
    // Optional: Stop recording after getting the result if isFinal is true
    if (event.isFinal) {
      stopVoiceRecognition();
    }
  });
  
  useSpeechRecognitionEvent("error", (event) => {
    console.log("error code:", event.error, "error message:", event.message);
    setIsRecording(false);
    setRecognizing(false);
  });

  useEffect(() => {
    // Request permissions when component mounts
    (async () => {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        console.warn("Permissions not granted", result);
        return;
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVoiceInput = (field) => {
    // Enforce typing for medicine name
    if (field === 'name') {
      Alert.alert('Info', 'For accuracy, please type the medicine name.');
      return;
    }
    // Disable voice for refill date; use date picker instead
    if (field === 'refillDate') {
      Alert.alert('Info', 'Please use the calendar to select the refill date.');
      return;
    }
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

  const pad2 = (num) => (num < 10 ? `0${num}` : `${num}`);

  const formatDateDDMMYYYY = (date) => {
    if (!(date instanceof Date) || isNaN(date)) return '';
    const d = pad2(date.getDate());
    const m = pad2(date.getMonth() + 1);
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const formatDateYYYYMMDD = (date) => {
    if (!(date instanceof Date) || isNaN(date)) return '';
    const d = pad2(date.getDate());
    const m = pad2(date.getMonth() + 1);
    const y = date.getFullYear();
    return `${y}-${m}-${d}`;
  };

  const formatTime = (date) => {
    if (!(date instanceof Date) || isNaN(date)) return '';
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const h12 = ((hours + 11) % 12) + 1;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${h12}:${pad2(minutes)} ${ampm}`;
  };

  const parseDateString = (value) => {
    if (!value) return null;
    
    // Try DD/MM/YYYY format first
    const m = value.match(/^(\d{1,2})[\/](\d{1,2})[\/](\d{2,4})$/);
    if (m) {
      const day = parseInt(m[1], 10);
      const month = parseInt(m[2], 10) - 1;
      let year = parseInt(m[3], 10);
      if (year < 100) year = 2000 + year;
      const dt = new Date(year, month, day);
      if (!isNaN(dt)) return dt;
    }
    
    // Try YYYY-MM-DD format
    const m2 = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m2) {
      const year = parseInt(m2[1], 10);
      const month = parseInt(m2[2], 10) - 1;
      const day = parseInt(m2[3], 10);
      const dt = new Date(year, month, day);
      if (!isNaN(dt)) return dt;
    }
    
    const dt2 = new Date(value);
    return isNaN(dt2) ? null : dt2;
  };

  const parseTimeString = (value) => {
    if (!value) return null;
    
    // Try formats like "9:00 AM", "2:30 PM", "14:00"
    const ampmMatch = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const minutes = parseInt(ampmMatch[2], 10);
      const meridiem = ampmMatch[3].toUpperCase();
      
      if (meridiem === 'PM' && hours < 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
      
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    }
    
    // Try 24-hour format like "14:00"
    const twentyFourMatch = value.match(/^(\d{1,2}):(\d{2})$/);
    if (twentyFourMatch) {
      const hours = parseInt(twentyFourMatch[1], 10);
      const minutes = parseInt(twentyFourMatch[2], 10);
      
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    }
    
    return null;
  };

  const normalizeDateString = (spoken) => {
    try {
      // Try to parse natural language dates like "October 10, 2025"
      const parsed = new Date(spoken);
      if (!isNaN(parsed.getTime())) {
        const d = pad2(parsed.getDate());
        const m = pad2(parsed.getMonth() + 1);
        const y = parsed.getFullYear();
        return `${d}/${m}/${y}`;
      }

      // Fallback: extract patterns like 10/10/2025 or 10-10-2025
      const m1 = spoken.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/);
      if (m1) {
        const d = pad2(parseInt(m1[1], 10));
        const m = pad2(parseInt(m1[2], 10));
        let y = m1[3];
        if (y.length === 2) y = `20${y}`;
        return `${d}/${m}/${y}`;
      }
    } catch (e) {}
    return spoken;
  };

  const normalizeTimeString = (spoken) => {
    const s = spoken.trim().toLowerCase();
    
    // Handle inputs like "2 pm", "2:30 pm", "14:00"
    const ampmMatch = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const minutes = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
      const meridiem = ampmMatch[3].toLowerCase();
      
      if (meridiem === 'pm' && hours < 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;
      
      const h12 = ((hours + 11) % 12) + 1;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      return `${h12}:${pad2(minutes)} ${ampm}`;
    }

    const twentyFour = s.match(/^(\d{1,2})(?::(\d{2}))$/);
    if (twentyFour) {
      let hours = parseInt(twentyFour[1], 10);
      const minutes = parseInt(twentyFour[2], 10);
      const h12 = ((hours + 11) % 12) + 1;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      return `${h12}:${pad2(minutes)} ${ampm}`;
    }

    // Capitalize AM/PM if present
    return spoken.replace(/\b(am|pm)\b/gi, (m) => m.toUpperCase());
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter medicine name');
      return false;
    }
    if (!formData.dosage.trim()) {
      Alert.alert('Error', 'Please enter dosage');
      return false;
    }
    if (!formData.frequency.trim()) {
      Alert.alert('Error', 'Please enter frequency');
      return false;
    }
    if (!formData.timeToTake.trim()) {
      Alert.alert('Error', 'Please enter time to take');
      return false;
    }
    if (!formData.refillDate.trim()) {
      Alert.alert('Error', 'Please enter refill date');
      return false;
    }
    return true;
  };

  const openRefillPicker = () => {
    setShowRefillPicker(true);
  };

  const openTimePicker = () => {
    // Ensure timeObj is set from existing time string if available
    if (formData.timeToTake && !timeObj) {
      const parsed = parseTimeString(formData.timeToTake);
      if (parsed) {
        setTimeObj(parsed);
      }
    }
    // If still no timeObj, use current time
    if (!timeObj) {
      setTimeObj(new Date());
    }
    setShowTimePicker(true);
  };

  const onChangeRefillDate = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowRefillPicker(false);
    }
    if (event?.type === 'dismissed') {
      setShowRefillPicker(false);
      return;
    }
    
    const date = selectedDate || refillDateObj || new Date();
    setRefillDateObj(date);
    handleInputChange('refillDate', formatDateDDMMYYYY(date));
    
    // Also set the date field for notifications (YYYY-MM-DD format)
    handleInputChange('date', formatDateYYYYMMDD(date));
    
    if (Platform.OS === 'ios') {
      setShowRefillPicker(false);
    }
  };

  const onChangeTime = (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (event?.type === 'dismissed') {
      setShowTimePicker(false);
      return;
    }
    
    const time = selectedTime || timeObj || new Date();
    setTimeObj(time);
    handleInputChange('timeToTake', formatTime(time));
    
    if (Platform.OS === 'ios') {
      setShowTimePicker(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!user) {
      Alert.alert('Error', 'Please login to add medicines');
      return;
    }

    setLoading(true);
    try {
      const medicineData = {
        name: formData.name.trim(),
        dosage: formData.dosage.trim(),
        frequency: formData.frequency.trim(),
        timeToTake: formData.timeToTake.trim(),
        refillDate: formData.refillDate.trim(),
        date: formData.date, // For one-time notifications
        daysOfWeek: formData.daysOfWeek, // For weekly notifications
        userId: user.uid,
        createdAt: editingMedicine ? editingMedicine.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      let newMedicineId;

      if (editingMedicine) {
        // Update existing medicine
        const medicineRef = doc(firestore, 'medicines', editingMedicine.id);
        await updateDoc(medicineRef, medicineData);
        newMedicineId = editingMedicine.id;
        
        // Cancel existing notification and schedule new one if enabled
        await cancelScheduledNotification(editingMedicine.id);
        if (notificationsEnabled && formData.timeToTake) {
          const medicineWithId = { ...medicineData, id: editingMedicine.id };
          await scheduleNotificationForMedicine(medicineWithId);
        }
        
        if (showSuccessAlert) {
          showSuccessAlert('Medicine updated successfully!');
        }
      } else {
        // Add new medicine
        const docRef = await addDoc(collection(firestore, 'medicines'), medicineData);
        newMedicineId = docRef.id;
        
        // Schedule notification if enabled
        if (notificationsEnabled && formData.timeToTake) {
          const medicineWithId = { ...medicineData, id: newMedicineId };
          await scheduleNotificationForMedicine(medicineWithId);
        }
        
        if (showSuccessAlert) {
          showSuccessAlert('Medicine added successfully!');
        }
      }

      // Pass the new medicine data to parent component
      const newMedicine = { ...medicineData, id: newMedicineId };
      onMedicineAdded(newMedicine);
      handleClose();
      
    } catch (error) {
      console.error('Error saving medicine:', error);
      if (showErrorAlert) {
        showErrorAlert('Failed to save medicine. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to save medicine. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (isRecording) {
      stopVoiceRecognition();
    }
    setFormData({
      name: '',
      dosage: '',
      frequency: '',
      timeToTake: '',
      refillDate: '',
      date: '',
      daysOfWeek: []
    });
    setRefillDateObj(null);
    setTimeObj(null);
    setShowRefillPicker(false);
    setShowTimePicker(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
            keyboardDismissMode="interactive"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton} accessibilityLabel="Back">
                <Icon name="arrow-left" size={24} color="#6B705B" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingMedicine ? 'Edit Medicine' : 'Add Medicine'}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Medicine Name *</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    value={formData.name}
                    onChangeText={(text) => handleInputChange('name', text)}
                    placeholder="Enter medicine name"
                    placeholderTextColor="#999"
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Dosage *</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    value={formData.dosage}
                    onChangeText={(text) => handleInputChange('dosage', text)}
                    placeholder="e.g., 500mg, 1 tablet"
                    placeholderTextColor="#999"
                  />
                  {/* <TouchableOpacity 
                    style={[styles.voiceButton, isRecording && currentField === 'dosage' && styles.recordingButton]}
                    onPress={() => handleVoiceInput('dosage')}
                  >
                    <Icon 
                      name={isRecording && currentField === 'dosage' ? 'pause' : 'mic'} 
                      size={20} 
                      color={isRecording && currentField === 'dosage' ? '#E63946' : '#6B705B'} 
                    />
                    {recognizing && currentField === 'dosage' && (
                      <View style={styles.recordingIndicator} />
                    )}
                  </TouchableOpacity> */}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Frequency *</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    value={formData.frequency}
                    onChangeText={(text) => handleInputChange('frequency', text)}
                    placeholder="e.g., 2 times per day, weekly, daily"
                    placeholderTextColor="#999"
                  />
                  {/* <TouchableOpacity 
                    style={[styles.voiceButton, isRecording && currentField === 'frequency' && styles.recordingButton]}
                    onPress={() => handleVoiceInput('frequency')}
                  >
                    <Icon 
                      name={isRecording && currentField === 'frequency' ? 'pause' : 'mic'} 
                      size={20} 
                      color={isRecording && currentField === 'frequency' ? '#E63946' : '#6B705B'} 
                    />
                    {recognizing && currentField === 'frequency' && (
                      <View style={styles.recordingIndicator} />
                    )}
                  </TouchableOpacity> */}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Time to Take *</Text>
                <View style={styles.inputRow}>
                  <TouchableOpacity 
                    style={[styles.textInput, { flex: 1 }]}
                    onPress={openTimePicker}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.inputText, !formData.timeToTake && styles.placeholderText]}>
                      {formData.timeToTake || "e.g., 9:00 AM, 2:00 PM"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.voiceButton}
                    onPress={openTimePicker}
                  >
                    <Icon name="clock" size={20} color="#6B705B" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Refill Date *</Text>
                <View style={styles.inputRow}>
                  <TouchableOpacity 
                    style={[styles.textInput, { flex: 1 }]}
                    onPress={openRefillPicker}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.inputText, !formData.refillDate && styles.placeholderText]}>
                      {formData.refillDate || "DD/MM/YYYY"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.voiceButton}
                    onPress={openRefillPicker}
                  >
                    <Icon name="calendar" size={20} color="#6B705B" />
                  </TouchableOpacity>
                </View>
              </View>
              
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.submitButton, loading && styles.disabledButton]} 
                onPress={handleSubmit}
                disabled={loading}
              >
                <Icon name="check" size={18} color="#fff" />
                <Text style={styles.submitButtonText}>
                  {loading ? 'Saving...' : (editingMedicine ? 'Update' : 'Submit')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                <Icon name="x" size={18} color="#6B705B" />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {/* Date/Time Picker Modal */}
      {(showRefillPicker || showTimePicker) && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setShowRefillPicker(false);
            setShowTimePicker(false);
          }}
        >
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity 
                  onPress={() => {
                    setShowRefillPicker(false);
                    setShowTimePicker(false);
                  }}
                  style={styles.pickerCancelButton}
                >
                  <Text style={styles.pickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>
                  {showRefillPicker ? 'Select Date' : 'Select Time'}
                </Text>
                <TouchableOpacity 
                  onPress={() => {
                    if (showRefillPicker) {
                      onChangeRefillDate({ type: 'set' }, refillDateObj || new Date());
                    } else {
                      onChangeTime({ type: 'set' }, timeObj || new Date());
                    }
                  }}
                  style={styles.pickerDoneButton}
                >
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              
              {showRefillPicker && (
                <DateTimePicker
                  value={refillDateObj || new Date()}
                  mode="date"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setRefillDateObj(selectedDate);
                    }
                  }}
                  minimumDate={new Date()}
                  style={styles.picker}
                />
              )}
              
              {showTimePicker && (
                <DateTimePicker
                  value={timeObj || new Date()}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  is24Hour={false}
                  onChange={(event, selectedTime) => {
                    if (selectedTime) {
                      setTimeObj(selectedTime);
                    }
                  }}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6B705B',
  },
  closeButton: {
    padding: 5,
  },
  formContainer: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#24507A',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E9E9E0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#495057',
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 16,
    color: '#495057',
  },
  placeholderText: {
    color: '#999',
  },
  helperText: {
    fontSize: 12,
    color: '#6B705B',
    marginTop: 4,
    fontStyle: 'italic',
  },
  voiceButton: {
    padding: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9E9E0',
    position: 'relative',
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FD',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#24507A',
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#6B705B',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E9E9E0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B705B',
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

export default AddMedicineModal;