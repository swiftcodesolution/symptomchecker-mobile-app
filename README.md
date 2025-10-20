# symptom checker

A React Native mobile application for symptom checking and medical information.

## Voice Recognition Feature

The app now includes voice recognition functionality in the user information collection screen. Here's how it works:

### Features:
- **Voice Input**: Tap the microphone icon to start voice recognition
- **Visual Feedback**: The mic button pulses and changes color when listening
- **Auto-stop**: Voice recognition automatically stops after 10 seconds of inactivity
- **Text Appending**: New voice input is appended to existing text
- **Error Handling**: Graceful error handling with user-friendly alerts

### How to Use:
1. Navigate to the user information collection screen
2. Tap the microphone icon next to the text input field
3. Start speaking when you see the "Listening..." indicator
4. Tap the mic icon again to stop recording
5. Your speech will be converted to text and added to the input field

### Technical Implementation:
- Uses `@react-native-voice/voice` library for speech recognition
- Supports English language (`en-US`)
- Includes proper permission handling for microphone access
- Features animated visual feedback during recording

### Permissions:
- **Android**: `RECORD_AUDIO` permission (already configured)
- **iOS**: `NSMicrophoneUsageDescription` (already configured)

### Dependencies:
- `@react-native-voice/voice`: ^3.2.4 (already installed)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the app:
   ```bash
   npm start
   ```

3. For Android:
   ```bash
   npm run android
   ```

4. For iOS:
   ```bash
   npm run ios
   ```

## Voice Recognition Troubleshooting

If voice recognition is not working:

1. **Check Permissions**: Ensure the app has microphone permissions
2. **Internet Connection**: Voice recognition requires internet connectivity
3. **Device Compatibility**: Ensure your device supports speech recognition
4. **Language Settings**: The app is configured for English (US)

## Development Notes

- Voice recognition is implemented in `app/collect-user-info/index.jsx`
- The feature includes proper cleanup and error handling
- Visual feedback includes pulsing animation and color changes
- Auto-stop functionality prevents excessive battery drain 