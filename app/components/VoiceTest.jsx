import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';

const VoiceTest = () => {
  const { 
    isListening, 
    transcript, 
    error, 
    startRecording, 
    stopRecording, 
    isAvailable 
  } = useVoiceRecognition();

  const handleTest = async () => {
    if (isAvailable) {
      try {
        await startRecording();
        Alert.alert('Test', 'Voice recognition started. Speak now!');
      } catch (err) {
        Alert.alert('Error', err.message);
      }
    } else {
      Alert.alert('Not Available', 'Voice recognition is not available on this device.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice Recognition Test</Text>
      
      <Text style={styles.status}>
        Status: {isAvailable ? 'Available' : 'Not Available'}
      </Text>
      
      <Text style={styles.status}>
        Listening: {isListening ? 'Yes' : 'No'}
      </Text>
      
      {transcript && (
        <Text style={styles.transcript}>
          Transcript: {transcript}
        </Text>
      )}
      
      {error && (
        <Text style={styles.error}>
          Error: {error}
        </Text>
      )}
      
      <TouchableOpacity 
        style={[styles.button, !isAvailable && styles.buttonDisabled]} 
        onPress={handleTest}
        disabled={!isAvailable}
      >
        <Text style={styles.buttonText}>
          {isListening ? 'Stop Recording' : 'Start Recording'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  status: {
    fontSize: 14,
    marginBottom: 5,
  },
  transcript: {
    fontSize: 14,
    marginBottom: 5,
    fontStyle: 'italic',
  },
  error: {
    fontSize: 14,
    marginBottom: 5,
    color: 'red',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default VoiceTest; 