import React, { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { AIService } from '../utils/aiService'

const RealtimeVoiceChat = ({ conversationHistory = [], medicationContext = "", patientProfile = "" }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const microphoneRef = useRef(null)

  useEffect(() => {
    // Initialize audio context
    initializeAudio()
    
    // Set up event handlers
    AIService.setEventHandlers({
      onTranscript: handleTranscript,
      onResponse: handleResponse,
      onError: handleError,
      onConnectionChange: handleConnectionChange
    })

    return () => {
      // Cleanup
      AIService.closeConnection()
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const initializeAudio = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      })
      
      // Create audio context
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      })
      
      // Create analyser for voice activity detection
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 2048
      
      // Connect microphone to analyser
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream)
      microphoneRef.current.connect(analyserRef.current)
      
      console.log('Audio initialized successfully')
    } catch (error) {
      console.error('Error initializing audio:', error)
      Alert.alert('Error', 'Failed to access microphone. Please check permissions.')
    }
  }

  const handleTranscript = (transcriptData) => {
    console.log('Transcript received:', transcriptData)
    setTranscript(transcriptData)
  }

  const handleResponse = (responseData, type) => {
    console.log('Response received:', responseData, type)
    if (type === 'text') {
      setResponse(prev => prev + responseData)
    } else if (type === 'audio') {
      // Handle audio response - you can play it here
      console.log('Audio response chunk received')
    }
  }

  const handleError = (error) => {
    console.error('AI Service error:', error)
    Alert.alert('Error', 'Something went wrong with the AI service')
  }

  const handleConnectionChange = (connected) => {
    console.log('Connection status changed:', connected)
    setIsConnected(connected)
  }

  const connectToRealtime = async () => {
    try {
      setIsLoading(true)
      const success = await AIService.initializeRealtimeConnection(
        conversationHistory,
        medicationContext,
        patientProfile
      )
      
      if (success) {
        Alert.alert('Success', 'Connected to AI voice chat!')
      } else {
        Alert.alert('Error', 'Failed to connect to AI service')
      }
    } catch (error) {
      console.error('Error connecting to realtime:', error)
      Alert.alert('Error', 'Failed to connect to AI service')
    } finally {
      setIsLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      if (!isConnected) {
        Alert.alert('Error', 'Please connect to AI service first')
        return
      }

      setIsRecording(true)
      setTranscript('')
      setResponse('')
      
      // Start recording audio
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      })
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      audioChunksRef.current = []
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioBuffer = await audioBlob.arrayBuffer()
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        const decodedAudio = await audioContext.decodeAudioData(audioBuffer)
        
        // Process audio for realtime API
        const processedAudio = await AIService.processAudioForRealtime(decodedAudio.getChannelData(0))
        
        if (processedAudio) {
          AIService.sendAudioData(processedAudio)
          AIService.commitAudioBuffer()
        }
      }
      
      mediaRecorderRef.current.start(100) // Collect data every 100ms
      
    } catch (error) {
      console.error('Error starting recording:', error)
      Alert.alert('Error', 'Failed to start recording')
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const sendTextMessage = (message) => {
    if (!isConnected) {
      Alert.alert('Error', 'Please connect to AI service first')
      return
    }
    
    AIService.sendTextMessage(message)
  }

  const disconnect = () => {
    AIService.closeConnection()
    setIsConnected(false)
    setTranscript('')
    setResponse('')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Voice Chat</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Status: {isConnected ? 'Connected' : 'Disconnected'}
        </Text>
      </View>

      {!isConnected ? (
        <TouchableOpacity 
          style={[styles.button, styles.connectButton]} 
          onPress={connectToRealtime}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Connecting...' : 'Connect to AI'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={[styles.button, isRecording ? styles.stopButton : styles.recordButton]} 
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Text style={styles.buttonText}>
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.disconnectButton]} 
            onPress={disconnect}
          >
            <Text style={styles.buttonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      )}

      {transcript && (
        <View style={styles.transcriptContainer}>
          <Text style={styles.label}>Transcript:</Text>
          <Text style={styles.transcriptText}>{transcript}</Text>
        </View>
      )}

      {response && (
        <View style={styles.responseContainer}>
          <Text style={styles.label}>AI Response:</Text>
          <Text style={styles.responseText}>{response}</Text>
        </View>
      )}

      {/* Test text message */}
      <TouchableOpacity 
        style={[styles.button, styles.textButton]} 
        onPress={() => sendTextMessage('Hello, I have a headache')}
        disabled={!isConnected}
      >
        <Text style={styles.buttonText}>Send Test Message</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333'
  },
  statusContainer: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666'
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 120
  },
  connectButton: {
    backgroundColor: '#4CAF50',
    alignSelf: 'center'
  },
  recordButton: {
    backgroundColor: '#2196F3'
  },
  stopButton: {
    backgroundColor: '#f44336'
  },
  disconnectButton: {
    backgroundColor: '#ff9800'
  },
  textButton: {
    backgroundColor: '#9C27B0',
    marginTop: 10
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  transcriptContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3'
  },
  responseContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50'
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333'
  },
  transcriptText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  },
  responseText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  }
})

export default RealtimeVoiceChat

