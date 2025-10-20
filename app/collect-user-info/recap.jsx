"use client"

import { StyleSheet, View, ScrollView, Text, ActivityIndicator } from "react-native"
import RecapCard from "../components/RecapCard"
import { questionsData } from "./index"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from "../theme/ThemeContext"
import TitleText from "../components/TitleText"
import SubText from "../components/SubText"
import PrimaryButton from "../components/PrimaryButton"
import { useRouter } from "expo-router"
import AnimatedBackground from "../components/AnimatedBackground"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { selectAnswers } from "../redux/slices/userInfoSlice"
import { setCurrentIndex } from "../redux/slices/userInfoSlice"
import { firebaseAuth, firestore } from "../config/firebase"
import { doc, setDoc } from "firebase/firestore"
import { toast } from "sonner-native"

const Recap = () => {
  const { theme } = useTheme()
  const router = useRouter()
  const [userAnswers, setUserAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const answerss = useSelector(selectAnswers)
  const dispatch = useDispatch()

  useEffect(() => {
    const loadUserAnswers = async () => {
      try {
        const savedAnswers = await AsyncStorage.getItem("userPersonalInfo")
        if (savedAnswers) {
          setUserAnswers(JSON.parse(savedAnswers))
        }
      } catch (error) {
        console.error("Error loading user answers:", error)
      } finally {
        setLoading(false)
      }
    }
    loadUserAnswers()
  }, [])

  // Create answers array based on actual user data
  const convertAnswersToArray = (answersObj) => {
    if (!answersObj) return [];
    
    const answersArray = [];
    // Get all keys and sort them numerically
    const keys = Object.keys(answersObj).sort((a, b) => parseInt(a) - parseInt(b));
    
    for (const key of keys) {
      answersArray[parseInt(key)] = answersObj[key];
    }
    
    // Fill in empty slots for unanswered questions
    for (let i = 0; i < questionsData.length; i++) {
      if (!answersArray[i]) {
        answersArray[i] = {
          answer: "",
          summarizedAnswer: ""
        };
      }
    }
    
    return answersArray;
  };

  // Create answers array based on actual user data
  const answers = questionsData.map((question, index) => {
    const answerItem = answerss[index] || {}
    return {
      question: questionsData[index].question, // Use the question from questionsData
      hasAnswer: !!answerItem.answer && answerItem.answer.trim() !== "",
      answer: answerItem.answer || "",
      summarizedAnswer: answerItem.summarizedAnswer || "",
    }
  })

  const editAnswer = (index) => {
    dispatch(setCurrentIndex(index))
    // Pass edit parameter to indicate edit mode
    router.push(`/collect-user-info?edit=true`)
  }

  const handleDone = async () => {
    try {
      setSaving(true)
  
      // Show saving toast
      toast("Saving your information...")
      
      try {
        // Get current authenticated user
        const user = firebaseAuth.currentUser
        if (!user) {
          // Save locally only if not authenticated
          await AsyncStorage.setItem("personalInfo", "completed")
          await AsyncStorage.setItem("userPersonalInfo", JSON.stringify(answerss))
          toast("Information saved locally. Please login to sync with cloud.")
          router.push("/(main)")
          return
        }

        // Ensure user is fully authenticated with token
        const token = await user.getIdToken(true)
        if (!token) {
          throw new Error("Authentication token not available")
        }

        // Convert answers object to array
        const answersArray = convertAnswersToArray(answerss)
        
        // Prepare data for Firestore - only include necessary fields
        const userData = {
          answers: answersArray,
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        // Save to Firestore with proper error handling
        try {
          const userDocRef = doc(firestore, "users", user.uid)
          await setDoc(userDocRef, userData, { merge: true })
          toast("Your information has been saved successfully!")
        } catch (firestoreError) {
          console.error("Firestore error:", firestoreError)
          
          // Save locally if Firebase fails
          await AsyncStorage.setItem("personalInfo", "completed")
          await AsyncStorage.setItem("userPersonalInfo", JSON.stringify(answerss))
          
          if (firestoreError.code === "permission-denied") {
            toast("Saved locally. Cloud sync failed due to permission issues.")
          } else {
            toast("Saved locally. Cloud sync will retry later.")
          }
        }
        
        // Mark as completed in AsyncStorage
        await AsyncStorage.setItem("personalInfo", "completed")
        
        // Navigate after save attempt
        router.push("/(main)")
      } catch (error) {
        console.error("Error saving personal info:", error)
        toast("Saved locally. Please try again later for cloud sync.")

        // Save to local storage for later sync
        try {
          const retryData = {
            answers: answerss || {},
            timestamp: new Date().toISOString(),
            needsSync: true,
          }
          await AsyncStorage.setItem("pendingUserData", JSON.stringify(retryData))
          await AsyncStorage.setItem("personalInfo", "completed")
          
          // Navigate even if cloud save failed
          router.push("/(main)")
        } catch (localError) {
          console.error("Failed to save locally:", localError)
        }
      } finally {
        setSaving(false)
      }
    } catch (error) {
      console.error("Error in handleDone:", error)
      toast("An error occurred. Please try again.")
      setSaving(false)
    }
  }

  return (
    <AnimatedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: "transparent" }]}>
        <View>
          <TitleText style={styles.title} title="Complete Registration" />
          <SubText
            style={styles.text}
            textContent="Fill out your information to get started with the app."
          />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={{ alignItems: "center", justifyContent: "center", paddingVertical: 20 }}>
          <PrimaryButton
            title={saving ? "Saving..." : "Done"}
            pressFunction={handleDone}
            style={[styles.formButton, { opacity: saving ? 0.7 : 1 }]}
          />
          {saving && (
            <View style={{ marginTop: 12 }}>
              <ActivityIndicator size="small" color="#6B705B" />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </AnimatedBackground>
  )
}

export default Recap

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", gap: 40, padding: 20 },
  title: { textAlign: "center", marginBottom: 20 },
  text: { textAlign: "center", marginBottom: 0 },
  scrollView: {},
  formSelection: { gap: 18, marginVertical: 20 },
  formCard: {
    backgroundColor: "#e2ded6",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#222",
    marginBottom: 8,
    textAlign: "center",
  },
  formDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  formButton: {
    backgroundColor: "#6B705B",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 200,
  },
  skipText: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    marginBottom: 12,
    fontStyle: "italic",
  },
  skipButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
})
