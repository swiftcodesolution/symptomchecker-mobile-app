import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView, // <-- add this
  Platform, // <-- add this
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { useRouter } from "expo-router";
import { useState } from "react";
import PrimaryButton from "../components/PrimaryButton";
import TitleText from "../components/TitleText";
import SubText from "../components/SubText";
import { MaterialIcons, AntDesign, FontAwesome } from '@expo/vector-icons';
import AnimatedBackground from "../components/AnimatedBackground";
import { toast } from 'sonner-native';

import { firebaseAuth, firestore } from '../config/firebase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithCredential, GoogleAuthProvider, updateProfile } from 'firebase/auth';
import { storeUserDataInFirestore } from '../utils/userUtils';

const Signup = () => {
  const { theme } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Google Sign-In function
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    
    try {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices();
      
      // Get the users ID token
      const { idToken } = await GoogleSignin.signIn();
      
      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(idToken);
      
      // Sign-in the user with the credential
      const userCredential = await signInWithCredential(firebaseAuth, googleCredential);
      const user = userCredential.user;
      
      // Store user data in Firestore
      await storeUserDataInFirestore(user, { provider: 'google' });
      
      // Save login state
      await AsyncStorage.setItem('isLoggedIn', 'true');
      await AsyncStorage.setItem('userEmail', user.email);
      
      toast('Google Sign-In successful!');
      
      // Navigate to user info collection or main app
      setTimeout(() => {
        router.push("/collect-user-info");
      }, 1200);
      
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      let errorMessage = "Google Sign-In failed. Please try again.";
      
      if (error.code === 'SIGN_IN_CANCELLED') {
        errorMessage = "Sign-in was cancelled.";
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        errorMessage = "Google Play Services not available.";
      } else if (error.code === 'INVALID_ACCOUNT') {
        errorMessage = "Invalid account.";
      }
      
      toast(errorMessage);
      Alert.alert('Google Sign-In Error', errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!name.trim()) {
     newErrors.name = "Name is required";
   } else if (name.trim().length < 2) {
       newErrors.name = "Name must be at least 2 characters";
   }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // New signup handler (no OTP)
  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (!firebaseAuth) {
        throw new Error('Firebase is not properly initialized. Please check your configuration.');
      }
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      await updateProfile(userCredential.user, { displayName: name.trim() });
      
      // Store user data in Firestore
      await storeUserDataInFirestore(userCredential.user, { provider: 'email' });
      
      toast('Signup successful! Please log in.');
      setTimeout(() => {
        router.push("/collect-user-info");
      }, 120);
    } catch (error) {
      console.error("Signup Error:", error);

    let errorMessage = "An error occurred during signup.";
    const newErrors = {};

    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = "This email is already registered. Please log in instead.";
        newErrors.email = errorMessage;
        break;
      case 'auth/invalid-email':
        errorMessage = "Please enter a valid email address.";
        newErrors.email = errorMessage;
        break;
      case 'auth/weak-password':
        errorMessage = "Password should be at least 6 characters.";
        newErrors.password = errorMessage;
        break;
      case 'auth/network-request-failed':
        errorMessage = "Network error. Please check your internet connection.";
        break;
      default:
        errorMessage = error.message || errorMessage;
    }

    setErrors(newErrors); // 👈 error ko state me set karna
    toast(errorMessage);  
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedBackground>
      <SafeAreaView style={[styles.container]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.innerContent}>
              <TitleText style={styles.title} title="Create an account" />
              <SubText style={styles.text} textContent="Welcome to Symptoms Checker App" />
              
              {/* Social Sign-Up Buttons */}
              {/* <View style={styles.socialContainer}>
                <TouchableOpacity 
                  style={[styles.socialBtn, googleLoading && styles.socialBtnDisabled]} 
                  onPress={handleGoogleSignIn}
                  disabled={googleLoading}
                >
                  {googleLoading ? (
                    <ActivityIndicator color="#6B705B" size="small" />
                  ) : (
                    <AntDesign name="google" size={24} color="#6B705B" style={styles.socialIcon} />
                  )}
                  <Text style={styles.socialBtnText}>
                    {googleLoading ? 'Signing up...' : 'Sign Up With Google'}
                  </Text>
                </TouchableOpacity>
                {Platform.OS === 'ios' && (
                  <TouchableOpacity style={styles.socialBtn}>
                    <FontAwesome name="apple" size={24} color="#6B705B" style={styles.socialIcon} />
                    <Text style={styles.socialBtnText}>Sign Up With Apple</Text>
                  </TouchableOpacity>
                )}
              </View> */}
              
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.divider} />
              </View>
              
              <View style={styles.form}>
              <View style={styles.inputWrapper}>
  <MaterialIcons name="person" size={24} color="#fff" style={styles.inputIcon} />
  <TextInput
    style={[styles.input, { color: theme.btnText }]}
    placeholder="Full Name"
    placeholderTextColor={theme.btnText}
    value={name}
    onChangeText={(text) => {
      setName(text);
      if (errors.name) setErrors({ ...errors, name: null });
    }}
    autoCapitalize="words"
    editable={!loading}
    returnKeyType="next"
  />
</View>
{errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

                <View style={styles.inputWrapper}>
                  <MaterialIcons name="email" size={24} color="#fff" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.btnText }]}
                    placeholder="Email"
                    placeholderTextColor={theme.btnText}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errors.email) setErrors({...errors, email: null});
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                <View style={styles.inputWrapper}>
                  <MaterialIcons name="lock" size={24} color="#fff" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.btnText }]}
                    placeholder="Password"
                    placeholderTextColor={theme.btnText}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) setErrors({...errors, password: null});
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                <View style={styles.inputWrapper}>
                  <MaterialIcons name="lock" size={24} color="#fff" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.btnText }]}
                    placeholder="Re Type Password"
                    placeholderTextColor={theme.btnText}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (errors.confirmPassword) setErrors({...errors, confirmPassword: null});
                    }}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                    <MaterialIcons name={showConfirmPassword ? "visibility" : "visibility-off"} size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

                <View>
                  <PrimaryButton
                    title={loading ? "Signing up..." : "Sign Up"}
                    pressFunction={handleSignup}
                    style={[styles.emailBtn, { backgroundColor: theme.primaryBtnBg }]}
                    disabled={loading}
                  />
                  {loading && (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#fff" />
                    </View>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.footer}>
              <TouchableOpacity onPress={() => router.push("/auth/login")} disabled={loading}> 
                <Text style={styles.footerText}>
                  Already Have an Account? <Text style={styles.footerLink}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AnimatedBackground>
  );
};

export default Signup;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { 
    flexGrow: 1, 
    justifyContent: "center", 
    padding: 20,
    paddingBottom: 40,
  },
  innerContent: { flex: 1, justifyContent: "center" },
  title: { textAlign: "center", marginBottom: 20 },
  text: { textAlign: "center", marginBottom: 40 },
  socialContainer: { marginBottom: 20 },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#222',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#A3A38080',
  },
  socialBtnDisabled: {
    opacity: 0.6,
  },
  socialIcon: { marginRight: 10 },
  socialBtnText: { color: '#222', fontSize: 16, fontWeight: '500' },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#6B705B',
    opacity: 0.3,
  },
  dividerText: {
    color: '#6B705B',
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 16,
  },
  form: { gap: 18 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(107, 112, 91, 0.5)",
    borderRadius: 24,
    paddingHorizontal: 18,
    marginBottom: 0,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    paddingVertical: 20,
    fontSize: 18,
  },
  eyeIcon: { padding: 4, marginLeft: 6 },
  emailBtn: { borderRadius: 24, marginTop: 18, paddingVertical: 20 },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 18,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  footer: { alignItems: "center", marginBottom: 20 },
  footerText: { color: "#363A3A", fontSize: 16, textAlign: "center", opacity: 0.9 },
  footerLink: { color: "#363A3A", textDecorationLine: "underline", fontWeight: "bold" },
});
