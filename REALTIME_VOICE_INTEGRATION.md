# OpenAI Realtime Voice Integration

Yeh guide explain karta hai ki kaise AIService class mein OpenAI Realtime API ko integrate kiya gaya hai aur kaise use karna hai.

## Features

- **Real-time Voice Conversation**: OpenAI ke Realtime API ke through live voice chat
- **Automatic Speech-to-Text**: User ke voice ko automatically text mein convert karta hai
- **AI Voice Responses**: AI text aur audio dono mein respond karta hai
- **Medication Context**: User ke current medications ko consider karta hai
- **Patient Profile Integration**: User ke medical history ko context mein use karta hai
- **Client-side Only**: Koi backend ya Firebase Functions ki zarurat nahi

## Setup

### 1. API Key Configuration

AIService class mein already API key configured hai:
```javascript
const OPENAI_API_KEY = "your-api-key-here"
```

### 2. Import AIService

```javascript
import { AIService } from '../utils/aiService'
```

## Usage

### Basic Voice Chat Setup

```javascript
import React, { useState, useEffect } from 'react'
import { AIService } from '../utils/aiService'

const MyVoiceComponent = () => {
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

    return () => {
      AIService.closeConnection()
    }
  }, [])

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
  }

  const handleConnectionChange = (connected) => {
    setIsConnected(connected)
  }

  const startVoiceChat = async () => {
    const success = await AIService.initializeRealtimeConnection(
      conversationHistory,
      medicationContext,
      patientProfile
    )
    
    if (success) {
      console.log('Voice chat started!')
    }
  }

  const stopVoiceChat = () => {
    AIService.closeConnection()
  }

  return (
    <div>
      <button onClick={isConnected ? stopVoiceChat : startVoiceChat}>
        {isConnected ? 'Stop Voice Chat' : 'Start Voice Chat'}
      </button>
    </div>
  )
}
```

### Audio Recording Integration

```javascript
const startRecording = async () => {
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
    
    const mediaRecorder = new MediaRecorder(stream)
    const audioChunks = []
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data)
      }
    }
    
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
      const audioBuffer = await audioBlob.arrayBuffer()
      const audioContext = new AudioContext()
      const decodedAudio = await audioContext.decodeAudioData(audioBuffer)
      
      // Process audio for realtime API
      const processedAudio = await AIService.processAudioForRealtime(
        decodedAudio.getChannelData(0)
      )
      
      if (processedAudio) {
        AIService.sendAudioData(processedAudio)
        AIService.commitAudioBuffer()
      }
    }
    
    mediaRecorder.start(100) // Collect data every 100ms
  } catch (error) {
    console.error('Error starting recording:', error)
  }
}
```

### Text Message Sending

```javascript
const sendTextMessage = (message) => {
  if (AIService.getConnectionStatus().isConnected) {
    AIService.sendTextMessage(message)
  }
}
```

## API Methods

### Connection Management

```javascript
// Initialize connection
await AIService.initializeRealtimeConnection(conversationHistory, medicationContext, patientProfile)

// Check connection status
const status = AIService.getConnectionStatus()
console.log('Connected:', status.isConnected)

// Close connection
AIService.closeConnection()
```

### Audio Processing

```javascript
// Process audio for realtime API
const processedAudio = await AIService.processAudioForRealtime(audioBuffer, sampleRate)

// Send audio data
AIService.sendAudioData(processedAudio)

// Commit audio buffer
AIService.commitAudioBuffer()
```

### Text Communication

```javascript
// Send text message
AIService.sendTextMessage('Hello, I have a headache')
```

### Event Handlers

```javascript
AIService.setEventHandlers({
  onTranscript: (transcript) => {
    console.log('User transcript:', transcript)
  },
  onResponse: (responseData, type) => {
    console.log('AI response:', responseData, type)
  },
  onError: (error) => {
    console.error('Error:', error)
  },
  onConnectionChange: (connected) => {
    console.log('Connection status:', connected)
  }
})
```

## Configuration Options

### Session Configuration

AIService automatically configures the session with these settings:

- **Model**: `gpt-4o-realtime-preview-2024-10-01`
- **Voice**: `alloy`
- **Audio Format**: PCM16, 16kHz
- **Transcription**: Whisper-1
- **Voice Activity Detection**: Server-side VAD
- **Temperature**: 0.7
- **Max Tokens**: 200

### Customization

Agar aap custom settings chahte hain, to `sendSessionConfig` method ko modify kar sakte hain:

```javascript
// In AIService.sendSessionConfig()
this.wsConnection.send(JSON.stringify({
  type: "session.update",
  session: {
    modalities: ["text", "audio"],
    instructions: systemPrompt,
    voice: "alloy", // Change voice: "alloy", "echo", "fable", "onyx", "nova", "shimmer"
    input_audio_format: "pcm16",
    output_audio_format: "pcm16",
    input_audio_transcription: {
      model: "whisper-1"
    },
    turn_detection: {
      type: "server_vad",
      threshold: 0.5, // Adjust sensitivity
      prefix_padding_ms: 300,
      silence_duration_ms: 500
    },
    temperature: 0.7, // Adjust creativity
    max_response_output_tokens: 200
  }
}))
```

## Error Handling

AIService automatically handles common errors:

- **API Key Issues**: Returns user-friendly error messages
- **Rate Limiting**: Suggests waiting and retrying
- **Network Issues**: Provides connection troubleshooting
- **Audio Processing**: Handles audio format conversion errors

## Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 14.5+)
- **Edge**: Full support

## Security Notes

- API key client-side exposed hai - production mein environment variables use karein
- Audio data directly OpenAI ko send hota hai
- No data stored locally (except conversation history)

## Troubleshooting

### Common Issues

1. **Microphone Permission Denied**
   - Check browser permissions
   - Use HTTPS (required for microphone access)

2. **WebSocket Connection Failed**
   - Check internet connection
   - Verify API key validity
   - Check firewall settings

3. **Audio Not Processing**
   - Ensure correct audio format (PCM16, 16kHz)
   - Check audio buffer size
   - Verify microphone is working

4. **No AI Response**
   - Check connection status
   - Verify session configuration
   - Check console for errors

### Debug Mode

Console logs enable karein for debugging:

```javascript
// Enable detailed logging
console.log('AIService status:', AIService.getConnectionStatus())
console.log('Event handlers:', AIService.eventHandlers)
```

## Example Components

1. **RealtimeVoiceChat.jsx**: Complete voice chat component
2. **VoiceChatIntegration.jsx**: Integration example with existing components

## Next Steps

1. Test the integration with your existing components
2. Customize the voice and response settings
3. Add audio playback for AI responses
4. Implement conversation history persistence
5. Add visual indicators for recording/processing states

## Support

Agar koi issues aayein to:

1. Check console logs for errors
2. Verify API key validity
3. Test microphone permissions
4. Check network connectivity
5. Review browser compatibility

