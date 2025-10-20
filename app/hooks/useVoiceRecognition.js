import { useState, useEffect } from 'react';
import { Platform, PermissionsAndroid, Alert, NativeModules } from 'react-native';

// Voice recognition implementation using platform-specific APIs
const VoiceRecognition = {
  isAvailable: true,
  
  requestPermission: async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone for voice recognition.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  },

  start: async () => {
    if (Platform.OS === 'android') {
      try {
        const { SpeechRecognition } = NativeModules;
        
        if (SpeechRecognition) {
          return new Promise((resolve, reject) => {
            SpeechRecognition.startRecognition()
              .then((result) => {
                console.log('Speech recognition result:', result);
                resolve(result);
              })
              .catch((error) => {
                console.error('Speech recognition error:', error);
                reject(error);
              });
          });
        } else {
          // Fallback: return empty string when native module is not available
          console.log('Native speech recognition not available');
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve('');
            }, 1000);
          });
        }
      } catch (error) {
        console.error('Speech recognition error:', error);
        // Fallback: return empty string on error
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve('');
          }, 1000);
        });
      }
    } else if (Platform.OS === 'web') {
      // Web fallback - try to use browser speech recognition
      if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        return new Promise((resolve, reject) => {
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = 'en-US';
          recognition.maxAlternatives = 1;
          
          let timeoutId = setTimeout(() => {
            console.log('Speech recognition timeout - no speech detected');
            recognition.stop();
            resolve('');
          }, 10000); // 10 second timeout
          
          recognition.onstart = () => {
            console.log('Speech recognition started');
          };
          
          recognition.onresult = (event) => {
            console.log('Speech recognition result:', event);
            clearTimeout(timeoutId);
            const transcript = event.results[0][0].transcript;
            console.log('Transcript:', transcript);
            resolve(transcript);
          };
          
          recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            clearTimeout(timeoutId);
            reject(new Error(event.error));
          };
          
          recognition.onend = () => {
            console.log('Speech recognition ended');
            clearTimeout(timeoutId);
          };
          
          console.log('Starting speech recognition...');
          recognition.start();
        });
      } else {
        console.log('Speech recognition not supported in this browser');
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve('');
          }, 1000);
        });
      }
    } else {
      // iOS fallback - return empty string
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve('');
        }, 1000);
      });
    }
  },

  stop: async () => {
    if (Platform.OS === 'android') {
      try {
        const { SpeechRecognition } = NativeModules;
        if (SpeechRecognition) {
          await SpeechRecognition.stopRecognition();
        }
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
  }
};

export const useVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);

  const startRecording = async () => {
    try {
      setError(null);
      setTranscript('');
      setIsListening(true);
      
      console.log('Starting voice recognition...');
      const result = await VoiceRecognition.start();
      console.log('Voice recognition result:', result);
      
      if (result && result.trim()) {
        setTranscript(result);
      } else {
        console.log('No speech detected or empty result');
        setTranscript('');
      }
      setIsListening(false);
      
    } catch (err) {
      console.error('Error starting voice recognition:', err);
      setError(err.message);
      setIsListening(false);
      
      // Fallback: provide empty string without alert
      setTimeout(() => {
        setTranscript('');
        setIsListening(false);
      }, 1000);
    }
  };

  const stopRecording = async () => {
    try {
      await VoiceRecognition.stop();
      setIsListening(false);
    } catch (err) {
      console.error('Error stopping voice recognition:', err);
    }
  };

  return {
    isListening,
    transcript,
    error,
    startRecording,
    stopRecording,
    isAvailable: true // Always available with fallback
  };
};