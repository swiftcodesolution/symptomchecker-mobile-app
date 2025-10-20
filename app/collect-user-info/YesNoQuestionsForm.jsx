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
import { firebaseAuth, firestore } from "../config/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { questionsData } from "./index"
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

// Yes/No questions data
export const yesNoQuestionsData = [
  {
    question: "Have you had any surgeries in the past?",
    type: "yesno",
    field: "pastSurgeries",
    summarizedAnswer: "",
  },
  {
    question: "If yes, please explain your past surgeries:",
    type: "text",
    field: "pastSurgeriesDetails",
    summarizedAnswer: "",
    dependsOn: "pastSurgeries",
    dependsOnValue: "yes",
  },
  {
    question: "Have you ever been hospitalized?",
    type: "yesno",
    field: "hospitalized",
    summarizedAnswer: "",
  },
  {
    question: "If yes, please explain your hospitalizations:",
    type: "text",
    field: "hospitalizationsDetails",
    summarizedAnswer: "",
    dependsOn: "hospitalized",
    dependsOnValue: "yes",
  },
  {
    question: "Do you have high blood pressure?",
    type: "yesno",
    field: "highBloodPressure",
    summarizedAnswer: "",
  },
  {
    question: "If yes, please explain your high blood pressure:",
    type: "text",
    field: "highBloodPressureDetails",
    summarizedAnswer: "",
    dependsOn: "highBloodPressure",
    dependsOnValue: "yes",
  },
  {
    question: "Do you have diabetes?",
    type: "yesno",
    field: "diabetes",
    summarizedAnswer: "",
  },
  {
    question: "If yes, please explain your diabetes:",
    type: "text",
    field: "diabetesDetails",
    summarizedAnswer: "",
    dependsOn: "diabetes",
    dependsOnValue: "yes",
  },
  {
    question: "Do you have heart disease?",
    type: "yesno",
    field: "heartDisease",
    summarizedAnswer: "",
  },
  {
    question: "If yes, please explain your heart disease:",
    type: "text",
    field: "heartDiseaseDetails",
    summarizedAnswer: "",
    dependsOn: "heartDisease",
    dependsOnValue: "yes",
  },
  {
    question: "Do you have any known allergies?",
    type: "yesno",
    field: "allergies",
    summarizedAnswer: "",
  },
  {
    question: "If yes, please explain your allergies:",
    type: "text",
    field: "allergiesDetails",
    summarizedAnswer: "",
    dependsOn: "allergies",
    dependsOnValue: "yes",
  },
  {
    question: "Do you currently smoke tobacco?",
    type: "yesno",
    field: "smokeTobacco",
    summarizedAnswer: "",
  },
  {
    question: "If yes, please explain your smoking habits:",
    type: "text",
    field: "smokingHabitsDetails",
    summarizedAnswer: "",
    dependsOn: "smokeTobacco",
    dependsOnValue: "yes",
  },
  {
    question: "Do you consume alcohol?",
    type: "yesno",
    field: "consumeAlcohol",
    summarizedAnswer: "",
  },
  {
    question: "If yes, please explain your alcohol consumption:",
    type: "text",
    field: "alcoholConsumptionDetails",
    summarizedAnswer: "",
    dependsOn: "consumeAlcohol",
    dependsOnValue: "yes",
  },
  {
    question: "Do you use recreational drugs?",
    type: "yesno",
    field: "recreationalDrugs",
    summarizedAnswer: "",
  },
  {
    question: "If yes, please explain your recreational drug use:",
    type: "text",
    field: "recreationalDrugsDetails",
    summarizedAnswer: "",
    dependsOn: "recreationalDrugs",
    dependsOnValue: "yes",
  },
  {
    question: "Have you experienced any recent weight changes?",
    type: "yesno",
    field: "weightChanges",
    summarizedAnswer: "",
  },
  {
    question: "If yes, please explain your weight changes:",
    type: "text",
    field: "weightChangesDetails",
    summarizedAnswer: "",
    dependsOn: "weightChanges",
    dependsOnValue: "yes",
  },
  {
    question: "Have you had a fever in the past month?",
    type: "yesno",
    field: "feverPastMonth",
    summarizedAnswer: "",
  },
  {
    question: "If yes, please explain your fever:",
    type: "text",
    field: "feverDetails",
    summarizedAnswer: "",
    dependsOn: "feverPastMonth",
    dependsOnValue: "yes",
  },
  {
    question: "Do you have a history of cancer?",
    type: "yesno",
    field: "cancerHistory",
    summarizedAnswer: "",
  },
  {
    question: "If yes, please explain your cancer history:",
    type: "text",
    field: "cancerHistoryDetails",
    summarizedAnswer: "",
    dependsOn: "cancerHistory",
    dependsOnValue: "yes",
  },
  {
    question: "Is there any family history of serious illness (e.g., cancer, heart disease)?",
    type: "yesno",
    field: "familyHistory",
    summarizedAnswer: "",
  },
  {
    question: "If yes, please explain your family history:",
    type: "text",
    field: "familyHistoryDetails",
    summarizedAnswer: "",
    dependsOn: "familyHistory",
    dependsOnValue: "yes",
  },
]

// Function to generate summarized answer for yes/no questions
const generateYesNoSummarizedAnswer = (question, answer) => {
  if (!answer.trim()) return "";

  const lowerAnswer = answer.toLowerCase();

  // Medical history questions
  if (question.includes("surgeries in the past")) {
    if (lowerAnswer.includes("yes") || lowerAnswer.includes("yeah") || lowerAnswer.includes("yep")) {
      return "Patient has had surgeries in the past.";
    } else if (lowerAnswer.includes("no") || lowerAnswer.includes("nope") || lowerAnswer.includes("never")) {
      return "Patient has not had any surgeries.";
    }
    return "Patient provided details about past surgeries.";
  }

  if (question.includes("hospitalized")) {
    if (lowerAnswer.includes("yes") || lowerAnswer.includes("yeah") || lowerAnswer.includes("yep")) {
      return "Patient has been hospitalized in the past.";
    } else if (lowerAnswer.includes("no") || lowerAnswer.includes("nope") || lowerAnswer.includes("never")) {
      return "Patient has never been hospitalized.";
    }
    return "Patient provided details about hospitalizations.";
  }

  if (question.includes("high blood pressure")) {
    if (lowerAnswer.includes("yes") || lowerAnswer.includes("yeah") || lowerAnswer.includes("yep")) {
      return "Patient has high blood pressure.";
    } else if (lowerAnswer.includes("no") || lowerAnswer.includes("nope") || lowerAnswer.includes("never")) {
      return "Patient does not have high blood pressure.";
    }
    return "Patient provided details about blood pressure.";
  }

  if (question.includes("diabetes")) {
    if (lowerAnswer.includes("yes") || lowerAnswer.includes("yeah") || lowerAnswer.includes("yep")) {
      return "Patient has diabetes.";
    } else if (lowerAnswer.includes("no") || lowerAnswer.includes("nope") || lowerAnswer.includes("never")) {
      return "Patient does not have diabetes.";
    }
    return "Patient provided details about diabetes.";
  }

  if (question.includes("heart disease")) {
    if (lowerAnswer.includes("yes") || lowerAnswer.includes("yeah") || lowerAnswer.includes("yep")) {
      return "Patient has heart disease.";
    } else if (lowerAnswer.includes("no") || lowerAnswer.includes("nope") || lowerAnswer.includes("never")) {
      return "Patient does not have heart disease.";
    }
    return "Patient provided details about heart disease.";
  }

  if (question.includes("allergies")) {
    if (lowerAnswer.includes("yes") || lowerAnswer.includes("yeah") || lowerAnswer.includes("yep")) {
      return "Patient has allergies.";
    } else if (lowerAnswer.includes("no") || lowerAnswer.includes("nope") || lowerAnswer.includes("never")) {
      return "Patient does not have any allergies.";
    }
    return "Patient provided details about allergies.";
  }

  if (question.includes("smoke tobacco")) {
    if (lowerAnswer.includes("yes") || lowerAnswer.includes("yeah") || lowerAnswer.includes("yep")) {
      return "Patient currently smokes tobacco.";
    } else if (lowerAnswer.includes("no") || lowerAnswer.includes("nope") || lowerAnswer.includes("never")) {
      return "Patient does not smoke tobacco.";
    }
    return "Patient provided details about smoking habits.";
  }

  if (question.includes("consume alcohol")) {
    if (lowerAnswer.includes("yes") || lowerAnswer.includes("yeah") || lowerAnswer.includes("yep")) {
      return "Patient consumes alcohol.";
    } else if (lowerAnswer.includes("no") || lowerAnswer.includes("nope") || lowerAnswer.includes("never")) {
      return "Patient does not consume alcohol.";
    }
    return "Patient provided details about alcohol consumption.";
  }

  if (question.includes("recreational drugs")) {
    if (lowerAnswer.includes("yes") || lowerAnswer.includes("yeah") || lowerAnswer.includes("yep")) {
      return "Patient uses recreational drugs.";
    } else if (lowerAnswer.includes("no") || lowerAnswer.includes("nope") || lowerAnswer.includes("never")) {
      return "Patient does not use recreational drugs.";
    }
    return "Patient provided details about recreational drug use.";
  }

  if (question.includes("weight changes")) {
    if (lowerAnswer.includes("yes") || lowerAnswer.includes("yeah") || lowerAnswer.includes("yep")) {
      return "Patient has experienced recent weight changes.";
    } else if (lowerAnswer.includes("no") || lowerAnswer.includes("nope") || lowerAnswer.includes("never")) {
      return "Patient has not experienced recent weight changes.";
    }
    return "Patient provided details about weight changes.";
  }

  if (question.includes("fever in the past month")) {
    if (lowerAnswer.includes("yes") || lowerAnswer.includes("yeah") || lowerAnswer.includes("yep")) {
      return "Patient had a fever in the past month.";
    } else if (lowerAnswer.includes("no") || lowerAnswer.includes("nope") || lowerAnswer.includes("never")) {
      return "Patient did not have a fever in the past month.";
    }
    return "Patient provided details about recent fever.";
  }

  if (question.includes("history of cancer")) {
    if (lowerAnswer.includes("yes") || lowerAnswer.includes("yeah") || lowerAnswer.includes("yep")) {
      return "Patient has a history of cancer.";
    } else if (lowerAnswer.includes("no") || lowerAnswer.includes("nope") || lowerAnswer.includes("never")) {
      return "Patient does not have a history of cancer.";
    }
    return "Patient provided details about cancer history.";
  }

  if (question.includes("family history of serious illness")) {
    if (lowerAnswer.includes("yes") || lowerAnswer.includes("yeah") || lowerAnswer.includes("yep")) {
      return "Patient has family history of serious illness.";
    } else if (lowerAnswer.includes("no") || lowerAnswer.includes("nope") || lowerAnswer.includes("never")) {
      return "Patient does not have family history of serious illness.";
    }
    return "Patient provided details about family medical history.";
  }

  // Default case for any question not specifically handled
  return answer.length > 100 ? `${answer.substring(0, 100)}...` : answer;
};

const YesNoQuestionsForm = (stopVoice) => {
  const answers = useSelector(selectAnswers)
  const [isListeningToIndex, setIsListeningToIndex] = useState(null)
  const dispatch = useDispatch()
  const { theme } = useTheme()
  const router = useRouter()
  const params = useLocalSearchParams()
  const [isListening, setIsListening] = useState(false)
  const [saving, setSaving] = useState(false)

  // Expo speech recognition events
  useSpeechRecognitionEvent("start", () => {
    setIsListening(true)
  })
  useSpeechRecognitionEvent("end", () => {
    // Do not reset the yes/no selection or hide inputs; just stop listening
    setIsListening(false)
    // Keep isListeningToIndex as-is to avoid flicker; it will be cleared on result or explicit stop
  })
  useSpeechRecognitionEvent("result", (event) => {
    if (event.results && event.results.length > 0 && isListeningToIndex !== null) {
      const t = event.results
        .map(r => r?.transcript || "")
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
      const q = yesNoQuestionsData[isListeningToIndex]
      const summarized = generateYesNoSummarizedAnswer(q.question, t)
      const globalIndex = questionsData.findIndex(qq => qq.question === q.question)
      dispatch(setAnswer({ index: globalIndex, answer: t, summarizedAnswer: summarized }))
      setIsListening(false)
      setIsListeningToIndex(null)
      if (Platform.OS === "android") {
        try { ExpoSpeechRecognitionModule.stop() } catch { }
      }
    }
  })
  useSpeechRecognitionEvent("error", () => {
    setIsListening(false)
    setIsListeningToIndex(null)
  })

  const handleAnswer = (questionIndex, answer) => {
    const question = yesNoQuestionsData[questionIndex];
    const summarized = generateYesNoSummarizedAnswer(question.question, answer);
    const globalIndex = questionsData.findIndex(qq => qq.question === question.question);
    dispatch(setAnswer({ index: globalIndex, answer: answer, summarizedAnswer: summarized }));
  };

  // Voice recognition handler
  const handleVoicePress = async (questionIndex) => {
    console.log("=== VOICE PRESSED FOR QUESTION", questionIndex, "===")

    // Toggle off if already listening to this field
    if (isListening && isListeningToIndex === questionIndex) {
      try {
        ExpoSpeechRecognitionModule.stop()
      } catch { }
      setIsListening(false)
      // Do not clear selection here
      return
    }

    setIsListeningToIndex(questionIndex)
    try {
      if (Platform.OS === "web") {
        // Web is not supported here; rely on typed input
        setIsListening(false)
        setIsListeningToIndex(null)
        return
      }
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync()
      if (!perm.granted) {
        setIsListeningToIndex(null)
        return
      }
      setIsListening(true)
      ExpoSpeechRecognitionModule.start({ lang: "en-IN", interimResults: false, continuous: false })
    } catch (err) {
      setIsListening(false)
      setIsListeningToIndex(null)
    }
  }

  // Transcript handled in result event

  const handleSubmit = async () => {
    setSaving(true)
    if (params?.fromMedicalHistory === 'true') {
      try {
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
        // Defer navigation to avoid pushing before Root Layout mounts
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
    } else {
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
          console.log("Yes/No answers saved to Firebase");
        }

        // Also save to AsyncStorage
        await AsyncStorage.setItem("userYesNoAnswers", JSON.stringify(answers));
        router.push("/(main)");
      } catch (error) {
        console.log("Error saving answers:", error);
        router.push("/(main)");
      } finally { setSaving(false) }
    }
  };

  return (
    <AnimatedBackground>
      <SafeAreaView style={styles.container}>
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
          {yesNoQuestionsData.map((question, index) => {
            // Skip rendering text questions that depend on a yes/no; they will be grouped with their parent
            if (question.type === "text" && question.dependsOn) {
              return null;
            }

            // For yes/no questions, include their dependent text (if any) inside the same card
            if (question.type === "yesno") {
              const dependentIndex = yesNoQuestionsData.findIndex(q => q.dependsOn === question.field);
              const dependentQuestion = dependentIndex !== -1 ? yesNoQuestionsData[dependentIndex] : null;
              const globalIndexForYesNo = questionsData.findIndex(qq => qq.question === question.question);
              const yesSelected = ((answers[globalIndexForYesNo]?.answer || "").toLowerCase() === "yes");

              return (
                <View key={index} style={styles.questionContainer}>
                  <View style={styles.questionHeader}>
                    <View style={styles.questionNumber}>
                        <Icon name="circle" size={8} color="black" />
                    </View>
                    <Text style={styles.questionText}>{question.question}</Text>
                  </View>

                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={[
                        styles.yesButton,
                        {
                          backgroundColor: yesSelected ? theme.primaryBtnBg : theme.secondaryBtnBg,
                          borderColor: yesSelected ? theme.primary : "transparent"
                        }
                      ]}
                      onPress={() => handleAnswer(index, "yes")}
                    >
                      <Text style={[styles.buttonText, { color: theme.btnText }]}>Yes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.noButton,
                        {
                          backgroundColor: (!yesSelected && ((answers[globalIndexForYesNo]?.answer || "") !== "")) ? theme.primaryBtnBg : theme.secondaryBtnBg,
                          borderColor: (!yesSelected && ((answers[globalIndexForYesNo]?.answer || "") !== "")) ? theme.primary : "transparent"
                        }
                      ]}
                      onPress={() => handleAnswer(index, "no")}
                    >
                      <Text style={[styles.buttonText, { color: theme.btnText }]}>No</Text>
                    </TouchableOpacity>
                  </View>

                  {dependentQuestion && yesSelected && (
                    <View style={[styles.inputContainer, { marginTop: 12 }]}>
                      <View style={styles.inputRow}>
                        <TextInput
                          style={styles.input}
                          placeholder="Type your details"
                          placeholderTextColor="#999"
                          value={answers[questionsData.findIndex(qq => qq.question === dependentQuestion.question)]?.answer || ""}
                          onChangeText={(text) => {
                            const summarized = generateYesNoSummarizedAnswer(dependentQuestion.question, text);
                            const globalIndex = questionsData.findIndex(qq => qq.question === dependentQuestion.question);
                            dispatch(setAnswer({ index: globalIndex, answer: text, summarizedAnswer: summarized }));
                          }}
                        />
                        {/* {(isListeningToIndex === dependentIndex) ? (
                          <TouchableOpacity
                            style={[
                              styles.voiceButton,
                              styles.voiceButtonListening
                            ]}
                            // onPress={() => stopVoice()}
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
                            onPress={() => handleVoicePress(dependentIndex)}
                          >
                            <MaterialCommunityIcons
                              name="microphone-outline"
                              size={20}
                              color={theme.primary}
                            />
                          </TouchableOpacity>
                        )} */}
                      </View>
                      {(isListeningToIndex === dependentIndex) && (
                        <Text style={styles.listeningText}>
                          🎤 Listening... Speak now (press stop icon when done)
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              );
            }

            // Render standalone text questions (no dependency) as their own container
            return (
              <View key={index} style={styles.questionContainer}>
                <View style={styles.questionHeader}>
                  <View style={styles.questionNumber}>
                    <Text style={styles.questionNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.questionText}>{question.question}</Text>
                </View>
                <View style={[styles.inputContainer, { marginTop: 8 }]}>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.input}
                      placeholder="Type your details"
                      placeholderTextColor="#999"
                      value={answers[questionsData.findIndex(qq => qq.question === question.question)]?.answer || ""}
                      onChangeText={(text) => {
                        const summarized = generateYesNoSummarizedAnswer(question.question, text);
                        const globalIndex = questionsData.findIndex(qq => qq.question === question.question);
                        dispatch(setAnswer({ index: globalIndex, answer: text, summarizedAnswer: summarized }));
                      }}
                    />
                    {(isListeningToIndex === index) ? (
                      <TouchableOpacity
                        style={[
                          styles.voiceButton,
                          styles.voiceButtonListening
                        ]}
                        onPress={() => stopVoice()}
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
                    )}
                  </View>
                  {(isListeningToIndex === index) && (
                    <Text style={styles.listeningText}>
                      🎤 Listening... Speak now (press stop icon when done)
                    </Text>
                  )}
                </View>
              </View>
            );
          })}

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <TouchableOpacity
              style={[styles.submitBtn, saving && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={saving}
            >
              <Text style={styles.submitBtnText}>
                {saving ? 'Saving...' : (params?.fromMedicalHistory === 'true' ? 'Save and Return' : 'Complete Registration')}
              </Text>
              {saving ? (
                <ActivityIndicator style={{ marginLeft: 8 }} size={20} color="#fff" />
              ) : (
                <Icon name="check" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AnimatedBackground>
  )
}

export default YesNoQuestionsForm

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 0,
    paddingTop: 10,
    paddingBottom: 20,
  },
  questionContainer: {
    width: "90%",
    marginBottom: 20,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
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
  questionText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#222",
    flex: 1,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 16,
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
  input: {
    flex: 1,
    fontSize: 16,
    color: "#222",
    paddingVertical: 8,
    backgroundColor: "transparent",
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
  listeningText: {
    color: "#ff4444",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
    fontStyle: "italic",
  },
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    gap: 12,
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
    elevation: 2, // Android
    shadowColor: "#000", // iOS shadow
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

  yesButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  noButton: {
    flex: 1,
    backgroundColor: "#f44336",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedButton: {
    borderColor: "#6B705B",
    backgroundColor: "#6B705B",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  selectedButtonText: {
    color: "#fff",
  },
  submitContainer: {
    width: "90%",
    marginTop: 30,
    marginBottom: 20,
    alignItems: "center",
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