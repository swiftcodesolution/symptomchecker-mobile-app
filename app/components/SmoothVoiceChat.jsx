import React, { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native'
import { AIService } from '../utils/aiService'
import Icon from 'react-native-vector-icons/Feather'

const SmoothVoiceChat = ({ 
  conversationHistory = [], 
  medicationContext = "", 
  patientProfile = "",
  onTranscript = () => {},
  onResponse = () => {},
  onError = () => {},
  style = {}
}) => {
  const [isConnected, setIsConnected] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [connectionStatus, setConnectionStatus] = useState('Disconnected')
  
  const pulseAnim = useRef(new Animated.Value(1)).current
  const waveAnim = useRef(new Animated.Value(0)).current
  const typingAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    initializeConnection()
    
    return () => {
      AIService.closeConnection()
    }
  }, [])

  const initializeConnection = async () => {
    try {
      setConnectionStatus('Connecting...')
      
      // Set up event handlers
      AIService.setEventHandlers({
        onTranscript: (transcriptData) => {
          console.log('Transcript received:', transcriptData)
          setTranscript(transcriptData)
          onTranscript(transcriptData)
        },
        onResponse: (responseData, type) => {
          console.log('Response received:', responseData, type)
          if (type === 'text') {
            setResponse(responseData)
            onResponse(responseData, type)
            // Start typing animation
            startTypingAnimation()
          }
        },
        onError: (error) => {
          console.error('AI Service error:', error)
          setConnectionStatus('Error')
          onError(error)
        },
        onConnectionChange: (connected) => {
          console.log('Connection status:', connected)
          setIsConnected(connected)
          setConnectionStatus(connected ? 'Connected' : 'Disconnected')
        },
        onAudioStart: () => {
          console.log('Audio started')
          setIsSpeaking(true)
          startSpeakingAnimation()
        },
        onAudioStop: () => {
          console.log('Audio stopped')
          setIsSpeaking(false)
          stopSpeakingAnimation()
        },
        onAudioComplete: () => {
          console.log('Audio completed')
          setIsSpeaking(false)
          stopSpeakingAnimation()
          setIsProcessing(false)
          // Ready for next voice input
          setConnectionStatus('Ready')
        }
      })

      // Initialize connection
      const success = await AIService.initializeRealtimeConnection(
        conversationHistory,
        medicationContext,
        patientProfile
      )
      
      if (success) {
        setConnectionStatus('Ready')
      } else {
        setConnectionStatus('Failed to connect')
      }
    } catch (error) {
      console.error('Error initializing connection:', error)
      setConnectionStatus('Error')
      onError(error)
    }
  }

  const startListening = async () => {
    try {
      if (!isConnected) {
        Alert.alert('Error', 'Please connect to AI service first')
        return
      }

      setIsListening(true)
      setTranscript('')
      setResponse('')
      setConnectionStatus('Listening...')
      
      // Start pulse animation
      startPulseAnimation()
      
    } catch (error) {
      console.error('Error starting listening:', error)
      onError(error)
    }
  }

  const stopListening = async () => {
    setIsListening(false)
    setConnectionStatus('Processing...')
    setIsProcessing(true)
    stopPulseAnimation()
    
    if (transcript.trim()) {
      // Send message to AI
      await AIService.sendTextMessage(transcript.trim())
    }
  }

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation()
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }

  const startSpeakingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }

  const stopSpeakingAnimation = () => {
    waveAnim.stopAnimation()
    Animated.timing(waveAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }

  const startTypingAnimation = () => {
    Animated.timing(typingAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start()
  }

  const handleVoiceButtonPress = async () => {
    if (isSpeaking) {
      Alert.alert('Please wait', 'AI is currently speaking')
      return
    }

    if (isListening) {
      await stopListening()
    } else {
      await startListening()
    }
  }

  const getButtonColor = () => {
    if (isSpeaking) return '#FF6B35'
    if (isListening) return '#4CAF50'
    if (isProcessing) return '#FF9800'
    return '#6B705B'
  }

  const getButtonIcon = () => {
    if (isSpeaking) return 'volume-2'
    if (isListening) return 'mic'
    if (isProcessing) return 'loader'
    return 'mic'
  }

  const getButtonText = () => {
    if (isSpeaking) return 'AI Speaking...'
    if (isListening) return 'Tap to Send'
    if (isProcessing) return 'Processing...'
    return 'Tap to Speak'
  }

  return (
    <View style={[styles.container, style]}>
      {/* Voice Button */}
      <TouchableOpacity
        style={[
          styles.voiceButton,
          { backgroundColor: getButtonColor() },
          (isListening || isSpeaking) && styles.activeButton
        ]}
        onPress={handleVoiceButtonPress}
        disabled={isProcessing}
      >
        <Animated.View
          style={[
            styles.buttonContent,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <Icon 
            name={getButtonIcon()} 
            size={40} 
            color="white" 
          />
        </Animated.View>
        
        {/* Speaking Wave Animation */}
        {isSpeaking && (
          <Animated.View
            style={[
              styles.waveContainer,
              {
                opacity: waveAnim,
                transform: [{ scale: waveAnim }]
              }
            ]}
          >
            <View style={styles.wave} />
            <View style={[styles.wave, styles.wave2]} />
            <View style={[styles.wave, styles.wave3]} />
          </Animated.View>
        )}
      </TouchableOpacity>

      {/* Button Text */}
      <Text style={styles.buttonText}>{getButtonText()}</Text>

      {/* Transcript Display */}
      {transcript && (
        <View style={styles.transcriptContainer}>
          <Text style={styles.transcriptLabel}>You said:</Text>
          <Text style={styles.transcriptText}>{transcript}</Text>
        </View>
      )}

      {/* Response Display with Typing Animation */}
      {response && (
        <View style={styles.responseContainer}>
          <Text style={styles.responseLabel}>AI Response:</Text>
          <Animated.View style={{ opacity: typingAnim }}>
            <Text style={styles.responseText}>{response}</Text>
          </Animated.View>
        </View>
      )}

      {/* Connection Status */}
      <View style={styles.statusContainer}>
        <View style={[
          styles.statusDot, 
          { backgroundColor: isConnected ? '#4CAF50' : '#f44336' }
        ]} />
        <Text style={styles.statusText}>{connectionStatus}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  voiceButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
  },
  activeButton: {
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveContainer: {
    position: 'absolute',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  wave2: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  wave3: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  buttonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    textAlign: 'center',
  },
  transcriptContainer: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  transcriptLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 5,
  },
  transcriptText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  responseContainer: {
    backgroundColor: '#E8F5E8',
    padding: 15,
    borderRadius: 12,
    marginTop: 15,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  responseLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#388E3C',
    marginBottom: 5,
  },
  responseText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
})

export default SmoothVoiceChat

