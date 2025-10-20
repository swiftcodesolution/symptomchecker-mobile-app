"use client"

import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
  ScrollView,
  Platform,
  PermissionsAndroid,
  BackHandler,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useEffect, useRef } from "react"
import { useRouter, useLocalSearchParams } from "expo-router"
import { useTheme } from "../theme/ThemeContext"
import Icon from "react-native-vector-icons/Feather"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import AnimatedBackground from "../components/AnimatedBackground"
import AsyncStorage from "@react-native-async-storage/async-storage"
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
import { doc, getDoc, setDoc } from "firebase/firestore"
import { questionsData } from "./index"
import DateTimePicker from '@react-native-community/datetimepicker'

// Personal information questions
export const personalQuestionsData = [
  {
    question: "What is your Date of Birth (MM/DD/YYYY)?",
    type: "date",
    field: "dateOfBirth",
    summarizedAnswer: "",
  },
  // {
  //   question: "What is your Age?",
  //   type: "number",
  //   field: "age",
  //   summarizedAnswer: "",
  // },
  {
    question: "What is your Gender (Male/Female/Other)?",
    type: "text",
    field: "gender",
    summarizedAnswer: "",
  },
  {
    question: "What is your Ethnicity?",
    type: "text",
    field: "ethnicity",
    summarizedAnswer: "",
  },
  {
    question: "What is your Home Address?",
    type: "text",
    field: "address",
    summarizedAnswer: "",
  },
  {
    question: "What is your City?",
    type: "text",
    field: "city",
    summarizedAnswer: "",
  },
  {
    question: "What is your State?",
    type: "text",
    field: "state",
    summarizedAnswer: "",
  },
  {
    question: "What is your Zip Code?",
    type: "text",
    field: "zipCode",
    summarizedAnswer: "",
  },
  {
    question: "What is your Phone Number?",
    type: "phone",
    field: "phoneNumber",
    summarizedAnswer: "",
  },
  {
    question: "What is your Height (ft/in)?",
    type: "text",
    field: "height",
    summarizedAnswer: "",
  },
  {
    question: "What is your Weight (lbs)?",
    type: "number",
    field: "weight",
    summarizedAnswer: "",
  },
]

// Function to generate summarized answer for personal questions
const generatePersonalSummarizedAnswer = (question, answer) => {
  if (!answer.trim()) return "";

  const lowerAnswer = answer.toLowerCase();

  if (question.includes("Date of Birth")) {
    return `Patient's date of birth is ${answer}.`;
  }

  if (question.includes("Age")) {
    return `Patient is ${answer} years old.`;
  }

  if (question.includes("Gender")) {
    return `Patient identifies as ${answer}.`;
  }

  if (question.includes("Ethnicity")) {
    return `Patient's ethnicity is ${answer}.`;
  }

  if (question.includes("Address") && !question.includes("Emergency")) {
    return `Patient's address is ${answer}.`;
  }

  if (question.includes("City")) {
    return `Patient resides in ${answer}.`;
  }

  if (question.includes("State")) {
    return `Patient resides in ${answer}.`;
  }

  if (question.includes("Zip Code")) {
    return `Patient's zip code is ${answer}.`;
  }

  if (question.includes("Phone Number") && !question.includes("Emergency")) {
    return `Patient's phone number is ${answer}.`;
  }

  if (question.includes("Email Address")) {
    return `Patient's email is ${answer}.`;
  }

  if (question.includes("Height")) {
    return `Patient's height is ${answer}.`;
  }

  if (question.includes("Weight")) {
    return `Patient's weight is ${answer} lbs.`;
  }

  return answer.length > 100 ? `${answer.substring(0, 100)}...` : answer;
};

const PersonalInfoForm = ({ startVoice, stopVoice, displayIndex, total }) => {
  const [userAnswers, setUserAnswers] = useState({})
  const answers = useSelector(selectAnswers)
  const currentIndex = useSelector(selectCurrentIndex)
  const isListening = useSelector(selectIsListening)
  const transcript = useSelector(selectTranscript)
  const [isPaused, setIsPaused] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [isOffline, setIsOffline] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isListeningToIndex, setIsListeningToIndex] = useState(null)
  const [saving, setSaving] = useState(false)
  const [voiceTimeout, setVoiceTimeout] = useState(null)
  const dispatch = useDispatch()
  const pulseAnim = useRef(new Animated.Value(1)).current
  const { theme } = useTheme()
  const router = useRouter()
  const params = useLocalSearchParams()

  // Check if we're in edit mode
  const isEditMode = params.edit === "true"
  const isEditMedicalMode = params.editMedical === "true"
  const questionIndex = params.questionIndex ? parseInt(params.questionIndex) : null

  // Improved speech recognition
  const isProcessingRef = useRef(false)

  // Inside your PersonalInfoForm component:
  useEffect(() => {
    // Only reset state when component mounts and not in edit mode
    if (!isEditMode) {
      dispatch(resetUserInfo())
    }
  }, [dispatch, isEditMode])

  // Recompute Age whenever the stored DOB answer changes
  useEffect(() => {
    const dobQ = personalQuestionsData.find(q => q.question.includes("Date of Birth"))
    const ageQ = personalQuestionsData.find(q => q.question === "What is your Age?")
    if (!dobQ || !ageQ) return

    const dobIdx = questionsData.findIndex(qq => qq.question === dobQ.question)
    const ageIdx = questionsData.findIndex(qq => qq.question === ageQ.question)

    const dobText = answers[dobIdx]?.answer || "" // expected "MM/DD/YYYY"
    if (!dobText) return

    const [mm, dd, yyyy] = dobText.split("/").map(Number)
    if (!yyyy || !mm || !dd) return
    const dob = new Date(yyyy, mm - 1, dd)

    const age = calculateAgeFromDOB(dob)
    const ageText = String(age)

    // Only dispatch if changed (prevents render loops)
    if (answers[ageIdx]?.answer !== ageText) {
      const ageSumm = generatePersonalSummarizedAnswer(ageQ.question, ageText)
      dispatch(setAnswer({ index: ageIdx, answer: ageText, summarizedAnswer: ageSumm }))
    }
  }, [answers])

  // Improved speech recognition event handlers
  useSpeechRecognitionEvent("start", () => {
    dispatch(setIsListening(true))
  })

  useSpeechRecognitionEvent("end", () => {
    dispatch(setIsListening(false))
    setIsListeningToIndex(null)
    isProcessingRef.current = false
  })

  useSpeechRecognitionEvent("result", (event) => {
    if (!isListening || !isProcessingRef.current) return

    const arr = event?.results || []
    if (arr.length === 0) return

    // Process all results to build complete transcript
    let completeTranscript = ""
    let hasFinalResult = false

    for (let i = 0; i < arr.length; i++) {
      const result = arr[i]
      if (!result) continue

      const alternatives = result[0]
      if (!alternatives) continue

      const text = String(alternatives.transcript || "").trim()
      if (!text) continue

      completeTranscript += (completeTranscript ? " " : "") + text

      if (result.isFinal) {
        hasFinalResult = true
      }
    }

    if (completeTranscript) {
      // Clean and normalize the transcript
      const cleanTranscript = completeTranscript
        .replace(/\s+/g, " ")
        .replace(/\b(um|uh|like|you know|i mean)\b\s*/gi, "")
        .trim()

      const question = personalQuestionsData[isListeningToIndex]
      const summarized = generatePersonalSummarizedAnswer(question.question, cleanTranscript)
      const globalIndex = questionsData.findIndex(qq => qq.question === question.question)
      
      dispatch(setAnswer({ index: globalIndex, answer: cleanTranscript, summarizedAnswer: summarized }))
      dispatch(setTranscript(cleanTranscript))

      // Auto-stop when we have substantial content or final result
      if (hasFinalResult || cleanTranscript.length > 10) {
        stopVoiceRecognition()
      }
    }
  })

  useSpeechRecognitionEvent("error", (event) => {
    console.log("Speech error:", event?.error)
    dispatch(setIsListening(false))
    setIsListeningToIndex(null)
    isProcessingRef.current = false
  })

  // Animation for mic button
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start()
    } else {
      pulseAnim.setValue(1)
    }
  }, [isListening])

  useEffect(() => {
    const currentAnswer = answers[currentIndex]?.answer || ""
    dispatch(setTranscript(currentAnswer))
  }, [currentIndex])

  const calculateAgeFromDOB = (dob) => {
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const m = today.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age -= 1
    }
    return Math.max(0, age)
  }

  const stopVoiceRecognition = () => {
    if (!isListening) return

    isProcessingRef.current = false
    dispatch(setIsListening(false))
    setIsListeningToIndex(null)

    try {
      ExpoSpeechRecognitionModule?.stop?.()
    } catch (e) {
      console.log("Stop error:", e)
    }

    // Commit current transcript
    if ((transcript ?? "").trim() !== "") {
      const question = personalQuestionsData[isListeningToIndex]
      if (question) {
        const summarized = generatePersonalSummarizedAnswer(question.question, transcript)
        const globalIndex = questionsData.findIndex(qq => qq.question === question.question)
        dispatch(setAnswer({ index: globalIndex, answer: transcript, summarizedAnswer: summarized }))
      }
    }
  }

  // Handle date picker
  const handleDateChange = (event, pickedDate) => {
    const isAndroidSet = Platform.OS === 'android' ? event?.type === 'set' : true
    if (!isAndroidSet) {
      setShowDatePicker(false)
      return
    }

    const finalDate = pickedDate || selectedDate
    if (Platform.OS === 'android') setShowDatePicker(false)
    else setShowDatePicker(true)

    setSelectedDate(finalDate)

    const formattedDate = finalDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })

    const dobQ = personalQuestionsData.find(q => q.question.includes("Date of Birth"))
    const dobGlobalIndex = questionsData.findIndex(qq => qq.question === dobQ.question)
    const dobSumm = generatePersonalSummarizedAnswer(dobQ.question, formattedDate)
    dispatch(setAnswer({ index: dobGlobalIndex, answer: formattedDate, summarizedAnswer: dobSumm }))

    const age = calculateAgeFromDOB(finalDate)
    const ageQ = personalQuestionsData.find(q => q.question === "What is your Age?")
    if (ageQ) {
      const ageGlobalIndex = questionsData.findIndex(qq => qq.question === ageQ.question)
      const ageText = String(age)
      if (answers[ageGlobalIndex]?.answer !== ageText) {
        const ageSumm = generatePersonalSummarizedAnswer(ageQ.question, ageText)
        dispatch(setAnswer({ index: ageGlobalIndex, answer: ageText, summarizedAnswer: ageSumm }))
      }
    }
  }

  const showDatePickerModal = () => {
    const dobQ = personalQuestionsData.find(q => q.question.includes("Date of Birth"))
    const dobIdx = questionsData.findIndex(qq => qq.question === dobQ.question)
    const dobText = answers[dobIdx]?.answer || ""
    if (dobText) {
      const [mm, dd, yyyy] = dobText.split("/").map(Number)
      if (yyyy && mm && dd) setSelectedDate(new Date(yyyy, mm - 1, dd))
    }
    setShowDatePicker(true)
  }

  // Improved voice recognition handler
  const handleVoicePress = async (questionIndex) => {
    console.log("=== VOICE PRESSED FOR QUESTION", questionIndex, "===")

    // Toggle off if already listening to the same field
    if (isListening && isListeningToIndex === questionIndex) {
      stopVoiceRecognition()
      return
    }

    setIsListeningToIndex(questionIndex)
    isProcessingRef.current = true

    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync()
      if (!perm.granted) {
        Alert.alert("Permission Required", "Microphone permission is required for voice input.")
        setIsListeningToIndex(null)
        return
      }
      
      dispatch(setIsListening(true))
      await ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        continuous: true,
        maxAlternatives: 1
      })
    } catch (err) {
      console.error("Voice recognition error:", err)
      dispatch(setIsListening(false))
      setIsListeningToIndex(null)
      isProcessingRef.current = false
    }
  }

  const handlePressNext = async () => {
    try {
      // Save to Firebase first
      const user = firebaseAuth.currentUser;
      if (user) {
        const userDocRef = doc(firestore, "users", user.uid);
        const docSnap = await getDoc(userDocRef);
        const existingData = docSnap.exists() ? docSnap.data() : { answers: [] };

        const mergedAnswers = Array(questionsData.length).fill(null).map((_, idx) => {
          const local = (answers[idx] || {});
          const remote = (existingData.answers?.[idx] || {});
          return (local.answer && local.answer.trim() !== "") ? {
            answer: local.answer,
            summarizedAnswer: local.summarizedAnswer || ""
          } : {
            answer: remote.answer || "",
            summarizedAnswer: remote.summarizedAnswer || ""
          };
        });

        await setDoc(userDocRef, { answers: mergedAnswers, updatedAt: new Date().toISOString() }, { merge: true });
        console.log("Personal info saved to Firebase");
      }

      // Also save to AsyncStorage
      const finalAnswers = {
        ...userAnswers,
        ...answers,
      }
      await AsyncStorage.setItem("userPersonalInfo", JSON.stringify(finalAnswers));

      // Navigate to Yes/No questions form
      router.push({
        pathname: "/collect-user-info",
        params: { form: "yesno" }
      });
    } catch (error) {
      console.log("Error saving user info:", error);
      router.push({
        pathname: "/collect-user-info",
        params: { form: "yesno" }
      });
    }
  }

  // Save edits to Firestore and go back to Medical History
  const handleSaveEdit = async () => {
    try {
      setSaving(true)
      const user = firebaseAuth.currentUser;
      if (!user) {
        Alert.alert("Error", "No user logged in");
        return;
      }
      const userDocRef = doc(firestore, "users", user.uid);
      const docSnap = await getDoc(userDocRef);
      const existingData = docSnap.exists() ? docSnap.data() : { answers: [] };

      const mergedAnswers = Array(questionsData.length).fill(null).map((_, idx) => {
        const local = (answers[idx] || {});
        const remote = (existingData.answers?.[idx] || {});
        return (local.answer && local.answer.trim() !== "") ? {
          answer: local.answer,
          summarizedAnswer: local.summarizedAnswer || ""
        } : {
          answer: remote.answer || "",
          summarizedAnswer: remote.summarizedAnswer || ""
        };
      });

      await setDoc(userDocRef, { answers: mergedAnswers, updatedAt: new Date().toISOString() }, { merge: true });
      setTimeout(() => {
        try {
          router.replace({ pathname: '/(main)/medical-history', params: { fromEdit: 'true', timestamp: new Date().getTime() } });
        } catch (navErr) {
          console.warn('Navigation defer failed, retrying with push', navErr);
          router.push({ pathname: '/(main)/medical-history', params: { fromEdit: 'true', timestamp: new Date().getTime() } });
        }
      }, 0);
    } catch (e) {
      console.error("Save edit failed:", e);
      Alert.alert("Error", "Failed to save changes");
    } finally { setSaving(false) }
  };

  return (
    <AnimatedBackground>
      <SafeAreaView style={styles.container}>
        {/* Back to Medical History when coming from Medical History edit */}
        {(params?.fromMedicalHistory === 'true') && (
          <View style={styles.navigationHeader}>
            <TouchableOpacity
              onPress={() => {
                router.push({
                  pathname: '/(main)/medical-history',
                  params: { fromEdit: 'true', timestamp: new Date().getTime() }
                });
              }}
              style={styles.navButtonLarge}
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Go back to Medical History"
            >
              <Icon name="arrow-left" size={20} color="#4d5a5a" />
              <Text style={styles.navButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* All Questions Form */}
          {personalQuestionsData.map((question, index) => (
            <View key={index} style={styles.questionContainer}>
              <View style={styles.questionHeader}>
                <View style={styles.questionNumber}>
                   <Icon name="circle" size={8} color="black" />
                </View>
                <Text style={styles.questionText}>{question.question}</Text>
              </View>

              {/* Input Field with Voice Button */}
              <View style={styles.inputContainer}>
                <View style={styles.inputRow}>
                  {question.type === "date" ? (
                    <TouchableOpacity
                      style={styles.dateInputButton}
                      onPress={() => {
                        dispatch(setCurrentIndex(index))
                        showDatePickerModal();
                      }}
                    >
                      <Text style={styles.dateInputText}>
                        {answers[questionsData.findIndex(qq => qq.question === question.question)]?.answer || "Select Date"}
                      </Text>
                      <Icon name="calendar" size={20} color="#6B705B" />
                    </TouchableOpacity>
                  ) : (
                    <TextInput
                      style={[
                        styles.input,
                        question.question === "What is your Age?" && { opacity: 0.8 }
                      ]}
                      placeholder={question.question === "What is your Age?" ? "Auto-filled from DOB" : "Type your answer"}
                      placeholderTextColor="#999"
                      value={(answers[questionsData.findIndex(qq => qq.question === question.question)]?.answer) || ""}
                      onChangeText={(text) => {
                        if (question.question === "What is your Age?") return
                        const summarized = generatePersonalSummarizedAnswer(question.question, text);
                        const globalIndex = questionsData.findIndex(qq => qq.question === question.question);
                        dispatch(setAnswer({ index: globalIndex, answer: text, summarizedAnswer: summarized }));
                      }}
                      editable={question.question !== "What is your Age?"}
                      selectTextOnFocus={question.question !== "What is your Age?"}
                      keyboardType={
                        question.type === "number" ? "numeric" :
                          question.type === "email" ? "email-address" :
                            question.type === "phone" ? "phone-pad" :
                              "default"
                      }
                    />
                  )}

                  {/* Voice Button */}
                  {/* {question.type !== "date" && (
                    (isListeningToIndex === index) ? (
                      <TouchableOpacity
                        style={[
                          styles.voiceButton,
                          styles.voiceButtonListening
                        ]}
                        onPress={stopVoiceRecognition}
                      >
                        <MaterialCommunityIcons
                          name="stop-circle"
                          size={20}
                          color="#ff4444"
                        />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.voiceButton}
                        onPress={() => handleVoicePress(index)}
                      >
                        <MaterialCommunityIcons
                          name="microphone-outline"
                          size={20}
                          color={theme.primary}
                        />
                      </TouchableOpacity>
                    )
                  )} */}
                </View>

                {/* Listening Status */}
                {(isListeningToIndex === index) && (
                  <View style={styles.listeningContainer}>
                    <Text style={styles.listeningText}>
                      🎤 Listening... Speak clearly now
                    </Text>
                    <Text style={styles.listeningSubtext}>
                      Press stop icon when done speaking
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}

          {/* Submit Button or Save Edit */}
          <View style={styles.submitCard}>
            {params?.fromMedicalHistory === 'true' ? (
              <TouchableOpacity
                style={[styles.submitBtn, saving && { opacity: 0.7 }]}
                onPress={handleSaveEdit}
                disabled={saving}
              >
                <Text style={styles.submitBtnText}>{saving ? 'Saving...' : 'Save and Return'}</Text>
                {saving ? (
                  <ActivityIndicator size={20} color="#fff" />
                ) : (
                  <Icon name="check" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handlePressNext}
              >
                <Text style={styles.submitBtnText}>Continue to Medical Questions</Text>
                <Icon name="arrow-right" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
          />
        )}
      </SafeAreaView>
    </AnimatedBackground>
  )
}

export default PersonalInfoForm

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
    fontSize: 18,
    fontWeight: "500",
    color: "#222",
    flex: 1,
    lineHeight: 24,
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
    color: "#222",
    paddingVertical: 8,
    backgroundColor: "transparent",
  },
  navigationHeader: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: "#e2ded6",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    zIndex: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },

  navButtonLarge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  navButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#4d5a5a",
  },

  dateInputButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    backgroundColor: "transparent",
  },
  dateInputText: {
    fontSize: 16,
    color: "#222",
    flex: 1,
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
  disabledText: {
    color: "#6B705B",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
    fontStyle: "italic",
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
  questionContainer: {
    width: "90%",
    marginBottom: 20,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  questionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#6B705B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  questionNumberText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  inputContainer: {
    marginTop: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e9ecef",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  voiceButtonListening: {
    backgroundColor: "#ffebee",
    borderWidth: 2,
    borderColor: "#ff4444",
  },
  listeningContainer: {
    marginTop: 8,
    alignItems: "center",
  },
  listeningText: {
    color: "#ff4444",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  listeningSubtext: {
    color: "#666",
    fontSize: 11,
    marginTop: 2,
    textAlign: "center",
    fontStyle: "italic",
  },
  submitCard: {
    width: "90%",
    backgroundColor: "#e2ded6",
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtn: {
    backgroundColor: "#6B705B",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 280,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
})