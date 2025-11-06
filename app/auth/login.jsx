import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image, ScrollView, Platform, ActivityIndicator, Modal, Dimensions, KeyboardAvoidingView } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import PrimaryButton from "../components/PrimaryButton";
import AnimatedBackground from "../components/AnimatedBackground";
import { MaterialIcons, AntDesign, FontAwesome } from '@expo/vector-icons';
import TitleText from "../components/TitleText";
import CustomAlert from "../components/CustomAlert";
import * as LocalAuthentication from 'expo-local-authentication';
import { firebaseAuth, firestore } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { signInWithCredential, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { storeUserDataInFirestore, checkUserOnboardingStatus } from '../utils/userUtils';

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { toast } from 'sonner-native';

const { width, height } = Dimensions.get('window');

// Function to scale sizes based on screen dimensions
const scale = (size) => (width / 375) * size; // 375 is the base width (iPhone 6/7/8)
const verticalScale = (size) => (height / 812) * size; 


GoogleSignin.configure({
  webClientId : '920643427452-5833i3ad01k6so9l4s336qgots23m1bq.apps.googleusercontent.com',
});

const getFriendlyErrorMessage = (error) => {
  if (!error) return "Something went wrong. Please try again.";
  
  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-email':
      return "Invalid email or password. Please try again.";
    case 'auth/user-not-found':
      return "No account found with this email.";
    case 'auth/wrong-password':
      return "Incorrect password. Please try again.";
    case 'auth/too-many-requests':
      return "Too many attempts. Please try again later.";
    case 'auth/network-request-failed':
      return "Network error. Please check your internet connection.";
    case 'sign_in_cancelled':
      return "Sign-in was cancelled.";
    case 'sign_in_required':
      return "Sign-in is required.";
    case 'play_services_not_available':
      return "Google Play Services not available.";
    case 'INVALID_ACCOUNT':
      return "Invalid account selected.";
    default:
      return "Login failed. Please try again.";
  }
};

const Login = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [error, setError] = useState("");
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState("");
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', type: 'info' });

  // Helper function to show alerts
  const showAlert = (title, message, type = 'info') => {
    setAlert({ visible: true, title, message, type });
  };

  const hideAlert = () => {
    setAlert({ visible: false, title: '', message: '', type: 'info' });
  };

  // Check biometric status on component mount
  useEffect(() => {
    const checkBiometricStatus = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
        const biometricFlag = await AsyncStorage.getItem('biometricEnabled');

        setBiometricAvailable(hasHardware && isEnrolled);
        setBiometricEnabled(biometricFlag === 'true');

        // Determine biometric type for better UX
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType("Biometric");
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType("Biometric");
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          setBiometricType("Biometric");
        } else {
          setBiometricType("Biometric");
        }
      } catch (error) {
        console.error('Error checking biometric status:', error);
        setBiometricAvailable(false);
        setBiometricEnabled(false);
      }
    };

    checkBiometricStatus();
    
    // Test alert on component mount
   
  }, []);

  // Auto-trigger biometric login if enabled and available
  useEffect(() => {
    const autoTriggerBiometric = async () => {
      if (biometricAvailable && biometricEnabled && !loading && !googleLoading) {
        const autoLogin = await AsyncStorage.getItem('autoLoginWithBiometric');
        if (autoLogin === 'true') {
          // Small delay to ensure UI is ready
          setTimeout(() => {
            handleBiometricAuth();
          }, 500);
        }
      }
    };

    autoTriggerBiometric();
  }, [biometricAvailable, biometricEnabled]);

  // Enhanced Google Sign-In function with better error handling
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError("")

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            
      await GoogleSignin.signOut()
      const userInfo = await GoogleSignin.signIn()
      const { idToken } = userInfo

      if (!idToken) {
        throw new Error("No ID token received from Google Sign-In")
      }

      const googleCredential = GoogleAuthProvider.credential(idToken)

      const userCredential = await signInWithCredential(firebaseAuth, googleCredential)
      const user = userCredential.user

      console.log("Firebase sign-in successful:", user.uid)
      await storeUserDataInFirestore(user, { provider: "google" })
      await AsyncStorage.setItem("isLoggedIn", "true")
      await AsyncStorage.setItem("userEmail", user.email || "")
      toast('Login successful!')
      await checkPersonalInfoAndNavigate()
    } 
    catch (error) {
      console.error("Google Sign-In Error:", error)

      let errorMessage = "Google Sign-In failed. Please try again."

      if (error.code === "sign_in_cancelled") {
        errorMessage = "Sign-in was cancelled."
      } else if (error.code === "sign_in_required") {
        errorMessage = "Sign-in is required."
      } else if (error.code === "play_services_not_available") {
        errorMessage = "Google Play Services not available."
      } else if (error.code === "INVALID_ACCOUNT") {
        errorMessage = "Invalid account selected."
      } else if (error.message?.includes("DEVELOPER_ERROR")) {
        
      } else if (error.message?.includes("network")) {
        errorMessage = "Network error. Please check your internet connection."
      }

      setError(errorMessage)
      toast(errorMessage)

      // Only show alert for non-cancellation errors
      if (error.code !== "sign_in_cancelled") {
        showAlert("Error", errorMessage, "error")
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      const msg = "Please enter both email and password.";
      setError(msg);
      showAlert("Warning", msg, "warning");
      toast(msg)
      return;
    }

    setLoading(true);

    try {
      if (!firebaseAuth) {
        throw new Error('Firebase is not properly initialized. Please check your configuration.');
      }

      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      
      await storeUserDataInFirestore(userCredential.user, { provider: 'email' });
      await AsyncStorage.setItem('isLoggedIn', 'true');
      await AsyncStorage.setItem('userEmail', email);

      showAlert("Success", "Login successful! Welcome back!", "success");
      toast('Login successful!')

      // Only show biometric prompt if biometric is available and not already enabled
      if (biometricAvailable && !biometricEnabled) {
        setShowBiometricPrompt(true);
      } else {
        await checkPersonalInfoAndNavigate();
      }
    } 
    catch (error) {
        console.error("Login Error:", error);
      const errorMessage = getFriendlyErrorMessage(error);
      setError(errorMessage);
      toast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableBiometric = async () => {
    try {
      // Store encrypted credentials securely
      await AsyncStorage.setItem('biometricEnabled', 'true');
      await AsyncStorage.setItem('biometricEmail', email);
      await AsyncStorage.setItem('biometricPassword', password);
      await AsyncStorage.setItem('autoLoginWithBiometric', 'true');

      setBiometricEnabled(true);
      setShowBiometricPrompt(false);

      showAlert("Success", `${biometricType} login has been enabled successfully!`, "success");

      await checkPersonalInfoAndNavigate();
    } catch (error) {
      console.error('Error enabling biometric:', error);
      showAlert("Error", "Failed to enable biometric login. Please try again.", "error");
    }
  };

  const handleSkipBiometric = async () => {
    setShowBiometricPrompt(false);
    await checkPersonalInfoAndNavigate();
  };

  const checkPersonalInfoAndNavigate = async () => {
    try {
      const user = firebaseAuth.currentUser;
      if (user) {
        const hasCompletedOnboarding = await checkUserOnboardingStatus(user.uid);
        if (hasCompletedOnboarding) {
          router.push("/(main)");
          return;
        }
      }
      router.push("/collect-user-info");
    } catch (error) {
      console.error('Error checking personal info:', error);
      router.push("/collect-user-info");
    }
  };

  // Enhanced biometric authentication handler
  const handleBiometricAuth = async () => {
    setBiometricLoading(true);
    setError("");

    try {
      // Check if biometric is enabled
      const biometricEnabled = await AsyncStorage.getItem('biometricEnabled');
      if (biometricEnabled !== 'true') {
        showAlert("Info", "Please login manually first to enable biometric login.", "info");
        setBiometricLoading(false);
        return;
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        showAlert("Warning", "Your device does not support biometric authentication or it is not set up.", "warning");
        setBiometricLoading(false);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Authenticate with ${biometricType}`,
        fallbackLabel: 'Enter Passcode',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        // Get stored credentials and login automatically
        const storedEmail = await AsyncStorage.getItem('biometricEmail');
        const storedPassword = await AsyncStorage.getItem('biometricPassword');

        if (storedEmail && storedPassword) {
          try {
            if (!firebaseAuth) {
              throw new Error('Firebase is not properly initialized. Please check your configuration.');
            }

            const userCredential = await signInWithEmailAndPassword(firebaseAuth, storedEmail, storedPassword);
            await storeUserDataInFirestore(userCredential.user, { provider: 'biometric' });
            await AsyncStorage.setItem('isLoggedIn', 'true');
            await AsyncStorage.setItem('userEmail', storedEmail);
            await checkPersonalInfoAndNavigate();
          } catch (error) {
            console.error('Biometric login error:', error);
            let errorMessage = "Biometric login failed. Please try manual login.";

            // Clear invalid stored credentials
            await AsyncStorage.removeItem('biometricEmail');
            await AsyncStorage.removeItem('biometricPassword');
            await AsyncStorage.setItem('biometricEnabled', 'false');
            setBiometricEnabled(false);

            if (error.code === 'auth/user-not-found') {
              errorMessage = "Stored credentials are no longer valid. Please login manually.";
            } else if (error.code === 'auth/wrong-password') {
              errorMessage = "Password has changed. Please login manually.";
            } else if (error.code === 'auth/network-request-failed') {
              errorMessage = "Network error. Please check your internet connection.";
            }

            showAlert("Error", errorMessage, "error");
          }
        } else {
          showAlert("Info", "Please login manually first to enable biometric login.", "info");
        }
      } else if (result.error === 'UserCancel') {
        // User cancelled, do nothing
      } else {
        showAlert("Error", "Biometric authentication was not successful.", "error");
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      showAlert("Error", "An error occurred during biometric authentication.", "error");
    } finally {
      setBiometricLoading(false);
    }
  };

  // Function to disable biometric login
  const disableBiometricLogin = async () => {
    try {
      await AsyncStorage.removeItem('biometricEnabled');
      await AsyncStorage.removeItem('biometricEmail');
      await AsyncStorage.removeItem('biometricPassword');
      await AsyncStorage.removeItem('autoLoginWithBiometric');
      setBiometricEnabled(false);
      showAlert("Success", "Biometric login has been disabled successfully.", "success");
    } catch (error) {
      console.error('Error disabling biometric:', error);
      showAlert("Error", "Failed to disable biometric login.", "error");
    }
  };

  return (
    <AnimatedBackground>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <SafeAreaView style={[styles.container]}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} />
          </View>

          <Text style={styles.welcomeText}>Welcome Back to Your Health Companion</Text>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="email" size={24} color="#fff" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.btnText }]}
                placeholder="Email"
                placeholderTextColor={theme.btnText}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrapper}>
              <MaterialIcons name="lock" size={24} color="#fff" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.btnText }]}
                placeholder="********"
                placeholderTextColor={theme.btnText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {error ? <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text> : null}

            <TouchableOpacity style={styles.signInBtn} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signInBtnText}>Sign in</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('/auth/forgot-password')}>
              <Text style={styles.forgotPasswordText}>Forget Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Enhanced Biometric Section */}
          {biometricAvailable && (
            <View style={styles.biometricContainer}>
              <TouchableOpacity 
                style={[styles.biometricBtn, biometricLoading && styles.biometricBtnLoading]} 
                onPress={handleBiometricAuth}
                disabled={biometricLoading}
              >
                {biometricLoading ? (
                  <ActivityIndicator color="#6B705B" size="large" />
                ) : (
                  <Image source={require('../../assets/bio.png')} style={styles.biometricIcon} />
                )}
              </TouchableOpacity>
              <Text style={styles.biometricText}>
                {biometricLoading ? 'Authenticating...' : `${biometricType} SignIn`}
              </Text>
              {biometricEnabled && (
                <TouchableOpacity onPress={disableBiometricLogin} style={styles.disableBiometricBtn}>
                  <Text style={styles.disableBiometricText}>Disable Biometric</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

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
                {googleLoading ? 'Signing in...' : 'Sign In With Google'}
              </Text>
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <TouchableOpacity style={styles.socialBtn}>
                <FontAwesome name="apple" size={24} color="#6B705B" style={styles.socialIcon} />
                <Text style={styles.socialBtnText}>Sign Up With Apple</Text>
              </TouchableOpacity>
            )}
          </View> */}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't Have Account?{' '}
              <Text style={styles.footerLink} onPress={() => router.push("/auth/signup")}>
                Sign Up
              </Text>
            </Text>
          </View>
        </ScrollView>

        {/* Enhanced Biometric Enable Modal */}
        <Modal
          visible={showBiometricPrompt}
          transparent
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <MaterialIcons name="fingerprint" size={48} color="#6B705B" style={styles.modalIcon} />
              <Text style={styles.modalTitle}>Enable {biometricType} Login?</Text>
              <Text style={styles.modalDescription}>
                Would you like to use your {biometricType.toLowerCase()} to log in faster and more securely next time?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={handleEnableBiometric} style={styles.modalButtonPrimary}>
                  <Text style={styles.modalButtonPrimaryText}>Enable</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSkipBiometric} style={styles.modalButtonSecondary}>
                  <Text style={styles.modalButtonSecondaryText}>Skip</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        
        {/* Custom Alert */}
        <CustomAlert
          visible={alert.visible}
          title={alert.title}
          message={alert.message}
          type={alert.type}
          onClose={hideAlert}
        />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </AnimatedBackground>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingBottom: 40 },
  logoContainer: { alignItems: 'center', marginTop: 10, marginBottom: 10 },
  logo: { width: 200, height: 200, resizeMode: 'contain' },
  welcomeText: { textAlign: 'center', color: '#6B705B', fontSize: 16, marginBottom: 18, fontWeight: '500' },
  form: { gap: 12 },
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
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 6 },
  forgotPasswordText: { color: '#222', fontSize: 14, fontWeight: '500' },
  signInBtn: {
    backgroundColor: '#6B705B',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  signInBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  biometricContainer: { alignItems: 'center', marginVertical: 15 },
  biometricBtn: {
    width: 70,
    height: 70,
    borderRadius: 50,
    backgroundColor: '#A3A38080',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#6B705B',
  },
  biometricBtnLoading: {
    opacity: 0.7,
  },
  biometricIcon: { width: 60, height: 60, resizeMode: 'contain' },
  biometricText: { color: '#6B705B', fontSize: 14, fontWeight: '500', marginTop: 2 },
  disableBiometricBtn: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  disableBiometricText: {
    color: '#999',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  socialContainer: { marginTop: 4, marginBottom: 10 },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#222',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#A3A38080',
  },
  socialBtnDisabled: {
    opacity: 0.6,
  },
  socialIcon: { marginRight: 10 },
  socialBtnText: { color: '#222', fontSize: 16, fontWeight: '500' },
  footer: { alignItems: "center", marginBottom: 6 },
  footerText: { color: "#6B705B", fontSize: 16, textAlign: "center", opacity: 0.9 },
  footerLink: { color: '#6B705B', textDecorationLine: "underline", fontWeight: "bold" },
  // Enhanced Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    width: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#222',
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButtonPrimary: {
    flex: 1,
    backgroundColor: '#6B705B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
});
