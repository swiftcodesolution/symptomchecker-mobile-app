import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { useRouter } from "expo-router";
import { useState } from "react";
import PrimaryButton from "../components/PrimaryButton";
import TitleText from "../components/TitleText";
import SubText from "../components/SubText";
import { MaterialIcons } from '@expo/vector-icons';
import { firebaseAuth } from "../config/firebase";
import { sendPasswordResetEmail, fetchSignInMethodsForEmail, signInWithEmailAndPassword } from "firebase/auth";

const ForgotPassword = () => {
  const { theme } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const checkIfEmailExists = async (email) => {
    try {
      console.log("Checking email:", email);
      
      // Method 1: Try fetchSignInMethodsForEmail first
      try {
        const methods = await fetchSignInMethodsForEmail(firebaseAuth, email);
        console.log("Sign-in methods:", methods);
        return methods && methods.length > 0;
      } catch (fetchError) {
        console.log("fetchSignInMethodsForEmail failed:", fetchError);
        
        // Method 2: Try to sign in with dummy password (this will fail but tell us if user exists)
        try {
          await signInWithEmailAndPassword(firebaseAuth, email, "dummy_wrong_password");
          // This line should never execute if password is wrong
          return true;
        } catch (signInError) {
          console.log("Sign in error code:", signInError.code);
          
          // If error is "auth/user-not-found", email doesn't exist
          // If error is "auth/wrong-password", email exists but password is wrong
          if (signInError.code === 'auth/user-not-found') {
            return false;
          } else if (signInError.code === 'auth/wrong-password') {
            return true;
          } else {
            // For other errors, assume email exists (security measure)
            console.log("Other error, assuming email exists");
            return true;
          }
        }
      }
      
    } catch (error) {
      console.error("Error checking email:", error);
      // If we can't check properly, use the security-first approach
      // Don't reveal whether email exists or not
      return true;
    }
  };

  const handleForgotPassword = async () => {
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!firebaseAuth) {
      setError("Authentication service is not available. Please try again later.");
      return;
    }

    setLoading(true);

    try {
      const emailExists = await checkIfEmailExists(email.trim());
      console.log("Email exists result:", emailExists);
      
      if (!emailExists) {
        setError("No account found with this email address. Please check your email or sign up.");
        setLoading(false);
        return;
      }

      // If email exists, send the reset email
      await sendPasswordResetEmail(firebaseAuth, email.trim());
      
      Alert.alert(
        "Check Your Email",
        "If an account exists with this email address, you will receive password reset instructions shortly.",
        [
          {
            text: "OK",
            onPress: () => router.back()
          }
        ]
      );
      
    } catch (error) {
      console.error("Password reset error:", error);
      
      switch (error.code) {
        case 'auth/invalid-email':
          setError("The email address is not valid.");
          break;
        case 'auth/user-not-found':
          // Don't reveal that user doesn't exist (security)
          setError("If an account exists with this email, you will receive reset instructions.");
          break;
        case 'auth/too-many-requests':
          setError("Too many attempts. Please try again later.");
          break;
        case 'auth/network-request-failed':
          setError("Network error. Please check your internet connection.");
          break;
        case 'auth/operation-not-allowed':
          setError("Password reset is not enabled. Please contact support.");
          break;
        default:
          setError("Failed to send reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => router.back()}
            disabled={loading}
          >
            <MaterialIcons name="arrow-back" size={28} color={theme.text} />
          </TouchableOpacity>
          
          <View style={styles.innerContent}>
            <TitleText style={styles.title} title="Forgot Password?" />
            <SubText 
              style={styles.text} 
              textContent="Enter your email address to receive password reset instructions." 
            />
            
            {error ? (
              <View style={[styles.errorContainer, { 
                backgroundColor: error.includes("If an account exists") ? theme.infoBg : theme.errorBg 
              }]}>
                <MaterialIcons 
                  name={error.includes("If an account exists") ? "info-outline" : "error-outline"} 
                  size={20} 
                  color={error.includes("If an account exists") ? theme.infoText : theme.errorText} 
                />
                <Text style={[styles.errorText, { 
                  color: error.includes("If an account exists") ? theme.infoText : theme.errorText 
                }]}>
                  {error}
                </Text>
              </View>
            ) : null}

            <View style={styles.form}>
              <View style={[styles.inputWrapper, error && styles.inputError]}>
                <MaterialIcons 
                  name="email" 
                  size={22} 
                  color={error ? theme.errorText : theme.btnText} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={[styles.input, { color: theme.btnText }]}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.btnText}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError("");
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!loading}
                />
              </View>
              
              <PrimaryButton
                title={loading ? "Checking..." : "Reset password"}
                pressFunction={handleForgotPassword}
                style={[
                  styles.emailBtn, 
                  { 
                    backgroundColor: loading ? theme.disabled : theme.primaryBtnBg,
                    opacity: loading ? 0.7 : 1
                  }
                ]}
                disabled={loading}
              />
              
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={theme.text} />
                  <Text style={[styles.loadingText, { color: theme.text }]}>
                    Checking email...
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPassword;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'transparent' 
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: { 
    flexGrow: 1, 
    padding: 20,
    paddingBottom: 40,
  },
  backBtn: { 
    marginTop: 10, 
    marginBottom: 10, 
    alignSelf: 'flex-start' 
  },
  innerContent: { 
    flex: 1, 
    justifyContent: 'center' 
  },
  title: { 
    textAlign: 'center', 
    fontSize: 38, 
    fontWeight: '400', 
    marginBottom: 20 
  },
  text: { 
    textAlign: 'center', 
    fontSize: 18, 
    marginBottom: 20 
  },
  form: { 
    gap: 18 
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(107, 112, 91, 0.5)',
    borderRadius: 24,
    paddingHorizontal: 18,
    marginBottom: 0,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  inputIcon: { 
    marginRight: 10 
  },
  input: {
    flex: 1,
    paddingVertical: 20,
    fontSize: 18,
  },
  emailBtn: { 
    borderRadius: 24, 
    marginTop: 18, 
    paddingVertical: 20 
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  loadingText: {
    fontSize: 14,
  },
});