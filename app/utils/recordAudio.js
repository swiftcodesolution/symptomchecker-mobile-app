// app/utils/recordAudio.js
import { Audio } from "expo-av"
import { Platform, PermissionsAndroid } from "react-native"

let recording = null
let meteringTimer = null

async function ensurePermissions() {
  // iOS
  const ios = await Audio.requestPermissionsAsync()
  const iosOk = ios?.status === "granted"

  // Android (extra safety)
  let androidOk = true
  if (Platform.OS === "android") {
    const res = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: "Microphone Permission",
        message: "We need access to your microphone for voice input.",
        buttonPositive: "OK",
      }
    )
    androidOk = res === PermissionsAndroid.RESULTS.GRANTED
  }

  return iosOk && androidOk
}

export async function startRecording({ onMeter = null, metering = true } = {}) {
  // guard: avoid double create
  if (recording) {
    try {
      await recording.stopAndUnloadAsync()
    } catch {}
    recording = null
  }

  const ok = await ensurePermissions()
  if (!ok) throw new Error("MIC_PERMISSION_DENIED")

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
    shouldDuckAndroid: true,
    staysActiveInBackground: false,
  })

  const options = {
    ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
    android: {
      extension: ".m4a",
      outputFormat: Audio.AndroidOutputFormat.MPEG_4,
      audioEncoder: Audio.AndroidAudioEncoder.AAC,
      sampleRate: 44100,
      numberOfChannels: 1,
      bitRate: 128000,
    },
    ios: {
      extension: ".m4a",
      audioQuality: Audio.IOSAudioQuality.HIGH,
      sampleRate: 44100,
      numberOfChannels: 1,
      bitRate: 128000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
      meteringEnabled: !!metering, // iOS only
    },
    web: {},
  }

  const { recording: rec } = await Audio.Recording.createAsync(options)
  recording = rec

  if (metering && onMeter) {
    meteringTimer = setInterval(async () => {
      try {
        if (!recording) return
        const status = await recording.getStatusAsync()
        if (typeof status.metering === "number") onMeter(status.metering)
        else onMeter(null) // android: no metering
      } catch {}
    }, 120)
  }

  return recording
}

export async function stopRecording() {
  if (!recording) return null
  try {
    await recording.stopAndUnloadAsync()
  } catch {}
  const uri = recording.getURI()
  recording = null
  if (meteringTimer) {
    clearInterval(meteringTimer)
    meteringTimer = null
  }
  return uri
}

export function isRecordingActive() {
  return !!recording
}
