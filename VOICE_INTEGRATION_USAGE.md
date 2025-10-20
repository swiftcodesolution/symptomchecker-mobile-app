# Enhanced Voice Integration Usage Guide

## 🎯 Features Implemented

### ✅ Voice Input with Audio Feedback
- **Click voice button** → Voice recognition starts
- **Real-time transcript** → Shows what you're saying
- **Audio response** → AI speaks back with ChatGPT-5 voice
- **Smooth flow** → One voice completes before next starts

### ✅ ChatGPT-5 Voice Integration
- **High-quality voice** → Uses OpenAI's latest voice model
- **Natural speech** → Sounds like ChatGPT-5
- **Audio queue** → Smooth playback without interruptions

## 🚀 How to Use

### 1. Basic Integration in Your Component

```javascript
import { AIService } from '../utils/aiService'

// In your component
useEffect(() => {
  // Setup event handlers
  AIService.setEventHandlers({
    onTranscript: (transcript) => {
      console.log('User said:', transcript)
      // Update UI with transcript
    },
    onResponse: (responseData, type) => {
      if (type === 'text') {
        console.log('AI text response:', responseData)
        // Update UI with text response
      }
    },
    onAudioStart: () => {
      console.log('AI started speaking')
      // Show speaking indicator
    },
    onAudioComplete: () => {
      console.log('AI finished speaking')
      // Hide speaking indicator
    },
    onError: (error) => {
      console.error('Voice error:', error)
      // Handle errors
    }
  })

  // Initialize connection
  AIService.initializeRealtimeConnection(
    conversationHistory,
    medicationContext,
    patientProfile
  )
}, [])
```

### 2. Voice Button Handler

```javascript
const handleVoiceButtonPress = async () => {
  if (isSpeaking) {
    Alert.alert("Please wait", "AI is currently speaking")
    return
  }

  if (isListening) {
    // Stop listening and send message
    await ExpoSpeechRecognitionModule.stop()
    if (voiceInputText.trim()) {
      AIService.sendTextMessage(voiceInputText.trim())
    }
  } else {
    // Start listening
    await startListening()
  }
}
```

### 3. Using EnhancedVoiceChat Component

```javascript
import EnhancedVoiceChat from '../components/EnhancedVoiceChat'

const MyComponent = () => {
  const [conversationHistory, setConversationHistory] = useState([])
  const [medicationContext, setMedicationContext] = useState('')
  const [patientProfile, setPatientProfile] = useState('')

  return (
    <EnhancedVoiceChat
      conversationHistory={conversationHistory}
      medicationContext={medicationContext}
      patientProfile={patientProfile}
      onTranscript={(transcript) => {
        console.log('Transcript:', transcript)
      }}
      onResponse={(response, type) => {
        console.log('Response:', response, type)
      }}
      onError={(error) => {
        console.error('Error:', error)
      }}
    />
  )
}
```

## 🔧 Configuration Options

### Voice Settings
```javascript
// In AIService.sendSessionConfig()
{
  voice: "alloy", // ChatGPT-5 voice
  voice_settings: {
    stability: 0.5,
    similarity_boost: 0.8
  }
}
```

### Audio Processing
```javascript
// Process audio for realtime API
const processedAudio = await AIService.processAudioForRealtime(audioBuffer)
AIService.sendAudioData(processedAudio)
AIService.commitAudioBuffer()
```

## 📱 UI States

### Connection Status
- **Disconnected** → Red dot, "Disconnected"
- **Connecting** → Orange dot, "Connecting..."
- **Connected** → Green dot, "Connected"
- **Listening** → Green dot, "Listening..."
- **Processing** → Orange dot, "Processing..."
- **AI Speaking** → Red dot, "AI Speaking..."

### Button States
- **Ready** → Gray button, "Tap to Speak"
- **Listening** → Green button, "Tap to Send"
- **Speaking** → Red button, "AI Speaking..."
- **Processing** → Orange button, "Processing..."

## 🎵 Audio Features

### Smooth Playback
- **Audio Queue** → Multiple audio chunks play smoothly
- **No Interruptions** → One audio completes before next starts
- **Visual Feedback** → Wave animations during speaking

### Voice Quality
- **PCM16 Format** → High-quality audio
- **16kHz Sample Rate** → Optimal for voice
- **Real-time Processing** → Low latency

## 🐛 Troubleshooting

### Common Issues

1. **Voice not working**
   ```javascript
   // Check connection status
   const status = AIService.getConnectionStatus()
   console.log('Connected:', status.isConnected)
   ```

2. **Audio not playing**
   ```javascript
   // Check audio status
   const audioStatus = AIService.getAudioStatus()
   console.log('Playing:', audioStatus.isPlaying)
   console.log('Queue:', audioStatus.queueLength)
   ```

3. **Connection errors**
   ```javascript
   // Reinitialize connection
   AIService.closeConnection()
   await AIService.initializeRealtimeConnection(...)
   ```

### Debug Mode
```javascript
// Enable detailed logging
AIService.setEventHandlers({
  onTranscript: (transcript) => console.log('🎤 Transcript:', transcript),
  onResponse: (response, type) => console.log('🤖 Response:', response, type),
  onAudioStart: () => console.log('🔊 Audio started'),
  onAudioComplete: () => console.log('✅ Audio completed'),
  onError: (error) => console.error('❌ Error:', error)
})
```

## 📊 Performance Tips

### 1. Connection Management
```javascript
// Initialize once, reuse connection
useEffect(() => {
  const initConnection = async () => {
    await AIService.initializeRealtimeConnection(...)
  }
  initConnection()
  
  return () => {
    // Only close on component unmount
    AIService.closeConnection()
  }
}, [])
```

### 2. Audio Processing
```javascript
// Process audio in chunks for better performance
const processAudioChunk = async (audioBuffer) => {
  const processedAudio = await AIService.processAudioForRealtime(audioBuffer)
  if (processedAudio) {
    AIService.sendAudioData(processedAudio)
  }
}
```

### 3. Memory Management
```javascript
// Clear audio queue when needed
AIService.audioQueue = []
AIService.stopAudioPlayback()
```

## 🎯 Best Practices

### 1. User Experience
- **Visual Feedback** → Show connection status
- **Audio Indicators** → Wave animations during speaking
- **Error Handling** → Graceful error messages
- **Loading States** → Show processing indicators

### 2. Performance
- **Connection Reuse** → Don't reconnect unnecessarily
- **Audio Queue** → Smooth playback
- **Memory Cleanup** → Clear resources when done

### 3. Error Handling
- **Network Issues** → Retry connection
- **Audio Errors** → Fallback to text
- **Permission Issues** → Request microphone access

## 🔄 Integration with Existing Code

### Replace Current Voice Implementation
```javascript
// Old way
const handleSendMessage = async (text, isFromVoice) => {
  // ... existing code
  Speech.speak(aiResponseText, { ... })
}

// New way
const handleSendMessage = async (text, isFromVoice) => {
  // ... existing code
  if (isFromVoice && AIService.getConnectionStatus().isConnected) {
    AIService.sendTextMessage(text)
    // Audio will play automatically via Realtime API
  } else {
    Speech.speak(aiResponseText, { ... })
  }
}
```

### Update Voice Button
```javascript
const isVoiceButtonDisabled = isSpeaking || isLoading || AIService.getAudioStatus().isPlaying
```

## 🎉 Result

Now you have:
- ✅ **Voice input** with real-time feedback
- ✅ **ChatGPT-5 voice** responses
- ✅ **Smooth audio flow** - one completes before next starts
- ✅ **Visual indicators** for all states
- ✅ **Error handling** and recovery
- ✅ **High-quality audio** with proper processing

The voice experience is now smooth, natural, and provides excellent user feedback! 🚀

