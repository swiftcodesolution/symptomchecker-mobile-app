import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeModules, NativeEventEmitter } from 'react-native';
import Voice from '@react-native-voice/voice';
import AnimatedBackground from './components/AnimatedBackground';

const TestVoice = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [voiceAvailable, setVoiceAvailable] = useState(false);

  const { MyModule } = NativeModules;

  // Voice library event handlers
  useEffect(() => {
    Voice.onSpeechStart = () => {
      console.log('Voice recognition started');
      setIsListening(true);
      setError('');
    };

    Voice.onSpeechEnd = () => {
      console.log('Voice recognition ended');
      setIsListening(false);
    };

    Voice.onSpeechResults = (event) => {
      console.log('Voice recognition results:', event);
      if (event.value && event.value[0]) {
        setTranscript(event.value[0]);
      }
      setIsListening(false);
    };

    Voice.onSpeechError = (event) => {
      console.log('Voice recognition error:', event);
      // setError(event.error?.message || 'Voice recognition error');
      setIsListening(false);
    };

    // Check if Voice is available
    const checkVoiceAvailability = async () => {
      try {
        const isAvailable = await Voice.isAvailable();
        setVoiceAvailable(isAvailable);
      } catch (err) {
        console.error('Error checking voice availability:', err);
        setVoiceAvailable(false);
      }
    };

    checkVoiceAvailability();

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  // Native module event handlers (for Android)
  useEffect(() => {
    if (Platform.OS === 'android' && MyModule) {
      const eventEmitter = new NativeEventEmitter(MyModule);
      
      const subscription = eventEmitter.addListener('onChange', (event) => {
        console.log('Native voice recognition result:', event);
        setTranscript(event.value);
        setIsListening(false);
        setError('');
      });

      return () => {
        subscription.remove();
      };
    }
  }, []);

  const handleStartRecording = async () => {
    try {
      setError('');
      setTranscript('');
      
      // Try Voice library first
      if (voiceAvailable) {
        console.log('Starting Voice library recognition...');
        await Voice.start('en-US');
      } else if (Platform.OS === 'android' && MyModule) {
        console.log('Starting native voice recognition...');
        await MyModule.startRecording();
      } else {
        throw new Error('Voice recognition not available on this platform');
      }
    } catch (err) {
      console.error('Error starting voice recognition:', err);
      setError(err.message);
      setIsListening(false);
    }
  };

  const handleStopRecording = async () => {
    try {
      if (voiceAvailable) {
        await Voice.stop();
      } else if (Platform.OS === 'android' && MyModule) {
        // Native module doesn't have stop method, just set state
        setIsListening(false);
      }
    } catch (err) {
      console.error('Error stopping voice recognition:', err);
    }
  };

  const isAvailable = voiceAvailable || (Platform.OS === 'android' && !!MyModule);

  return (
    <AnimatedBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Voice Recognition Test</Text>
          
          <Text style={styles.status}>
            Platform: {Platform.OS}
          </Text>
          
          <Text style={styles.status}>
            Voice Library Available: {voiceAvailable ? 'Yes' : 'No'}
          </Text>
          
          <Text style={styles.status}>
            Native Module Available: {Platform.OS === 'android' && !!MyModule ? 'Yes' : 'No'}
          </Text>
          
          <Text style={styles.status}>
            Overall Available: {isAvailable ? 'Yes' : 'No'}
          </Text>
          
          <Text style={styles.status}>
            Listening: {isListening ? 'Yes' : 'No'}
          </Text>
          
          {transcript && (
            <View style={styles.transcriptContainer}>
              <Text style={styles.transcriptLabel}>Transcript:</Text>
              <Text style={styles.transcript}>{transcript}</Text>
            </View>
          )}
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorLabel}>Error:</Text>
              <Text style={styles.error}>{error}</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={[styles.button, !isAvailable && styles.buttonDisabled]} 
            onPress={isListening ? handleStopRecording : handleStartRecording}
            disabled={!isAvailable}
          >
            <Text style={styles.buttonText}>
              {isListening ? 'Stop Recording' : 'Start Recording'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.instructions}>
            {isAvailable 
              ? 'Tap the button to start voice recognition. Speak clearly when prompted.'
              : 'Voice recognition is not available on this platform or device.'
            }
          </Text>
        </View>
      </SafeAreaView>
    </AnimatedBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  status: {
    fontSize: 16,
    marginBottom: 10,
    color: '#666',
  },
  transcriptContainer: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginVertical: 15,
    width: '100%',
  },
  transcriptLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  transcript: {
    fontSize: 16,
    color: '#333',
    fontStyle: 'italic',
  },
  errorContainer: {
    backgroundColor: '#ffe6e6',
    padding: 15,
    borderRadius: 10,
    marginVertical: 15,
    width: '100%',
  },
  errorLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#d32f2f',
  },
  error: {
    fontSize: 16,
    color: '#d32f2f',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginVertical: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructions: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    paddingHorizontal: 20,
  },
});

export default TestVoice; 