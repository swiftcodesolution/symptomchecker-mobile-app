import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { AIService } from '../utils/aiService'

// Example integration showing how to use AIService Realtime API in existing components
const VoiceChatIntegration = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [conversationHistory, setConversationHistory] = useState([])
  const [medicationContext, setMedicationContext] = useState('')
  const [patientProfile, setPatientProfile] = useState('')

  useEffect(() => {
    // Set up event handlers
    AIService.setEventHandlers({
      onTranscript: handleTranscript,
      onResponse: handleResponse,
      onError: handleError,
      onConnectionChange: handleConnectionChange
    })

    // Load user data (example)
    loadUserData()

    return () => {
      AIService.closeConnection()
    }
  }, [])

  const loadUserData = async () => {
    try {
      // Example: Load user's medications and profile
      // This would typically come from your Redux store or Firebase
      setMedicationContext('Ibuprofen 200mg, Vitamin D3 1000IU')
      setPatientProfile('Age: 35, Allergies: None, Medical History: Hypertension')
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const handleTranscript = (transcript) => {
    console.log('User said:', transcript)
    
    // Add to conversation history
    setConversationHistory(prev => [...prev, {
      id: Date.now(),
      text: transcript,
      isUser: true,
      timestamp: new Date()
    }])
  }

  const handleResponse = (responseData, type) => {
    console.log('AI response:', responseData, type)
    
    if (type === 'text') {
      // Handle text response
      setConversationHistory(prev => [...prev, {
        id: Date.now(),
        text: responseData,
        isUser: false,
        timestamp: new Date()
      }])
    } else if (type === 'audio') {
      // Handle audio response - play audio
      console.log('Playing audio response...')
    }
  }

  const handleError = (error) => {
    console.error('AI Service error:', error)
    Alert.alert('Error', 'AI service encountered an error')
  }

  const handleConnectionChange = (connected) => {
    setIsConnected(connected)
    console.log('Connection status:', connected ? 'Connected' : 'Disconnected')
  }

  const startVoiceChat = async () => {
    try {
      const success = await AIService.initializeRealtimeConnection(
        conversationHistory,
        medicationContext,
        patientProfile
      )
      
      if (success) {
        Alert.alert('Success', 'Voice chat started!')
      } else {
        Alert.alert('Error', 'Failed to start voice chat')
      }
    } catch (error) {
      console.error('Error starting voice chat:', error)
      Alert.alert('Error', 'Failed to start voice chat')
    }
  }

  const stopVoiceChat = () => {
    AIService.closeConnection()
    Alert.alert('Info', 'Voice chat stopped')
  }

  const sendTextMessage = () => {
    if (!isConnected) {
      Alert.alert('Error', 'Please start voice chat first')
      return
    }
    
    AIService.sendTextMessage('I have a headache and feel dizzy')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice Chat Integration Example</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </Text>
      </View>

      <View style={styles.controlsContainer}>
        {!isConnected ? (
          <TouchableOpacity style={styles.startButton} onPress={startVoiceChat}>
            <Text style={styles.buttonText}>Start Voice Chat</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.connectedControls}>
            <TouchableOpacity style={styles.stopButton} onPress={stopVoiceChat}>
              <Text style={styles.buttonText}>Stop Voice Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.textButton} onPress={sendTextMessage}>
              <Text style={styles.buttonText}>Send Test Message</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.conversationContainer}>
        <Text style={styles.conversationTitle}>Conversation History:</Text>
        {conversationHistory.length === 0 ? (
          <Text style={styles.emptyText}>No conversation yet</Text>
        ) : (
          conversationHistory.map((message) => (
            <View key={message.id} style={[
              styles.messageContainer,
              message.isUser ? styles.userMessage : styles.aiMessage
            ]}>
              <Text style={styles.messageText}>{message.text}</Text>
              <Text style={styles.timestampText}>
                {message.timestamp.toLocaleTimeString()}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Features:</Text>
        <Text style={styles.infoText}>• Real-time voice conversation</Text>
        <Text style={styles.infoText}>• Automatic speech-to-text</Text>
        <Text style={styles.infoText}>• AI text and voice responses</Text>
        <Text style={styles.infoText}>• Medication context awareness</Text>
        <Text style={styles.infoText}>• Patient profile integration</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2c3e50'
  },
  statusContainer: {
    backgroundColor: '#ecf0f1',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center'
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34495e'
  },
  controlsContainer: {
    marginBottom: 20
  },
  startButton: {
    backgroundColor: '#27ae60',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  connectedControls: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  stopButton: {
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 0.45
  },
  textButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 0.45
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  conversationContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20
  },
  conversationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50'
  },
  emptyText: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginTop: 20
  },
  messageContainer: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
    maxWidth: '80%'
  },
  userMessage: {
    backgroundColor: '#3498db',
    alignSelf: 'flex-end'
  },
  aiMessage: {
    backgroundColor: '#ecf0f1',
    alignSelf: 'flex-start'
  },
  messageText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20
  },
  timestampText: {
    fontSize: 10,
    color: '#7f8c8d',
    marginTop: 5
  },
  infoContainer: {
    backgroundColor: '#e8f4f8',
    padding: 15,
    borderRadius: 10
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50'
  },
  infoText: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 5
  }
})

export default VoiceChatIntegration

