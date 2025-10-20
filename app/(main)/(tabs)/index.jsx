// screens/Home.js
"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import PrimaryButton from "../../components/PrimaryButton"
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Vibration,
  Animated,
  Easing,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from "../../theme/ThemeContext"
import Icon from "react-native-vector-icons/Feather"
import { useNavigation, useIsFocused, useFocusEffect } from "@react-navigation/native"
import AnimatedBackground from "../../components/AnimatedBackground"
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition"
import * as Speech from "expo-speech"
import { saveChatToFirebase } from "../../utils/firebaseUtils"
import { getAuth } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { firestore } from "../../config/firebase"
import ChatSummaryModal from "../../components/ChatSummaryModal"
import { AIService } from "../../utils/aiService"
import ConversationService from "../../utils/conversationService"
import { useRouter, useLocalSearchParams } from "expo-router"
import { DISCLAIMER_LINE } from "../../utils/aiService"

const DISCLOSURE_KEY = "symptomCheckerDisclosureAgreed"

const disclosureText = [
  "Before You Begin",
  "The Symptom Checker provides general health insights based on AI and your health inputs. It is not a substitute for medical advice, and it is not a medical device.",
  "For diagnosis or treatment, please consult a licensed medical professional.",
  "By using this tool, you acknowledge and agree to these terms.",
  "Important Information About the Symptom Checker",
  "The Symptom Checker feature in Your Health Companion is designed to provide informational insights only. It uses advanced AI and your personal health data to help you better understand potential causes of your symptoms.",
  "However, it is not a substitute for professional medical advice, diagnosis, or treatment.",
  "This feature is not a medical device and is not intended to make medical decisions on your behalf.",
  "We strongly recommend that you consult with a licensed healthcare provider for any health concerns.",
  "Always seek the guidance of a qualified professional before acting on any information provided here.",
  '"Think of this tool as a helpful companion—not a doctor. It provides evidence-based insights derived from millions of medical data points and may reference your profile and medications when available. It is not a substitute for a doctor’s diagnosis or treatment plan."',
]

// --- Wave visualizer hook ---
const useWave = (active) => {
  const bars = useMemo(
    () => [new Animated.Value(0.3), new Animated.Value(0.3), new Animated.Value(0.3), new Animated.Value(0.3), new Animated.Value(0.3)],
    [],
  )
  const loops = useRef([])

  useEffect(() => {
    const stop = () => {
      loops.current.forEach((l) => l.stop && l.stop())
      loops.current = []
      bars.forEach((v) => v.setValue(0.3))
    }
    const start = () => {
      stop()
      bars.forEach((v, i) => {
        const loop = Animated.loop(
          Animated.sequence([
            Animated.timing(v, { toValue: 1, duration: 300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(v, { toValue: 0.3, duration: 300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          ]),
        )
        setTimeout(() => loop.start(), i * 90)
        loops.current.push(loop)
      })
    }
    if (active) start()
    else stop()
    return () => stop()
  }, [active, bars])

  return bars
}

/** ============ helpers to keep output clean (no code-like wrappers) ============ */
function cleanModelText(s = "") {
  return String(s)
    .replace(/^(```(?:\w+)?)/gim, "")
    .replace(/```$/gim, "")
    .replace(/^\s*const\s+[A-Z0-9_]+\s*=\s*`/gim, "")
    .replace(/`\s*;?\s*$/g, "")
    .trim()
}

// Remove emojis/symbols so TTS doesn't read them
function stripEmojisAndSymbols(s = "") {
  return String(s)
    .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\u24C2|[\uD83C-\uDBFF\uDC00-\uDFFF]|[\u2600-\u26FF])/g, "")
    .replace(/:[a-z_]+:/gi, "") // :smile:
    .replace(/[•▪︎★☆✔︎✅❗❕❓➜➤➔➡️⬅️⬆️⬇️]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()
}

// Helper function to detect dates
function isLikelyDate(text) {
  if (!text) return false;

  // Common date patterns
  const datePatterns = [
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/, // MM/DD/YYYY or DD/MM/YYYY
    /\b\d{4}-\d{1,2}-\d{1,2}\b/,   // YYYY-MM-DD
    /\b\d{1,2}-\d{1,2}-\d{4}\b/,   // MM-DD-YYYY or DD-MM-YYYY
    /\b\d{1,2}\.\d{1,2}\.\d{4}\b/, // MM.DD.YYYY or DD.MM.YYYY
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/i,
  ];

  return datePatterns.some(pattern => pattern.test(text));
}

const Home = () => {
  const { theme } = useTheme()
  const navigation = useNavigation()
  const router = useRouter()
  const params = useLocalSearchParams()
  const isScreenActiveRef = useRef(true)
  const isFocused = useIsFocused()

  // SINGLE-FLIGHT + QUEUE
  const inFlightRef = useRef(null);
  const queueRef = useRef([]);

  const hardStopAll = useCallback(async () => {
    if (retryTimerRef.current) { clearTimeout(retryTimerRef.current); retryTimerRef.current = null }
    if (silenceTimer) { clearTimeout(silenceTimer); setSilenceTimer(null) }
    if (speechDecayTimer.current) { clearTimeout(speechDecayTimer.current); speechDecayTimer.current = null }
    try { Speech.stop() } catch { }
    try { await ExpoSpeechRecognitionModule?.stop?.() } catch { }
    ttsCancelledRef.current = true
    asrStartingRef.current = false
    setIsSpeaking(false)
    setCurrentlySpeakingId(null)
    setIsListening(false)
    setRecognizing(false)
    setSpeechActive(false)
    setVoiceInputText("")
    setRecognizedText("")
    setRobotMode(false)
    setRobotStatus("Tap mic to start")
  }, [])

  useFocusEffect(
    useCallback(() => {
      isScreenActiveRef.current = true
      return () => { isScreenActiveRef.current = false; hardStopAll() }
    }, [hardStopAll])
  )

  useEffect(() => {
    if (!isFocused) { isScreenActiveRef.current = false; hardStopAll() }
    else { isScreenActiveRef.current = true }
  }, [isFocused, hardStopAll])

  const primaryColor = theme?.primary || theme?.accent || "#6B705B"
  const waveColor = primaryColor

  const [showDisclosure, setShowDisclosure] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState("")
  const [voiceInputText, setVoiceInputText] = useState("")
  const [chatStarted, setChatStarted] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [recognizing, setRecognizing] = useState(false)
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const scrollViewRef = useRef(null)
  const [processingEndEvent, setProcessingEndEvent] = useState(false)
  const [chatSessionId, setChatSessionId] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [isViewingHistory, setIsViewingHistory] = useState(false)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [conversationSummary, setConversationSummary] = useState(null)
  const [recommendedArticles, setRecommendedArticles] = useState([])

  const [robotMode, setRobotMode] = useState(false)
  const [speechActive, setSpeechActive] = useState(false)
  const [recognizedText, setRecognizedText] = useState("")
  const speechDecayTimer = useRef(null)
  const [silenceTimer, setSilenceTimer] = useState(null)
  const [isProcessingVoice, setIsProcessingVoice] = useState(false)
  const [robotStatus, setRobotStatus] = useState("Tap mic to start")
  const lastVoiceSentRef = useRef("")
  const [pendingFollowUp, setPendingFollowUp] = useState(false)

  const [patientProfile, setPatientProfile] = useState("")
  const [userFirstName, setUserFirstName] = useState("")
  const [usedNameOnce, setUsedNameOnce] = useState(false) // name only on first AI message in a new chat

  const ttsCancelledRef = useRef(false)
  const asrStartingRef = useRef(false)
  const retryTimerRef = useRef(null)
  const spokenMessageIdsRef = useRef(new Set())

  const waveBars = useWave(speechActive)

  // ---------- Disclosure ----------
  useEffect(() => {
    (async () => {
      try {
        const agreed = await AsyncStorage.getItem(DISCLOSURE_KEY)
        if (!agreed) setShowDisclosure(true)
      } catch { setShowDisclosure(true) }
    })()
  }, [])

  // ---------- Auth + profile ----------
  useEffect(() => {
    const auth = getAuth()
    const user = auth.currentUser
    setCurrentUser(user)
    if (user) setChatSessionId(Date.now().toString())

      ; (async () => {
        try {
          if (!user) return
          const snap = await getDoc(doc(firestore, "users", user.uid))
          const answers = snap.exists() ? (snap.data() || {}).answers || [] : []

          let fullName = "";
          const profileLines = [];

          // 🔥 CRITICAL: Only include NON-DATE information in patient profile
          answers.forEach((item, index) => {
            const a = (item?.summarizedAnswer || item?.answer || "").toString().trim();

            // Skip if it looks like a date (date of birth)
            if (isLikelyDate(a)) {
              console.log("Skipping date of birth:", a);
              return;
            }

            // First answer is usually name - store separately
            if (index === 0 && a) {
              fullName = a;
            } else if (a) {
              // Only add non-date, non-name medical information
              profileLines.push(a);
            }
          });

          // Fallback: Firebase display name
          if (!fullName && user?.displayName) {
            fullName = user.displayName;
          }

          if (fullName) {
            setUserFirstName(fullName.split(" ")[0]);
          }

          // 🔥 Patient profile me sirf medical information, NO dates
          setPatientProfile(profileLines.join("\n"));

          console.log("User Name:", fullName);
          console.log("Patient Profile (medical only):", profileLines);

        } catch (e) {
          console.log("Failed loading patient profile:", e)
        }
      })()

    if (params.session) {
      try {
        const sessionData = JSON.parse(String(params.session))
        if (sessionData.sessionId) setChatSessionId(sessionData.sessionId)
        if (sessionData.messages?.length) {
          const formatted = sessionData.messages
            .map((msg) => ({
              id: msg.id || Date.now() + Math.random(),
              text: msg.message || msg.text,
              isUser: msg.isUser,
              time: formatTimeFromTimestamp(convertFirebaseTimestamp(msg.timestamp)),
              timestamp: convertFirebaseTimestamp(msg.timestamp),
              isFromVoice: msg.isFromVoice || false,
            }))
            .sort((a, b) => a.timestamp - b.timestamp)
          setMessages(formatted)
          setChatStarted(true)
          setIsViewingHistory(true)
          // continuing an existing chat => name was already used
          setUsedNameOnce(true)
        }
      } catch { Alert.alert("Error", "Could not load the conversation") }
    }

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    }
  }, [])

  // ---------- Timestamp helpers ----------
  const convertFirebaseTimestamp = (timestamp) => {
    if (!timestamp) return new Date()
    if (timestamp && typeof timestamp === "object" && "seconds" in timestamp && "nanoseconds" in timestamp)
      return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000)
    if (timestamp && typeof timestamp.toDate === "function") return timestamp.toDate()
    if (typeof timestamp === "string") return new Date(timestamp)
    if (timestamp instanceof Date) return timestamp
    return new Date()
  }
  const formatTimeFromTimestamp = (date) => new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  /** ================= Speech events ================= **/
  useSpeechRecognitionEvent("start", () => {
    setRecognizing(true)
    setIsListening(true)
    setVoiceInputText("")
    Vibration.vibrate(100)
    if (robotMode) setRobotStatus("Listening… (speak now)")
    asrStartingRef.current = false
  })

  useSpeechRecognitionEvent("end", async () => {
    if (processingEndEvent) return
    setProcessingEndEvent(true)
    setRecognizing(false)
    setSpeechActive(false)

    const raw = (voiceInputText || "").trim()
    const canonical = raw.replace(/\s+/g, " ").toLowerCase()
    const sendIfNew = async () => {
      // Don't send if it's too short (accidental blip)
      const wordCount = canonical.split(" ").filter(Boolean).length
      if (wordCount < 3) { // require at least 3 words
        setProcessingEndEvent(false)
        return
      }
      if (canonical && canonical !== lastVoiceSentRef.current) {
        lastVoiceSentRef.current = canonical
        // tiny grace period so the last chunk stabilizes
        await new Promise(r => setTimeout(r, 250))
        await handleSendMessage(raw, true)
      }
    }

    if (robotMode) {
      if (raw) await sendIfNew()
    } else {
      setIsListening(false)
      if (raw) await sendIfNew()
    }

    setTimeout(() => setProcessingEndEvent(false), 200)
  })

  useSpeechRecognitionEvent("result", async (event) => {
    if (event.results && event.results[0]) {
      const newTx = event.results[0]?.transcript || ""
      setVoiceInputText(newTx)
      setRecognizedText(newTx)
      setSpeechActive(Boolean(newTx.trim()))

      if (silenceTimer) clearTimeout(silenceTimer)
      const timer = setTimeout(async () => {
        if (!isProcessingVoice && (robotMode || isListening)) {
          setIsProcessingVoice(true)
          try { await ExpoSpeechRecognitionModule.stop() } finally { setIsProcessingVoice(false) }
        }
      }, 1300) // snappy but still safe
      setSilenceTimer(timer)

      if (speechDecayTimer.current) clearTimeout(speechDecayTimer.current)
      speechDecayTimer.current = setTimeout(() => setSpeechActive(false), 900)
    }
  })

  // useSpeechRecognitionEvent("error", () => {
  //   setIsListening(false)
  //   setRecognizing(false)
  //   setSpeechActive(false)

  //   if (robotMode) {
  //     setRobotStatus("Reconnecting mic…")
  //     if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
  //     retryTimerRef.current = setTimeout(() => { startContinuousListening(true) }, 500)
  //   } else {
  //     setRobotStatus("Tap mic to start")
  //   }
  // })

  useSpeechRecognitionEvent("error", (event) => {
    console.log("Speech recognition error:", event);
    setIsListening(false);
    setRecognizing(false);
    setSpeechActive(false);

    // Only auto-retry if we're still in robot mode AND user hasn't manually exited
    if (robotMode && !ttsCancelledRef.current) {
      setRobotStatus("Reconnecting mic…");
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      retryTimerRef.current = setTimeout(() => {
        if (robotMode && !ttsCancelledRef.current) {
          startContinuousListening(true);
        }
      }, 1000);
    } else {
      setRobotStatus("Tap mic to start");
    }
  });

  // ---------- Voice controls ----------
  const startContinuousListening = async (forceFresh = false) => {
    try {
      if (asrStartingRef.current) return
      asrStartingRef.current = true
      try { if (forceFresh || recognizing || isListening) await ExpoSpeechRecognitionModule?.stop?.() } catch { }

      const { status } = await ExpoSpeechRecognitionModule.requestPermissionsAsync()
      if (status !== "granted") {
        asrStartingRef.current = false
        Alert.alert("Permission required", "Microphone permission is needed for voice mode")
        return
      }

      setSpeechActive(false)
      setRobotStatus("Listening… (speak now)")
      await ExpoSpeechRecognitionModule.start({ lang: "en-US", interimResults: true, continuous: true })
    } catch (e) {
      asrStartingRef.current = false
      setIsListening(false)
      setRecognizing(false)
      if (robotMode) {
        setRobotStatus("Reconnecting mic…")
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
        retryTimerRef.current = setTimeout(() => startContinuousListening(true), 700)
      }
    }
  }

  const stopTTS = useCallback(() => {
    ttsCancelledRef.current = true
    try { Speech.stop() } catch { }
    setIsSpeaking(false)
    setCurrentlySpeakingId(null)
  }, [])

  const stopVoiceRecognition = useCallback(async () => {
    try {
      if (isListening || recognizing) {
        try { await ExpoSpeechRecognitionModule?.stop?.() } catch { }
        setIsListening(false)
        setRecognizing(false)
      }
      setVoiceInputText("")
      setRecognizedText("")
      setSpeechActive(false)
      stopTTS()
      asrStartingRef.current = false
    } catch (error) {
      console.error("Error stopping voice recognition:", error)
    }
  }, [isListening, recognizing, stopTTS])

  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      emergencyVoiceStop();
      isScreenActiveRef.current = false;
    };
  }, [emergencyVoiceStop]);

  useEffect(() => () => { stopVoiceRecognition() }, [stopVoiceRecognition])

  const enterVoiceLoop = async () => {
    setRobotMode(true)
    setRobotStatus("Voice mode on — speak anytime")
    await startContinuousListening(true)
  }

  // const exitVoiceMode = useCallback(async () => {
  //   stopTTS()
  //   try { await ExpoSpeechRecognitionModule?.stop?.() } catch { }
  //   setIsListening(false)
  //   setRecognizing(false)
  //   setVoiceInputText("")
  //   setRecognizedText("")
  //   setSpeechActive(false)
  //   setRobotMode(false)
  //   setRobotStatus("Tap mic to start")
  //   asrStartingRef.current = false
  // }, [stopTTS])

  const exitVoiceMode = useCallback(async () => {
    // Stop all timers first
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      setSilenceTimer(null);
    }
    if (speechDecayTimer.current) {
      clearTimeout(speechDecayTimer.current);
      speechDecayTimer.current = null;
    }

    // Stop speech recognition
    try {
      await ExpoSpeechRecognitionModule?.stop?.();
    } catch (error) {
      console.log("Error stopping speech recognition:", error);
    }

    // Stop TTS
    ttsCancelledRef.current = true;
    try {
      Speech.stop();
    } catch (error) {
      console.log("Error stopping TTS:", error);
    }

    // Reset ALL voice states
    setIsListening(false);
    setRecognizing(false);
    setSpeechActive(false);
    setRobotMode(false);
    setVoiceInputText("");
    setRecognizedText("");
    setRobotStatus("Tap mic to start");
    asrStartingRef.current = false;

    // Clear the speech recognition queue
    lastVoiceSentRef.current = "";
  }, [silenceTimer]); // Add silenceTimer to dependencies

  // const handleVoiceButtonPress = async () => {
  //   if (robotMode) { await exitVoiceMode(); return }
  //   if (isSpeaking) { Alert.alert("Please wait", "AI is currently speaking."); return }
  //   Vibration.vibrate(50)
  //   await enterVoiceLoop()
  //   setInputText("")
  // }

  const handleVoiceButtonPress = async () => {
    if (robotMode) {
      await emergencyVoiceStop(); // Use emergency stop instead
      return;
    }

    if (isSpeaking) {
      Alert.alert("Please wait", "AI is currently speaking.");
      return;
    }

    Vibration.vibrate(50);
    await enterVoiceLoop();
    setInputText("");
  };

  // ---------- Line-by-line TTS ----------
  const speakSegmented = async (text, messageId, { autoRelisten = true } = {}) => {
    // de-dupe: never speak same message twice
    if (spokenMessageIdsRef.current.has(messageId)) return
    spokenMessageIdsRef.current.add(messageId)

    // stop any ongoing TTS first
    try { Speech.stop() } catch { }

    const safeText = stripEmojisAndSymbols(text)
    const segments = String(safeText || "")
      .split(/\n+/)
      .flatMap((line) => line.split(/(?<=[.!?])\s+/))
      .map((s) => s.trim())
      .filter(Boolean)

    let index = 0
    ttsCancelledRef.current = false
    setCurrentlySpeakingId(messageId)
    setIsSpeaking(true)

    const finish = () => {
      setIsSpeaking(false)
      setCurrentlySpeakingId(null)
      // if (robotMode && autoRelisten) startContinuousListening()
      if (robotMode && autoRelisten && !ttsCancelledRef.current) {
        // Small delay before restarting listening
        setTimeout(() => {
          if (robotMode && !ttsCancelledRef.current) {
            startContinuousListening(true);
          }
        }, 500);
      }
    }

    const speakNext = () => {
      if (ttsCancelledRef.current) return finish()
      if (index >= segments.length) return finish()
      const phrase = segments[index++]
      Speech.speak(phrase, {
        language: "en",
        rate: 0.93,
        pitch: 1.0,
        onDone: () => { if (ttsCancelledRef.current) return finish(); speakNext() },
        onStopped: () => finish(),
        onError: () => finish(),
      })
    }
    speakNext()
  }

  const emergencyVoiceStop = useCallback(async () => {
    console.log("EMERGENCY VOICE STOP");

    // Stop all timers
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      setSilenceTimer(null);
    }
    if (speechDecayTimer.current) {
      clearTimeout(speechDecayTimer.current);
      speechDecayTimer.current = null;
    }

    // Stop speech recognition
    try {
      await ExpoSpeechRecognitionModule?.stop?.();
    } catch (error) {
      console.log("Force stopping speech recognition:", error);
    }

    // Stop TTS
    ttsCancelledRef.current = true;
    try {
      Speech.stop();
    } catch (error) {
      console.log("Force stopping TTS:", error);
    }

    // Reset all states
    setIsListening(false);
    setRecognizing(false);
    setSpeechActive(false);
    setRobotMode(false);
    setVoiceInputText("");
    setRecognizedText("");
    setRobotStatus("Tap mic to start");
    asrStartingRef.current = false;
    lastVoiceSentRef.current = "";
  }, [silenceTimer]);

  // ---------- Send message (single-flight + queue) ----------
  // const handleSendMessage = async (text = inputText, isFromVoice = false) => {
  //   const messageText = isFromVoice ? (voiceInputText || text) : text
  //   if (!messageText.trim()) return

  //   // De-dupe same text back-to-back
  //   const last = messages[messages.length - 1]
  //   if (last?.isUser && last?.text === messageText) return

  //   const shouldUseName = Boolean((userFirstName || "").trim() && !usedNameOnce)

  //   // 🔥 CRITICAL FIX: AI ko name handle karne do, hum interfere NA karein
  //   const maybeWithNameOnce = (t) => {
  //     // Hum kuch bhi name add nahi karenge - AI khud handle karega
  //     return t;
  //   }

  //   const run = async () => {
  //     if (!chatStarted) setChatStarted(true)

  //     const userMessage = {
  //       id: Date.now(),
  //       text: messageText,
  //       isUser: true,
  //       time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  //       isFromVoice: isFromVoice,
  //       timestamp: new Date(),
  //     }
  //     setMessages((prev) => [...prev, userMessage])
  //     setInputText("")
  //     setVoiceInputText("")
  //     setRecognizedText("")
  //     setIsLoading(true)

  //     // Fire-and-forget save
  //     if (currentUser && chatSessionId) {
  //       saveChatToFirebase({
  //         sessionId: chatSessionId,
  //         message: userMessage.text,
  //         isUser: true,
  //         timestamp: userMessage.timestamp,
  //         isFromVoice: isFromVoice,
  //       }).catch(() => { })
  //     }

  //     try {
  //       // ---- Context building ----
  //       const symptoms = AIService.extractSymptoms(messageText)
  //       let medicationContext = ""
  //       if (symptoms.length > 0) {
  //         try {
  //           const relevantMeds = await AIService.getRelevantMedications(symptoms)
  //           if (relevantMeds.length > 0) {
  //             medicationContext = relevantMeds
  //               .map((med) => `${med.name} (${med.dosage}) - ${med.frequency}${med.notes ? ` - Notes: ${med.notes}` : ""}`)
  //               .join("\n")
  //           }
  //         } catch { }
  //       }

  //       // ---- Decide route ----
  //       let askFollowUpFirst = false
  //       if (!pendingFollowUp) {
  //         try {
  //           askFollowUpFirst = await AIService.shouldSkipMainResponse(messageText, messages.slice(-6), userFirstName)
  //         } catch { askFollowUpFirst = false }
  //       }

  //       if (askFollowUpFirst && !pendingFollowUp) {
  //         // === FOLLOW-UP ONLY (NO advice) ===
  //         const followUp = await AIService.generateFollowUpQuestion(
  //           messageText, messages.slice(-6), medicationContext, patientProfile, userFirstName
  //         )
  //         const baseText = followUp || "When did this start, and how severe is it?"
  //         const chatText = maybeWithNameOnce(baseText)

  //         const aiFollow = {
  //           id: Date.now() + 1,
  //           text: chatText,
  //           isUser: false,
  //           time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  //           timestamp: new Date(),
  //         }
  //         setMessages((prev) => [...prev, aiFollow])
  //         setPendingFollowUp(true)

  //         // flip ONLY if name was actually used
  //         if (shouldUseName) setUsedNameOnce(true)

  //         if (currentUser && chatSessionId) {
  //           saveChatToFirebase({
  //             sessionId: chatSessionId,
  //             message: aiFollow.text,
  //             isUser: false,
  //             timestamp: aiFollow.timestamp,
  //             isFromVoice: isFromVoice,
  //           }).catch(() => { })
  //         }

  //         if (isFromVoice || robotMode) speakSegmented(aiFollow.text, aiFollow.id)
  //       } else {
  //         // === MAIN RESPONSE (ALWAYS with DYNAMIC advice) ===
  //         const suppressFollowUps =
  //           pendingFollowUp === true ||
  //           /since|began|started|yesterday|last night|this morning|for \d+\s*(hours?|days?)|subah se|raat se|kal se|aaj subah se/i.test(messageText)

  //         const aiRaw = await AIService.getAIResponse(
  //           messageText,
  //           messages.slice(-6),
  //           medicationContext,
  //           patientProfile,
  //           userFirstName,
  //           { suppressFollowUps }
  //         )

  //         const mainText = cleanModelText(maybeWithNameOnce(aiRaw))

  //         // Tailored advice for THIS topic (no static strings)
  //         const advice = await AIService.generateAdviceSection(
  //           messageText, // topic hint
  //           messages.slice(-6),
  //           medicationContext,
  //           patientProfile,
  //           userFirstName
  //         )

  //         const finalText = advice ? `${mainText}\n\n${cleanModelText(advice)}` : mainText

  //         const aiResponse = {
  //           id: Date.now() + 1,
  //           text: finalText,
  //           isUser: false,
  //           time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  //           timestamp: new Date(),
  //         }
  //         setMessages((prev) => [...prev, aiResponse])
  //         setPendingFollowUp(false)

  //         // flip ONLY if name was actually used
  //         if (shouldUseName) setUsedNameOnce(true)

  //         if (currentUser && chatSessionId) {
  //           saveChatToFirebase({
  //             sessionId: chatSessionId,
  //             message: aiResponse.text,
  //             isUser: false,
  //             timestamp: aiResponse.timestamp,
  //             isFromVoice: isFromVoice,
  //           }).catch(() => { })
  //         }

  //         if (isFromVoice || robotMode) speakSegmented(aiResponse.text, aiResponse.id)
  //       }
  //     } catch (error) {
  //       const errorMessage = {
  //         id: Date.now() + 1,
  //         text: "I'm having trouble processing that right now. Please try again.",
  //         isUser: false,
  //         time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  //         timestamp: new Date(),
  //       }
  //       setMessages((prev) => [...prev, errorMessage])
  //     } finally {
  //       setIsLoading(false)
  //     }
  //   };

  //   // Queue if another request is running
  //   if (inFlightRef.current) {
  //     queueRef.current.push(() => run().finally(() => {
  //       const next = queueRef.current.shift();
  //       if (next) next();
  //       else inFlightRef.current = null;
  //     }));
  //     return;
  //   }

  //   // Start immediately and mark in-flight
  //   inFlightRef.current = Promise.resolve()
  //     .then(run)
  //     .finally(() => {
  //       const next = queueRef.current.shift();
  //       if (next) next();
  //       else inFlightRef.current = null;
  //     });
  // }

  

  // ---------- Send message (single-flight + queue) ----------
  const handleSendMessage = async (text = inputText, isFromVoice = false) => {
    const messageText = isFromVoice ? (voiceInputText || text) : text
    if (!messageText.trim()) return

    // De-dupe same text back-to-back
    const last = messages[messages.length - 1]
    if (last?.isUser && last?.text === messageText) return

    const shouldUseName = Boolean((userFirstName || "").trim() && !usedNameOnce)

    const maybeWithNameOnce = (t) => {
      return t;
    }

    const run = async () => {
      if (!chatStarted) setChatStarted(true)

      const userMessage = {
        id: Date.now(),
        text: messageText,
        isUser: true,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isFromVoice: isFromVoice,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMessage])
      setInputText("")
      setVoiceInputText("")
      setRecognizedText("")
      setIsLoading(true)

      // Fire-and-forget save
      if (currentUser && chatSessionId) {
        saveChatToFirebase({
          sessionId: chatSessionId,
          message: userMessage.text,
          isUser: true,
          timestamp: userMessage.timestamp,
          isFromVoice: isFromVoice,
        }).catch(() => { })
      }

      try {
        // ---- Context building ----
        const symptoms = AIService.extractSymptoms(messageText)
        let medicationContext = ""
        if (symptoms.length > 0) {
          try {
            const relevantMeds = await AIService.getRelevantMedications(symptoms)
            if (relevantMeds.length > 0) {
              medicationContext = relevantMeds
                .map((med) => `${med.name} (${med.dosage}) - ${med.frequency}${med.notes ? ` - Notes: ${med.notes}` : ""}`)
                .join("\n")
            }
          } catch { }
        }

        // ---- Decide route ----
        let askFollowUpFirst = false
        if (!pendingFollowUp) {
          try {
            askFollowUpFirst = await AIService.shouldSkipMainResponse(messageText, messages.slice(-6), userFirstName)
          } catch { askFollowUpFirst = false }
        }

        if (askFollowUpFirst && !pendingFollowUp) {
          // === FOLLOW-UP ONLY (NO advice) ===
          const followUp = await AIService.generateFollowUpQuestion(
          messageText, messages.slice(-6), medicationContext, patientProfile, userFirstName
          )
          const baseText = followUp || "When did this start, and how severe is it?"
          const chatText = maybeWithNameOnce(baseText)

          const aiFollow = {
            id: Date.now() + 1,
            text: chatText,
            isUser: false,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, aiFollow])
          setPendingFollowUp(true)

          // flip ONLY if name was actually used
          if (shouldUseName) setUsedNameOnce(true)

          if (currentUser && chatSessionId) {
            saveChatToFirebase({
              sessionId: chatSessionId,
              message: aiFollow.text,
              isUser: false,
              timestamp: aiFollow.timestamp,
              isFromVoice: isFromVoice,
            }).catch(() => { })
          }

          // 🔥 FIX: Speak in BOTH voice mode AND text mode
          if (isFromVoice || robotMode) {
            speakSegmented(aiFollow.text, aiFollow.id)
          } else {
            // Text mode - also speak the response
            speakSegmented(aiFollow.text, aiFollow.id, { autoRelisten: false })
          }

        } else {
          // === MAIN RESPONSE (ALWAYS with DYNAMIC advice) ===
          const suppressFollowUps =
            pendingFollowUp === true ||
            /since|began|started|yesterday|last night|this morning|for \d+\s*(hours?|days?)|subah se|raat se|kal se|aaj subah se/i.test(messageText)

          const aiRaw = await AIService.getAIResponse(
            messageText,
            messages.slice(-6),
            medicationContext,
            patientProfile,
            userFirstName,
            { suppressFollowUps }
          )

          const mainText = cleanModelText(maybeWithNameOnce(aiRaw))

          // Tailored advice for THIS topic (no static strings)
          const advice = await AIService.generateAdviceSection(
            messageText, // topic hint
            messages.slice(-6),
            medicationContext,
            patientProfile,
            userFirstName
          )

          const finalText = advice ? `${mainText}\n\n${cleanModelText(advice)}` : mainText

          const aiResponse = {
            id: Date.now() + 1,
            text: finalText,
            isUser: false,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, aiResponse])
          setPendingFollowUp(false)

          // flip ONLY if name was actually used
          if (shouldUseName) setUsedNameOnce(true)

          if (currentUser && chatSessionId) {
            saveChatToFirebase({
              sessionId: chatSessionId,
              message: aiResponse.text,
              isUser: false,
              timestamp: aiResponse.timestamp,
              isFromVoice: isFromVoice,
            }).catch(() => { })
          }

          // 🔥 FIX: Speak in BOTH voice mode AND text mode
          if (isFromVoice || robotMode) {
            speakSegmented(aiResponse.text, aiResponse.id)
          } else {
            // Text mode - also speak the response
            speakSegmented(aiResponse.text, aiResponse.id, { autoRelisten: false })
          }
        }
      } catch (error) {
        const errorMessage = {
          id: Date.now() + 1,
          text: "I'm having trouble processing that right now. Please try again.",
          isUser: false,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
        
        // 🔥 FIX: Speak error message in both modes
        if (isFromVoice || robotMode) {
          speakSegmented(errorMessage.text, errorMessage.id)
        } else {
          speakSegmented(errorMessage.text, errorMessage.id, { autoRelisten: false })
        }
      } finally {
        setIsLoading(false)
      }
    };

    // Queue if another request is running
    if (inFlightRef.current) {
      queueRef.current.push(() => run().finally(() => {
        const next = queueRef.current.shift();
        if (next) next();
        else inFlightRef.current = null;
      }));
      return;
    }

    // Start immediately and mark in-flight
    inFlightRef.current = Promise.resolve()
      .then(run)
      .finally(() => {
        const next = queueRef.current.shift();
        if (next) next();
        else inFlightRef.current = null;
      });
  }

  // ---------- Double-tap AI bubble to stop TTS ----------
  const lastTapTimeRef = useRef(0)
  const handleBubblePress = async (isUser) => {
    if (isUser) return
    const now = Date.now()
    if (now - lastTapTimeRef.current < 300) {
      stopTTS()
      if (robotMode) {
        // small delay so TTS fully releases audio focus
        setTimeout(() => startContinuousListening(true), 200)
      }
    }
    lastTapTimeRef.current = now
  }

  const handleAgree = async () => {
    try {
      await AsyncStorage.setItem(DISCLOSURE_KEY, "true")
      setShowDisclosure(false)
    } catch {
      Alert.alert("Error", "Could not save your agreement. Please try again.")
    }
  }

  return (
    <>
      <Modal visible={showDisclosure} transparent animationType="slide" onRequestClose={() => { }}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.modalBackground || "#fff" }]}>
            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary || "#222" }]}>{disclosureText[0]}</Text>
              {disclosureText.slice(1, 4).map((line, idx) => (
                <Text key={idx} style={[styles.modalText, { color: theme.textPrimary || "#222" }]}>{line}</Text>
              ))}
              <Text style={[styles.modalSubtitle, { color: theme.textPrimary || "#222" }]}>{disclosureText[4]}</Text>
              {disclosureText.slice(5).map((line, idx) => (
                <Text key={idx + 5} style={[styles.modalText, { color: theme.textPrimary || "#222" }]}>{line}</Text>
              ))}
              <PrimaryButton
                title="Agree & Continue"
                pressFunction={handleAgree}
                style={[styles.agreeButton, { backgroundColor: theme?.primary || "#6B705B" }]}
                textColor="#fff"
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <AnimatedBackground>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : -10}
        >
          <SafeAreaView style={styles.container}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              ref={scrollViewRef}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {isViewingHistory && (
                <TouchableOpacity
                  style={[styles.clearHistoryBtn, { backgroundColor: "#FF6B6B" }]}
                  onPress={() => {
                    setMessages([])
                    setChatStarted(false)
                    setIsViewingHistory(false)
                    setChatSessionId(Date.now().toString())
                    lastVoiceSentRef.current = ""
                    setPendingFollowUp(false)
                    setUsedNameOnce(false) // reset for the next brand-new chat
                  }}
                >
                  <Text style={styles.clearHistoryText}>Start New Conversation</Text>
                </TouchableOpacity>
              )}

              <View style={styles.chatContainer}>
                {messages.map((message) => (
                  <TouchableOpacity
                    key={message.id}
                    activeOpacity={0.8}
                    onPress={() => handleBubblePress(message.isUser)}
                    style={[
                      styles.messageBubble,
                      message.isUser ? styles.userBubble : styles.aiBubble,
                      currentlySpeakingId === message.id && { borderWidth: 2, borderColor: theme?.primary || "#6B705B" },
                      message.isFromVoice && styles.voiceMessageIndicator,
                    ]}
                  >
                    <Text style={message.isUser ? styles.userText : styles.aiText}>{message.text}</Text>
                    <Text style={message.isUser ? styles.userTime : styles.aiTime}>{message.time}</Text>
                  </TouchableOpacity>
                ))}

                {isLoading && (
                  <View style={[styles.messageBubble, styles.aiBubble]}>
                    <Text style={styles.aiText}>Thinking...</Text>
                  </View>
                )}
              </View>

              {/* <View style={styles.centerCheckWrapper}>
                {robotMode ? (
                  // <View style={styles.robotModeContainer}>
                  //   <View style={[styles.voiceControlBtn, styles.waveContainer]}>
                  //     <View style={styles.waveRow}>
                  //       {waveBars.map((v, i) => (
                  //         <Animated.View
                  //           key={i}
                  //           style={[
                  //             styles.waveBar,
                  //             { backgroundColor: waveColor, transform: [{ scaleY: v }], opacity: speechActive ? 1 : 0.35 },
                  //           ]}
                  //         />
                  //       ))}
                  //     </View>
                  //     <Text style={styles.listeningText}>{speechActive ? "Listening..." : "Say something"}</Text>
                  //   </View>

                  //   <TouchableOpacity style={[styles.exitVoiceModeBtn, { borderColor: theme?.primary || "#6B705B" }]} onPress={async () => { await exitVoiceMode() }}>
                  //     <Icon name="x-circle" size={18} color={theme?.primary || "#6B705B"} />
                  //     <Text style={[styles.exitVoiceModeText, { color: theme?.primary || "#6B705B" }]}>Exit Voice Mode</Text>
                  //   </TouchableOpacity>
                  // </View>

                  // In your robot mode UI section:
                  <View style={styles.robotModeContainer}>
                    <View style={[styles.voiceControlBtn, styles.waveContainer]}>
                      <View style={styles.waveRow}>
                        {waveBars.map((v, i) => (
                          <Animated.View
                            key={i}
                            style={[
                              styles.waveBar,
                              {
                                backgroundColor: waveColor,
                                transform: [{ scaleY: v }],
                                opacity: speechActive ? 1 : (isListening ? 0.6 : 0.3)
                              },
                            ]}
                          />
                        ))}
                      </View>
                      <Text style={styles.listeningText}>
                        {speechActive ? "Listening..." :
                          isListening ? "Ready..." :
                            "Processing..."}
                      </Text>
                      {isProcessingVoice && (
                        <Text style={styles.processingText}>Processing voice...</Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[styles.exitVoiceModeBtn, { borderColor: theme?.primary || "#6B705B" }]}
                      onPress={emergencyVoiceStop} // Use emergency stop
                    >
                      <Icon name="x-circle" size={18} color={theme?.primary || "#6B705B"} />
                      <Text style={[styles.exitVoiceModeText, { color: theme?.primary || "#6B705B" }]}>
                        Exit Voice Mode
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.voiceOptionsContainer}>
                    <TouchableOpacity style={[styles.checkBtn]} onPress={handleVoiceButtonPress}>
                      <Icon name="mic" size={30} color={theme?.primary || "#6B705B"} />
                      <Text style={styles.startListeningText}>Tap to Speak</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View> */}
            </ScrollView>

            {!robotMode && (
              <View style={styles.inputBoxWrapper}>
                <View style={[styles.inputBox, { backgroundColor: theme.onboardingCardBg || "#E9E71" }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Type here if you prefer typing…"
                    placeholderTextColor="#465D69"
                    value={inputText}
                    onChangeText={setInputText}
                    editable={!isSpeaking && !isLoading}
                  />
                  <TouchableOpacity
                    style={[styles.sendBtn, { backgroundColor: !isSpeaking && !isLoading ? (theme?.primary || "#6B705B") : "#D3D3D3" }]}
                    onPress={() => {
                      if (inputText.trim() && !isSpeaking && !isLoading) {
                        handleSendMessage(inputText, false)
                      }
                    }}
                    disabled={isSpeaking || isLoading}
                  >
                    <Icon name="send" size={24} color={!isSpeaking && !isLoading ? "#fff" : "#999"} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </SafeAreaView>
        </KeyboardAvoidingView>
      </AnimatedBackground>

      <ChatSummaryModal
        visible={showSummaryModal}
        conversation={{ messages }}
        articles={recommendedArticles}
        onClose={() => setShowSummaryModal(false)}
        onViewLibrary={(article = null) => {
          setShowSummaryModal(false)
          router.push({
            pathname: "/(main)/medical-library",
            params: {
              focusedArticle: article ? article.title : null,
              searchQuery: article ? article.category : "",
            },
          })
        }}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 0, justifyContent: "flex-start" },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },

  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end", alignItems: "center" },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, width: "100%", maxWidth: 500, minHeight: 420, elevation: 8, maxHeight: "80%" },
  modalScroll: { paddingBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 10, textAlign: "left" },
  modalSubtitle: { fontSize: 18, fontWeight: "bold", marginTop: 15, marginBottom: 10, textAlign: "left" },
  modalText: { fontSize: 16, marginBottom: 10, textAlign: "left", lineHeight: 22 },
  agreeButton: { marginTop: 18 },

  centerCheckWrapper: { flex: 1, justifyContent: "center", alignItems: "center", marginBottom: 20 },

  checkBtn: {
    backgroundColor: "#E9E7E1",
    borderRadius: 100,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 140,
  },

  voiceOptionsContainer: { alignItems: "center", gap: 20 },

  voiceControlBtn: {
    backgroundColor: "#E9E7E1",
    borderRadius: 100,
    paddingVertical: 22,
    paddingHorizontal: 26,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 160,
  },
  waveContainer: { width: 200 },

  startListeningText: { color: "#000000", fontSize: 14, marginTop: 8, fontWeight: "bold" },
  listeningText: { color: "#000000", fontSize: 14, textAlign: "center", fontWeight: "bold", marginTop: 8 },

  chatContainer: { paddingHorizontal: 16, paddingTop: 16, flex: 1 },
  messageBubble: { maxWidth: "80%", padding: 12, borderRadius: 12, marginBottom: 8, position: "relative" },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#6B705B", borderBottomRightRadius: 0 },
  aiBubble: { alignSelf: "flex-start", backgroundColor: "#E9E7E1", borderBottomLeftRadius: 0 },
  voiceMessageIndicator: { borderLeftWidth: 3, borderLeftColor: "#6B705B", paddingLeft: 12 },

  userText: { color: "#fff", fontSize: 16 },
  aiText: { color: "#465D69", fontSize: 16 },
  userTime: { color: "#E9E71", fontSize: 12, textAlign: "right", marginTop: 4 },
  aiTime: { color: "#888", fontSize: 12, textAlign: "left", marginTop: 4 },

  inputBoxWrapper: { paddingHorizontal: 20, paddingBottom: 30 },
  inputBox: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderRadius: 32, marginTop: 10 },
  input: { fontSize: 18, flex: 1, color: "#465D69" },
  sendBtn: { padding: 12, borderRadius: 100, marginLeft: 10 },

  clearHistoryBtn: { padding: 12, borderRadius: 20, alignSelf: "center", margin: 10 },
  clearHistoryText: { color: "#fff", fontWeight: "600" },

  robotModeContainer: { alignItems: "center", justifyContent: "center", padding: 20, borderRadius: 100 },

  endConversationButton: { backgroundColor: "#6B705B", padding: 15, borderRadius: 12, alignItems: "center", margin: 20, marginTop: 10 },
  endConversationText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  waveRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 6, marginTop: 2, height: 28 },
  waveBar: { width: 6, height: 24, borderRadius: 3, opacity: 0.9 },

  processingText: {
    color: "#465D69",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    fontStyle: "italic"
  },

  exitVoiceModeBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  exitVoiceModeText: { fontWeight: "700" },
})

export default Home