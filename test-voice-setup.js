// Test script to verify voice recognition setup
import { ExpoSpeechRecognitionModule } from "expo-speech-recognition"

const testVoiceRecognition = async () => {
  console.log("Testing voice recognition setup...")
  
  try {
    // Check if module is available
    if (!ExpoSpeechRecognitionModule) {
      console.error("❌ ExpoSpeechRecognitionModule is not available")
      return false
    }
    
    console.log("✅ ExpoSpeechRecognitionModule is available")
    
    // Check if requestPermissionsAsync is available
    if (!ExpoSpeechRecognitionModule.requestPermissionsAsync) {
      console.error("❌ requestPermissionsAsync is not available")
      return false
    }
    
    console.log("✅ requestPermissionsAsync is available")
    
    // Test permissions
    const { status } = await ExpoSpeechRecognitionModule.requestPermissionsAsync()
    console.log("📋 Permission status:", status)
    
    if (status !== "granted") {
      console.warn("⚠️ Permissions not granted")
      return false
    }
    
    console.log("✅ Permissions granted")
    
    // Test if start method is available
    if (!ExpoSpeechRecognitionModule.start) {
      console.error("❌ start method is not available")
      return false
    }
    
    console.log("✅ start method is available")
    
    // Test if stop method is available
    if (!ExpoSpeechRecognitionModule.stop) {
      console.error("❌ stop method is not available")
      return false
    }
    
    console.log("✅ stop method is available")
    
    console.log("🎉 Voice recognition setup is working correctly!")
    return true
    
  } catch (error) {
    console.error("❌ Error testing voice recognition:", error)
    return false
  }
}

export default testVoiceRecognition
