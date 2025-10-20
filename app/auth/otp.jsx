import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useRef, useState, useEffect } from "react";
import PrimaryButton from "../components/PrimaryButton";
import TitleText from "../components/TitleText";
import SubText from "../components/SubText";
import AnimatedBackground from "../components/AnimatedBackground";
import { firebaseAuth } from '../config/firebase';
import { getFirestore, doc, getDoc, deleteDoc, setDoc } from 'firebase/firestore';

const OTPDigits = ["", "", "", "", "", ""]; // Changed to 6 digits

const OTP = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const inputs = useRef([]);

  const [OTP, setOTP] = useState(OTPDigits);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Initialize Firestore
  const db = getFirestore();

  useEffect(() => {
    if (params.email) {
      setEmail(params.email);
    }
  }, [params.email]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const verifyOTPAndCreateAccount = async (otp) => {
    setLoading(true);
    try {
      // Get OTP from Firestore
      const otpRef = doc(db, 'otps', email);
      const otpDoc = await getDoc(otpRef);

      if (!otpDoc.exists()) {
        Alert.alert("Error", "OTP not found. Please request a new OTP.");
        return;
      }

      const otpData = otpDoc.data();
      
      // Check if OTP is expired
      if (new Date() > otpData.expiresAt.toDate()) {
        Alert.alert("Error", "OTP has expired. Please request a new OTP.");
        await deleteDoc(otpRef);
        return;
      }

      // Verify OTP
      if (otpData.otp !== otp) {
        Alert.alert("Error", "Invalid OTP. Please try again.");
        return;
      }

      // OTP is valid, create account
      const { createUserWithEmailAndPassword, sendEmailVerification } = await import('firebase/auth');
      
      const userCredential = await createUserWithEmailAndPassword(
        firebaseAuth, 
        email, 
        otpData.password
      );
      
      const user = userCredential.user;
      
      // Send email verification
      await sendEmailVerification(user);
      
      // Delete OTP from Firestore
      await deleteDoc(otpRef);
      
      Alert.alert(
        "Success!",
        "Account created successfully! Please check your email for verification.",
        [
          {
            text: "OK",
            onPress: () => router.push("/auth/signup-success")
          }
        ]
      );
    } catch (error) {
      let errorMessage = "An error occurred during account creation";
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "This email is already registered. Please try logging in instead.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Please enter a valid email address.";
          break;
        case 'auth/weak-password':
          errorMessage = "Password is too weak. Please choose a stronger password.";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Network error. Please check your internet connection.";
          break;
        default:
          errorMessage = error.message || "An error occurred during account creation";
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    const fullOTP = OTP.join("");
    if (fullOTP.length === 6 && /^\d{6}$/.test(fullOTP)) {
      verifyOTPAndCreateAccount(fullOTP);
    } else {
      Alert.alert("Error", "Please enter a valid 6-digit code.");
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setLoading(true);
    try {
      // Generate new OTP
      const newOTP = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store new OTP in Firestore
      const otpRef = doc(db, 'otps', email);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      await setDoc(otpRef, {
        otp: newOTP,
        email: email,
        createdAt: new Date(),
        expiresAt: expiresAt
      });
      
      console.log(`New OTP ${newOTP} sent to ${email}`);
      
      Alert.alert("OTP Resent", "A new 6-digit code has been sent to your email.");
      
      // Reset countdown
      setCountdown(60);
      setCanResend(false);
      setOTP(OTPDigits);
      inputs.current[0].focus();
    } catch (error) {
      Alert.alert("Error", "Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTyping = (text, index) => {
    if (/^\d?$/.test(text)) {
      const newOTP = [...OTP];
      newOTP[index] = text;
      setOTP(newOTP);
      if (text) {
        if (index < 5) {
          inputs.current[index + 1].focus();
        } else {
          const isComplete = newOTP.every((val) => val.length === 1);
          if (isComplete) {
            inputs.current[index].blur();
            handleSubmit();
          }
        }
      } else if (!text && index > 0) {
        inputs.current[index - 1].focus();
      }
    }
  };

  return (
    <AnimatedBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flex: 1, justifyContent: "center" }}>
            <TitleText style={styles.title} title="OTP Verification" />
            <SubText style={styles.text} textContent={`Enter the code sent to ${email}`} />
            <View style={styles.form}>
              <View style={styles.otpContainer}>
                {OTP.map((digit, index) => (
                  <TextInput
                    key={index}
                    style={styles.otpInput}
                    value={digit}
                    onChangeText={(text) => handleTyping(text, index)}
                    keyboardType="numeric"
                    maxLength={1}
                    ref={(input) => (inputs.current[index] = input)}
                    textAlign="center"
                    placeholder=""
                    placeholderTextColor="#fff"
                    editable={!loading}
                  />
                ))}
              </View>
              <TouchableOpacity 
                onPress={handleResend} 
                style={[styles.resendWrapper, !canResend && styles.resendDisabled]}
                disabled={!canResend || loading}
              >
                <Text style={[styles.resendText, !canResend && styles.resendTextDisabled]}>
                  {canResend ? "Resend code" : `Resend in ${countdown}s`}
                </Text>
              </TouchableOpacity>
              <PrimaryButton
                title={loading ? "Verifying..." : "Verify & Create Account"}
                pressFunction={handleSubmit}
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                disabled={loading}
              />
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AnimatedBackground>
  );
};

export default OTP;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { 
    flexGrow: 1, 
    padding: 20,
    paddingBottom: 40,
  },
  title: { textAlign: "center", fontSize: 40, marginBottom: 10, fontWeight: "400" },
  text: { textAlign: "center", fontSize: 24, marginBottom: 40, fontWeight: "300" },
  form: { gap: 30, alignItems: "center", width: "100%" },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    width: 240,
    maxWidth: "100%",
    gap: 16,
    marginBottom: 30,
  },
  otpInput: {
    width: 56,
    height: 56,
    aspectRatio: 1,
    backgroundColor: "rgba(107, 112, 91, 0.35)",
    borderRadius: 16,
    fontSize: 28,
    textAlign: "center",
    color: "#fff",
    borderWidth: 0,
    marginHorizontal: 0,
  },
  resendWrapper: { marginBottom: 10, alignSelf: "center" },
  resendText: { fontSize: 18, color: "#3b4a4a", textAlign: "center", opacity: 0.8, textDecorationLine: "underline" },
  resendDisabled: { opacity: 0.5 },
  resendTextDisabled: { opacity: 0.5, textDecorationLine: "none" },
  submitBtn: {
    borderRadius: 24,
    marginTop: 10,
    paddingVertical: 20,
    backgroundColor: "rgba(107, 112, 91, 0.7)",
    width: "100%",
    alignSelf: "center",
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
});
