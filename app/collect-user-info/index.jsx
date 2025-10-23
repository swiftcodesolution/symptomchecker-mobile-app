"use client"

import {
  StyleSheet,
  Text,
  View,
  Alert,
  Animated,
  Platform,
  BackHandler,
} from "react-native"
import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter, useLocalSearchParams } from "expo-router"
import { useTheme } from "../theme/ThemeContext"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useVoiceRecognition } from "../hooks/useVoiceRecognition"
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition"
import { useSelector, useDispatch } from "react-redux"
import {
  setAnswer,
  setCurrentIndex,
  setIsListening,
  setTranscript,
  selectAnswers,
  selectCurrentIndex,
  selectIsListening,
  selectTranscript,
  resetUserInfo,
} from "../redux/slices/userInfoSlice"
import { firebaseAuth, firestore } from "../config/firebase"
import { doc, getDoc } from "firebase/firestore"
import PersonalInfoForm, { personalQuestionsData } from "./PersonalInfoForm"
import YesNoQuestionsForm, { yesNoQuestionsData } from "./YesNoQuestionsForm"
import { SafeAreaView } from "react-native-safe-area-context"
import { TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"

// ---------- QUESTIONS ----------
export const questionsData = [
  // { question: "What is your Full Name?", summarizedAnswer: "" },
  { question: "What is your Date of Birth (MM/DD/YYYY)?", summarizedAnswer: "" },
  // { question: "What is your Age?", summarizedAnswer: "" },
  { question: "What is your Gender (Male/Female/Other)?", summarizedAnswer: "" },
  { question: "What is your Ethnicity?", summarizedAnswer: "" },
  { question: "What is your Home Address?", summarizedAnswer: "" },
  { question: "What is your City?", summarizedAnswer: "" },
  { question: "What is your State?", summarizedAnswer: "" },
  { question: "What is your Zip Code?", summarizedAnswer: "" },
  { question: "What is your Phone Number?", summarizedAnswer: "" },
  // { question: "What is your Email Address?", summarizedAnswer: "" },
  { question: "What is your Height (ft/in)?", summarizedAnswer: "" },
  { question: "What is your Weight (lbs)?", summarizedAnswer: "" },
  { question: "Have you had any surgeries in the past?", summarizedAnswer: "" },
  { question: "If yes, please explain your past surgeries:", summarizedAnswer: "" },
  { question: "Have you ever been hospitalized?", summarizedAnswer: "" },
  { question: "If yes, please explain your hospitalizations:", summarizedAnswer: "" },
  { question: "Do you have high blood pressure?", summarizedAnswer: "" },
  { question: "If yes, please explain your high blood pressure:", summarizedAnswer: "" },
  { question: "Do you have diabetes?", summarizedAnswer: "" },
  { question: "If yes, please explain your diabetes:", summarizedAnswer: "" },
  { question: "Do you have heart disease?", summarizedAnswer: "" },
  { question: "If yes, please explain your heart disease:", summarizedAnswer: "" },
  { question: "Do you have any known allergies?", summarizedAnswer: "" },
  { question: "If yes, please explain your allergies:", summarizedAnswer: "" },
  { question: "Do you currently smoke tobacco?", summarizedAnswer: "" },
  { question: "If yes, please explain your smoking habits:", summarizedAnswer: "" },
  { question: "Do you consume alcohol?", summarizedAnswer: "" },
  { question: "If yes, please explain your alcohol consumption:", summarizedAnswer: "" },
  { question: "Do you use recreational drugs?", summarizedAnswer: "" },
  { question: "If yes, please explain your recreational drug use:", summarizedAnswer: "" },
  { question: "Have you experienced any recent weight changes?", summarizedAnswer: "" },
  { question: "If yes, please explain your weight changes:", summarizedAnswer: "" },
  { question: "Have you had a fever in the past month?", summarizedAnswer: "" },
  { question: "If yes, please explain your fever:", summarizedAnswer: "" },
  { question: "Do you have a history of cancer?", summarizedAnswer: "" },
  { question: "If yes, please explain your cancer history:", summarizedAnswer: "" },
  { question: "Is there any family history of serious illness (e.g., cancer, heart disease)?", summarizedAnswer: "" },
  { question: "If yes, please explain your family history:", summarizedAnswer: "" },
  { question: "Please list all current medications you are taking, including dosage and frequency:", summarizedAnswer: "" },
  { question: "Please list all past surgeries, including the date and reason for each:", summarizedAnswer: "" },
  { question: "Please provide any additional health information or concerns:", summarizedAnswer: "" },
  { question: "What is your Primary Insurance Provider?", summarizedAnswer: "" },
  { question: "What is your Policy Number?", summarizedAnswer: "" },
  { question: "What is your Blood Group Number?", summarizedAnswer: "" },
  { question: "What is the Subscriber Name?", summarizedAnswer: "" },
  { question: "What is the Relationship to Patient?", summarizedAnswer: "" },
  { question: "What is your Secondary Insurance Provider (if any)?", summarizedAnswer: "" },
  { question: "What is your Secondary Policy Number?", summarizedAnswer: "" },
  { question: "What is your Secondary Group Number?", summarizedAnswer: "" },
  { question: "What is your Emergency Contact's Full Name?", summarizedAnswer: "" },
  { question: "What is their Relationship to Patient?", summarizedAnswer: "" },
  { question: "What is their Phone Number?", summarizedAnswer: "" },
  { question: "What is their Alternate Phone Number?", summarizedAnswer: "" },
  { question: "What is their Address?", summarizedAnswer: "" },
  { question: "Have you had a Tetanus (Td or Tdap) vaccine in the last 10 years?", summarizedAnswer: "" },
  { question: "If yes, please provide date(s) for Tetanus vaccine:", summarizedAnswer: "" },
  { question: "Have you had an Influenza (Flu) vaccine within the past year?", summarizedAnswer: "" },
  { question: "If yes, please provide date(s) for Flu vaccine:", summarizedAnswer: "" },
  { question: "Have you had a COVID-19 vaccination?", summarizedAnswer: "" },
  { question: "If yes, please provide date(s) for COVID-19 vaccine:", summarizedAnswer: "" },
  { question: "Have you had a Hepatitis B vaccine?", summarizedAnswer: "" },
  { question: "If yes, please provide date(s) for Hepatitis B vaccine:", summarizedAnswer: "" },
  { question: "Have you had an MMR (Measles, Mumps, Rubella) vaccine?", summarizedAnswer: "" },
  { question: "If yes, please provide date(s) for MMR vaccine:", summarizedAnswer: "" },
  { question: "Have you had a Chickenpox (Varicella) vaccine?", summarizedAnswer: "" },
  { question: "If yes, please provide date(s) for Chickenpox vaccine:", summarizedAnswer: "" },
  { question: "Have you had a Pneumonia vaccine?", summarizedAnswer: "" },
  { question: "If yes, please provide date(s) for Pneumonia vaccine:", summarizedAnswer: "" },
  { question: "Have you had a Shingles vaccine?", summarizedAnswer: "" },
  { question: "If yes, please provide date(s) for Shingles vaccine:", summarizedAnswer: "" },
]

// ---------- SUMMARIZER ----------
const generateSummarizedAnswer = (question, answer) => {
  const a = String(answer ?? "").trim()
  if (!a) return ""
  const yes = /^(yes|yeah|yep|y)$/i.test(a)
  const no = /^(no|nope|never|n)$/i.test(a)
  const clip = (t) => (t.length > 100 ? `${t.slice(0, 100)}...` : t)
  const yn = (_q, yesLine, noLine, neutral) => (yes ? yesLine : no ? noLine : neutral)

  if (question.includes("Full Name")) return `Patient's name is ${a}.`
  if (question.includes("Date of Birth")) return `Patient's date of birth is ${a}.`
  if (question.includes("Age")) return `Patient is ${a} years old.`
  if (question.includes("Gender")) return `Patient identifies as ${a}.`
  if (question.includes("Ethnicity")) return `Patient's ethnicity is ${a}.`
  if (question.includes("Address") && !question.includes("Emergency")) return `Patient's address is ${a}.`
  if (question.includes("City")) return `Patient resides in ${a}.`
  if (question.includes("State")) return `Patient resides in ${a}.`
  if (question.includes("Zip Code")) return `Patient's zip code is ${a}.`
  if (question.includes("Phone Number") && !question.includes("Emergency")) return `Patient's phone number is ${a}.`
  if (question.includes("Email Address")) return `Patient's email is ${a}.`
  if (question.includes("Height")) return `Patient's height is ${a}.`
  if (question.includes("Weight")) return `Patient's weight is ${a} lbs.`

  if (question.includes("surgeries in the past")) return yn(question, "Patient has had surgeries in the past.", "Patient has not had any surgeries.", "Patient provided surgery details.")
  if (question.includes("explain your past surgeries")) return `Past surgeries: ${clip(a)}`
  if (question.includes("hospitalized")) return yn(question, "Patient has been hospitalized in the past.", "Patient has never been hospitalized.", "Patient provided hospitalization details.")
  if (question.includes("explain your hospitalizations")) return `Hospitalizations: ${clip(a)}`
  if (question.includes("high blood pressure")) return yn(question, "Patient has high blood pressure.", "Patient does not have high blood pressure.", "Patient provided blood pressure details.")
  if (question.includes("explain your high blood pressure")) return `Blood pressure details: ${clip(a)}`
  if (question.includes("diabetes")) return yn(question, "Patient has diabetes.", "Patient does not have diabetes.", "Patient provided diabetes details.")
  if (question.includes("explain your diabetes")) return `Diabetes details: ${clip(a)}`
  if (question.includes("heart disease")) return yn(question, "Patient has heart disease.", "Patient does not have heart disease.", "Patient provided heart disease details.")
  if (question.includes("explain your heart disease")) return `Heart disease details: ${clip(a)}`
  if (question.includes("allergies")) return yn(question, "Patient has allergies.", "Patient does not have any allergies.", "Patient provided allergy details.")
  if (question.includes("explain your allergies")) return `Allergies: ${clip(a)}`
  if (question.includes("smoke tobacco")) return yn(question, "Patient currently smokes tobacco.", "Patient does not smoke tobacco.", "Patient provided smoking details.")
  if (question.includes("explain your smoking habits")) return `Smoking habits: ${clip(a)}`
  if (question.includes("consume alcohol")) return yn(question, "Patient consumes alcohol.", "Patient does not consume alcohol.", "Patient provided alcohol details.")
  if (question.includes("explain your alcohol consumption")) return `Alcohol consumption: ${clip(a)}`
  if (question.includes("recreational drugs")) return yn(question, "Patient uses recreational drugs.", "Patient does not use recreational drugs.", "Patient provided recreational drug details.")
  if (question.includes("explain your recreational drug use")) return `Recreational drug use: ${clip(a)}`
  if (question.includes("weight changes")) return yn(question, "Patient has experienced recent weight changes.", "Patient has not experienced recent weight changes.", "Patient provided weight-change details.")
  if (question.includes("explain your weight changes")) return `Weight changes: ${clip(a)}`
  if (question.includes("fever in the past month")) return yn(question, "Patient had a fever in the past month.", "Patient did not have a fever in the past month.", "Patient provided fever details.")
  if (question.includes("explain your fever")) return `Fever details: ${clip(a)}`
  if (question.includes("history of cancer")) return yn(question, "Patient has a history of cancer.", "Patient does not have a history of cancer.", "Patient provided cancer history details.")
  if (question.includes("explain your cancer history")) return `Cancer history: ${clip(a)}`
  if (question.includes("family history of serious illness")) return yn(question, "Patient has family history of serious illness.", "Patient does not have family history of serious illness.", "Patient provided family history.")
  if (question.includes("explain your family history")) return `Family medical history: ${clip(a)}`
  if (question.includes("current medications")) return `Current medications: ${clip(a)}`
  if (question.includes("past surgeries")) return `Past surgeries: ${clip(a)}`
  if (question.includes("additional health information")) return `Additional health information: ${clip(a)}`

  if (question.includes("Primary Insurance Provider")) return `Primary insurance provider: ${a}.`
  if (question.includes("Policy Number")) return `Policy number: ${a}.`
  if (question.includes("Group Number")) return `Group number: ${a}.`
  if (question.includes("Subscriber Name")) return `Subscriber name: ${a}.`
  if (question.includes("Relationship to Patient") && !question.includes("Emergency")) return `Relationship to patient: ${a}.`
  if (question.includes("Secondary Insurance Provider")) return `Secondary insurance provider: ${a}.`
  if (question.includes("Secondary Policy Number")) return `Secondary policy number: ${a}.`
  if (question.includes("Secondary Group Number")) return `Secondary group number: ${a}.`

  if (question.includes("Emergency Contact's Full Name")) return `Emergency contact: ${a}.`
  if (question.includes("Relationship to Patient") && question.includes("Emergency")) return `Emergency contact relationship: ${a}.`
  if (question.includes("Phone Number") && question.includes("Emergency")) return `Emergency contact phone: ${a}.`
  if (question.includes("Alternate Phone Number")) return `Emergency contact alternate phone: ${a}.`
  if (question.includes("Address") && question.includes("Emergency")) return `Emergency contact address: ${a}.`

  const ynVax = (name) => (yes ? `Patient had ${name}.` : no ? `Patient did not have ${name}.` : `Patient provided details about ${name}.`)
  if (question.includes("Tetanus") && !question.toLowerCase().includes("date")) return ynVax("Tetanus vaccine in the last 10 years")
  if (question.toLowerCase().includes("date") && question.includes("Tetanus")) return `Tetanus vaccine date: ${a}.`
  if (question.includes("Influenza") && !question.toLowerCase().includes("date")) return ynVax("Flu vaccine within the past year")
  if (question.toLowerCase().includes("date") && question.includes("Flu")) return `Flu vaccine date: ${a}.`
  if (question.includes("COVID-19 vaccination") && !question.toLowerCase().includes("date")) return ynVax("COVID-19 vaccination")
  if (question.toLowerCase().includes("date") && question.includes("COVID-19")) return `COVID-19 vaccine date: ${a}.`
  if (question.includes("Hepatitis B vaccine") && !question.toLowerCase().includes("date")) return ynVax("Hepatitis B vaccine")
  if (question.toLowerCase().includes("date") && question.includes("Hepatitis B")) return `Hepatitis B vaccine date: ${a}.`
  if (question.includes("MMR") && !question.toLowerCase().includes("date")) return ynVax("MMR vaccine")
  if (question.toLowerCase().includes("date") && question.includes("MMR")) return `MMR vaccine date: ${a}.`
  if (question.includes("Chickenpox") && !question.toLowerCase().includes("date")) return ynVax("Chickenpox vaccine")
  if (question.toLowerCase().includes("date") && question.includes("Chickenpox")) return `Chickenpox vaccine date: ${a}.`
  if (question.includes("Pneumonia vaccine") && !question.toLowerCase().includes("date")) return ynVax("Pneumonia vaccine")
  if (question.toLowerCase().includes("date") && question.includes("Pneumonia")) return `Pneumonia vaccine date: ${a}.`
  if (question.includes("Shingles vaccine") && !question.toLowerCase().includes("date")) return ynVax("Shingles vaccine")
  if (question.toLowerCase().includes("date") && question.includes("Shingles")) return `Shingles vaccine date: ${a}.`

  return a.length > 100 ? `${a.slice(0, 100)}...` : a
}

// ---------- COMPONENT ----------
const CollectUserInfo = () => {
  const [retryCount, setRetryCount] = useState(0)
  const [isOffline, setIsOffline] = useState(false)
  const [recognizing, setRecognizing] = useState(false)
  const pulseAnim = useRef(new Animated.Value(1)).current
  const dispatch = useDispatch()
  const { theme } = useTheme()
  const router = useRouter()
  const params = useLocalSearchParams()

  const answers = useSelector(selectAnswers)
  const currentIndex = useSelector(selectCurrentIndex)
  const isListening = useSelector(selectIsListening)
  const transcript = useSelector(selectTranscript)

  const isEditMode = params.edit === "true"
  const isEditMedicalMode = params.editMedical === "true"
  const questionIndexParam = params.questionIndex ? parseInt(String(params.questionIndex), 10) : null
  const formTypeParam = params.form // "personal" | "yesno" | undefined

  // voice hook
  useVoiceRecognition()

  // ====== recognition session guards & de-dupe ======
  const sessionIdRef = useRef(0)
  const lastFinalTextRef = useRef("")
  const lastEventAtRef = useRef(0)
  const listeningStoppedAtRef = useRef(0)
  const isProcessingRef = useRef(false)

  // NEW: strong repeat controls / timers
  const seenFinalsRef = useRef(new Map())
  const lastInterimAtRef = useRef(0)
  const interimThrottleMs = 180
  const shortSilenceCommitTimerRef = useRef(null)

  // --- helpers for normalization & repeat detection ---
  const normalizeFinalSafe = (t) => {
    let s = (t ?? "").replace(/\s+/g, " ").trim()
    s = s.replace(/\b(um|uh|like|you know|i mean|actually|basically|literally|kind of|sort of)\b\s*/gi, "")
    s = s.replace(/([a-zA-Z])\1{2,}/g, "$1$1")
    s = s.replace(/\b(\w+)(?:\s+\1){1,}\b/gi, "$1")
    s = s.replace(/\b(\w+\s+\w+)(?:\s+\1){1,}\b/gi, "$1")
    s = s.replace(/\b(\w+\s+\w+\s+\w+)(?:\s+\1){1,}\b/gi, "$1")
    s = s.replace(/\b(a|the|and|or|but|in|on|at|to|for|of|with|by)\s+\1\b/gi, "$1")
    s = s.replace(/\s*\.\s*/g, ". ").replace(/\s*,\s*/g, ", ").trim()
    s = s.replace(/\s{2,}/g, " ")
    return s
  }

  const bigrams = (str) => {
    const w = String(str || "").toLowerCase().split(/\s+/).filter(Boolean)
    const out = new Set()
    for (let i = 0; i < w.length - 1; i++) out.add(`${w[i]} ${w[i + 1]}`)
    return out
  }
  const jaccard = (a, b) => {
    const A = bigrams(a), B = bigrams(b)
    if (!A.size && !B.size) return 1
    let inter = 0
    A.forEach(x => { if (B.has(x)) inter++ })
    return inter / (A.size + B.size - inter || 1)
  }
  const looksRepeatish = (a, b) => {
    if (!a || !b) return false
    if (a === b) return true
    if (Math.abs(a.length - b.length) < 3 && Math.min(a.length, b.length) >= 5) return true
    return jaccard(a, b) >= 0.85
  }
  const markSeen = (s) => {
    const map = seenFinalsRef.current
    map.set(s, Date.now())
    if (map.size > 30) {
      const oldest = [...map.entries()].sort((a, b) => a[1] - b[1])[0]?.[0]
      if (oldest) map.delete(oldest)
    }
  }
  const wasSeenRecently = (s) => {
    const t = seenFinalsRef.current.get(s)
    return !!t && Date.now() - t < 5000
  }

  const startVoice = async () => {
    if (isProcessingRef.current) return

    sessionIdRef.current += 1
    lastFinalTextRef.current = ""
    seenFinalsRef.current.clear()

    isProcessingRef.current = true
    setRecognizing(true)
    dispatch(setIsListening(true))

    try {
      await ExpoSpeechRecognitionModule?.start?.({
        interimResults: true,
        maxAlternatives: 1,
        language: "en-US",
        continuous: true,
      })
    } catch (e) {
      console.log("start err:", e)
      isProcessingRef.current = false
      setRecognizing(false)
      dispatch(setIsListening(false))
    }
  }

  const stopVoiceRecognition = () => {
    if (!isListening) return

    isProcessingRef.current = false
    dispatch(setIsListening(false))
    listeningStoppedAtRef.current = Date.now()

    try {
      ExpoSpeechRecognitionModule?.stop?.()
    } catch (e) {
      console.log("stop err:", e)
    }

    if (shortSilenceCommitTimerRef.current) {
      clearTimeout(shortSilenceCommitTimerRef.current)
      shortSilenceCommitTimerRef.current = null
    }

    if ((transcript ?? "").trim() !== "") {
      commitCurrentAnswer()
    }

    seenFinalsRef.current.clear()
    lastFinalTextRef.current = ""
  }

  // ---------- INIT: handle reset and edit mode ----------
  useEffect(() => {
    if (!isEditMode && !isEditMedicalMode) {
      dispatch(resetUserInfo())
    } else if (isEditMedicalMode && questionIndexParam !== null) {
      dispatch(setCurrentIndex(questionIndexParam))
    }
  }, [dispatch, isEditMode, isEditMedicalMode, questionIndexParam])

  // ---------- INITIAL LOAD FROM FIREBASE (once) & MERGE ----------
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const user = firebaseAuth.currentUser
        if (!user) return
        const snap = await getDoc(doc(firestore, "users", user.uid))
        const fbAnswers = snap.exists() && Array.isArray(snap.data()?.answers) ? snap.data().answers : []

        const merged = Array.from({ length: questionsData.length }, (_, idx) => {
          const local = answers[idx] || {}
          const remote = fbAnswers[idx] || {}
          const answer = (local.answer ?? "").trim() !== "" ? local.answer : (remote.answer ?? "")
          const summarizedAnswer =
            (local.summarizedAnswer ?? "").trim() !== "" ? local.summarizedAnswer : (remote.summarizedAnswer ?? "")
          return { answer: answer ?? "", summarizedAnswer: summarizedAnswer ?? "" }
        })

        if (!mounted) return
        merged.forEach((a, idx) => {
          if ((a.answer ?? "") !== "" || (a.summarizedAnswer ?? "") !== "") {
            dispatch(setAnswer({ index: idx, answer: a.answer ?? "", summarizedAnswer: a.summarizedAnswer ?? "" }))
          }
        })

        if (isEditMedicalMode && questionIndexParam !== null) {
          dispatch(setCurrentIndex(questionIndexParam))
          const existing = merged[questionIndexParam] || { answer: "", summarizedAnswer: "" }
          dispatch(setTranscript(existing.answer || ""))
        } else {
          const curr = merged[currentIndex] || { answer: "", summarizedAnswer: "" }
          dispatch(setTranscript(curr.answer || ""))
        }
      } catch (e) {
        console.error("Initial load merge error:", e)
      }
    })()
    return () => {
      mounted = false
    }
  }, []) // run once

  // ---------- LOCAL AUTOSAVE (Firebase save on completion only) ----------
  useEffect(() => {
    const id = setTimeout(async () => {
      try {
        const payload = Array.from({ length: questionsData.length }, (_, idx) => {
          const a = answers[idx] || {}
          return {
            answer: typeof a.answer === "string" ? a.answer : "",
            summarizedAnswer: typeof a.summarizedAnswer === "string" ? a.summarizedAnswer : "",
          }
        })
        await AsyncStorage.setItem("userPersonalInfo", JSON.stringify(payload))
        console.log("Data autosaved locally")
      } catch (e) {
        console.error("Local autosave failed:", e)
      }
    }, 2000)
    return () => clearTimeout(id)
  }, [answers])

  // ---------- EMAIL PREFILL (signup) ----------
  useEffect(() => {
    ;(async () => {
      try {
        const userEmail = await AsyncStorage.getItem("userEmail")
        if (!userEmail) return
        const emailIndex = questionsData.findIndex((q) => q.question.includes("Email Address"))
        if (emailIndex === -1) return
        const existing = answers[emailIndex]?.answer ?? ""
        if (!existing && currentIndex === emailIndex) {
          const summarized = generateSummarizedAnswer(questionsData[emailIndex].question, userEmail)
          dispatch(setTranscript(userEmail))
          dispatch(setAnswer({ index: emailIndex, answer: userEmail, summarizedAnswer: summarized }))
        }
      } catch (e) {
        console.error("Email prefill error:", e)
      }
    })()
  }, [currentIndex])

  // ---------- listening pulse ----------
  useEffect(() => {
    if (isListening) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
      )
      loop.start()
      return () => loop.stop()
    } else {
      pulseAnim.setValue(1)
    }
  }, [isListening])

  // ---------- keep transcript aligned with currentIndex ----------
  useEffect(() => {
    const currentAnswer = answers[currentIndex]?.answer || ""
    dispatch(setTranscript(currentAnswer))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex])

  // ---------- safety: back handler while listening ----------
  useEffect(() => {
    const backAction = () => {
      if (!isListening) return false
      Alert.alert("Voice Recognition Active", "Please stop voice recognition before going back.", [
        {
          text: "Stop & Go Back",
          onPress: () => {
            stopVoiceRecognition()
            handleGoBack()
          },
        },
        { text: "Cancel", style: "cancel" },
      ])
      return true
    }
    const sub = BackHandler.addEventListener("hardwareBackPress", backAction)
    return () => sub.remove()
  }, [isListening])

  // ---------- connectivity (web only) ----------
  useEffect(() => {
    const update = () => {
      if (Platform.OS === "web") setIsOffline(!navigator.onLine)
    }
    update()
    const id = setInterval(update, 15000)
    return () => clearInterval(id)
  }, [])

  // ====== SPEECH EVENTS ======
  useSpeechRecognitionEvent("start", () => {
    if (!isListening) return
    setRecognizing(true)
  })

  useSpeechRecognitionEvent("end", () => {
    setRecognizing(false)
    isProcessingRef.current = false
  })

  // UPDATED RESULT HANDLER (JS)
  useSpeechRecognitionEvent("result", (event) => {
    if (!isListening || !isProcessingRef.current) return

    const arr = event?.results || []
    const last = arr[arr.length - 1]
    if (!last) return

    // SESSION/LATE EVENT GUARD
    const stoppedAgo = Date.now() - listeningStoppedAtRef.current
    if (listeningStoppedAtRef.current && stoppedAgo < 150) return

    const raw = String(last.transcript || "")
    const isFinal = !!last.isFinal || !!(event && event.isFinal)

    // THROTTLE INTERIM UPDATES
    if (!isFinal) {
      const now = Date.now()
      if (now - lastInterimAtRef.current < interimThrottleMs) return
      lastInterimAtRef.current = now

      const cleanInterim = raw
        .replace(/\b(um|uh|like|actually)\b\s*/gi, "")
        .replace(/([a-zA-Z])\1{2,}/g, "$1$1")
        .replace(/\b(\w+)(?:\s+\1){1,}\b/gi, "$1")
        .trim()

      if (cleanInterim) dispatch(setTranscript(cleanInterim))
      return
    }

    // FINAL PROCESSING
    const normalized = normalizeFinalSafe(raw)
    if (!normalized) return

    const now = Date.now()
    const prev = lastFinalTextRef.current

    // STRONG DE-DUPLICATION
    if (wasSeenRecently(normalized) || looksRepeatish(normalized, prev)) return
    if (now - lastEventAtRef.current < 300 && Math.abs(normalized.length - prev.length) < 2) return

    // accept new final
    lastFinalTextRef.current = normalized
    lastEventAtRef.current = now
    markSeen(normalized)
    dispatch(setTranscript(normalized))

    // SHORT-SILENCE AUTO-COMMIT
    if (shortSilenceCommitTimerRef.current) clearTimeout(shortSilenceCommitTimerRef.current)
    shortSilenceCommitTimerRef.current = setTimeout(() => {
      if (lastFinalTextRef.current === normalized && isListening) {
        commitCurrentAnswer()
      }
    }, 600)

    // YES/NO FAST PATH
    const currentQuestion = questionsData[currentIndex]?.question || ""
    if (currentQuestion.includes("Have you") || currentQuestion.includes("Do you") || currentQuestion.includes("Are you")) {
      const lower = normalized.toLowerCase()
      if (/(^|\s)(yes|no|never)([\s\.\!,]|$)/.test(lower)) {
        if (shortSilenceCommitTimerRef.current) clearTimeout(shortSilenceCommitTimerRef.current)
        setTimeout(() => commitCurrentAnswer(), 300)
      }
    }
  })

  useSpeechRecognitionEvent("error", (event) => {
    if (!isListening) return
    console.log("speech error:", event?.error, event?.message)

    isProcessingRef.current = false

    // Only stop on critical errors
    if (event?.error === "not-allowed" || event?.error === "audio-capture") {
      stopVoiceRecognition()
    }

    if (retryCount < 2 && (event?.error === "network" || event?.error === "not-allowed")) {
      setRetryCount((x) => x + 1)
    }
  })

  // ----- commit helper -----
  const commitCurrentAnswer = () => {
    const raw = String(transcript ?? "").trim()
    const prev = (answers[currentIndex]?.answer ?? "").trim()
    if (!raw || raw === prev) return
    const q = questionsData[currentIndex]?.question || ""
    const summarized = generateSummarizedAnswer(q, raw)
    dispatch(setAnswer({ index: currentIndex, answer: raw, summarizedAnswer: summarized }))
  }

  const handlePressNext = () => {
    if (isListening) {
      Alert.alert("Voice Recognition Active", "Please stop voice recognition before proceeding.", [{ text: "OK" }])
      return
    }
    if ((transcript ?? "").trim() !== "") commitCurrentAnswer()

    if (isEditMode) {
      router.push("/collect-user-info/recap")
    } else if (isEditMedicalMode) {
      const fromMedicalHistory = params.fromMedicalHistory === "true"
      if (fromMedicalHistory) {
        router.push({ 
          pathname: "/(main)/medical-history", 
          params: { 
            fromEdit: "true", 
            t: Date.now().toString() 
          } 
        })
      } else {
        router.push("/collect-user-info/recap")
      }
    } else if (currentIndex < questionsData.length - 1) {
      dispatch(setCurrentIndex(currentIndex + 1))
      dispatch(setTranscript(""))
    } else {
      router.push("/collect-user-info/recap")
    }
  }

  const handlePressSkip = () => {
    if (isListening) {
      Alert.alert("Voice Recognition Active", "Please stop voice recognition before proceeding.", [{ text: "OK" }])
      return
    }
    if (currentIndex < questionsData.length - 1) {
      dispatch(setCurrentIndex(currentIndex + 1))
      dispatch(setTranscript(""))
    } else {
      if (isEditMode) {
        router.push("/collect-user-info/recap")
      } else if (isEditMedicalMode) {
        router.push({ pathname: "/(main)/medical-history", params: { fromEdit: "true", t: Date.now().toString() } })
      } else {
        router.push("/collect-user-info/recap")
      }
    }
  }

  const handleGoBack = () => {
    if (isListening) {
      Alert.alert("Voice Recognition Active", "Please stop voice recognition before proceeding.", [{ text: "OK" }])
      return
    }
    if (isEditMedicalMode) {
      router.push({ pathname: "/(main)/medical-history", params: { fromEdit: "true", t: Date.now().toString() } })
    } else if (isEditMode) {
      router.push("/collect-user-info/recap")
    } else if (currentIndex > 0) {
      dispatch(setCurrentIndex(currentIndex - 1))
      dispatch(setTranscript(""))
    } else {
      router.push("/(main)/dashboard")
    }
  }

  // ====== IMPORTANT: cleanup to stop stray late events ======
  useEffect(() => {
    return () => {
      try { ExpoSpeechRecognitionModule?.stop?.() } catch {}
      if (shortSilenceCommitTimerRef.current) {
        clearTimeout(shortSilenceCommitTimerRef.current)
        shortSilenceCommitTimerRef.current = null
      }
      dispatch(setIsListening(false))
      listeningStoppedAtRef.current = Date.now()
      isProcessingRef.current = false
      seenFinalsRef.current.clear()
      lastFinalTextRef.current = ""
    }
  }, [])

  // ---------- NUMBERING FIX ----------
  const effectiveSet = useMemo(() => {
    if (isEditMode || isEditMedicalMode) {
      const cq = questionsData[currentIndex]?.question
      const isPersonal = personalQuestionsData?.some((q) => q.question === cq)
      return isPersonal ? personalQuestionsData : yesNoQuestionsData
    }
    if (formTypeParam === "yesno") return yesNoQuestionsData
    if (formTypeParam === "personal") return personalQuestionsData
    return personalQuestionsData
  }, [isEditMode, isEditMedicalMode, currentIndex, formTypeParam])

  const displayIndex = useMemo(() => {
    const masterQ = questionsData[currentIndex]?.question
    const arr = (effectiveSet ?? questionsData).map((q) => q.question)
    const idx = arr.findIndex((q) => q === masterQ)
    return (idx === -1 ? currentIndex : idx) + 1
  }, [currentIndex, effectiveSet])

  // ---------- render routing ----------
  if (isEditMode || isEditMedicalMode) {
    const currentQuestion = questionsData[currentIndex]
    const isPersonal = personalQuestionsData?.some((q) => q.question === currentQuestion.question)
    if (formTypeParam === "yesno") return <YesNoQuestionsForm startVoice={startVoice} stopVoice={stopVoiceRecognition} displayIndex={displayIndex} total={(effectiveSet ?? questionsData).length} />
    if (formTypeParam === "personal") return <PersonalInfoForm startVoice={startVoice} stopVoice={stopVoiceRecognition} displayIndex={displayIndex} total={(effectiveSet ?? questionsData).length} />
    return isPersonal
      ? <PersonalInfoForm startVoice={startVoice} stopVoice={stopVoiceRecognition} displayIndex={displayIndex} total={(effectiveSet ?? questionsData).length} />
      : <YesNoQuestionsForm startVoice={startVoice} stopVoice={stopVoiceRecognition} displayIndex={displayIndex} total={(effectiveSet ?? questionsData).length} />
  }

  if (formTypeParam === "yesno")
    return <YesNoQuestionsForm startVoice={startVoice} stopVoice={stopVoiceRecognition} displayIndex={displayIndex} total={(effectiveSet ?? questionsData).length} />

  return <PersonalInfoForm startVoice={startVoice} stopVoice={stopVoiceRecognition} displayIndex={displayIndex} total={(effectiveSet ?? questionsData).length} />
}

export default CollectUserInfo

// styles (unchanged)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
    paddingTop: 10,
    paddingBottom: 20,
  },
  card: {
    width: "90%",
    backgroundColor: "#e2ded6",
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  progressRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    marginTop: 0,
  },
  dot: {
    width: 24,
    height: 8,
    borderRadius: 8,
    backgroundColor: "#bfc2c6",
  },
  dotActive: {
    backgroundColor: "#6B705B",
  },
  circleNum: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#6B705B",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  circleNumText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  questionText: {
    fontSize: 26,
    fontWeight: "500",
    color: "#222",
    marginBottom: 16,
    lineHeight: 32,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#BFC2B7",
    borderRadius: 20,
    flex: 1,
    height: 48,
    marginRight: 10,
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#fff",
    paddingVertical: 12,
    backgroundColor: "transparent",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#6B705B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: "500",
    color: "#222",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
    color: "#222",
    marginBottom: 16,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 8,
  },
  nextBtn: {
    flex: 1,
    backgroundColor: "#6B705B",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 12,
    marginRight: 4,
  },
  nextBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  skipBtn: {
    flex: 1,
    backgroundColor: "#B6BDC6",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 12,
    marginLeft: 4,
  },
  skipBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  prevBtn: {
    flex: 1,
    backgroundColor: "#8B8B8B",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 12,
    marginHorizontal: 2,
  },
  prevBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  listeningText: {
    color: "#6B705B",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
  disabledText: {
    color: "#6B705B",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
    fontStyle: "italic",
  },
  navigationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#e2ded6",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  navButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
    color: "#6B705B",
  },
  clarificationContainer: {
    backgroundColor: "#fff3cd",
    borderColor: "#ffeaa7",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  clarificationText: {
    fontSize: 14,
    color: "#856404",
    lineHeight: 20,
    fontStyle: "italic",
  },
  offlineIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ff6b6b",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 20,
  },
  offlineText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  skipAllContainer: {
    width: "100%",
    marginTop: 12,
    alignItems: "center",
  },
  skipAllBtn: {
    backgroundColor: "#ff6b6b",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#ff5252",
  },
  skipAllBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  disabledBtn: {
    backgroundColor: "#bfc2c6",
    opacity: 0.6,
  },
  disabledBtnText: {
    color: "#8b8b8b",
  },
  prefilledIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  prefilledText: {
    color: "#4CAF50",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  selectionTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: "#222",
    marginBottom: 8,
    textAlign: "center",
  },
  selectionSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
    lineHeight: 22,
  },
  formSelectionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#e9ecef",
  },
  formSelectionTextContainer: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  formSelectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
    marginBottom: 4,
  },
  formSelectionDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
})
