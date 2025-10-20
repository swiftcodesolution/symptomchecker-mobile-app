import { Redirect } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { useState, useEffect } from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import { firebaseAuth } from './config/firebase';

export default function Splash() {
  const [showSplash, setShowSplash] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(null); // null = loading
  const [isLoggedIn, setIsLoggedIn] = useState(null); // null = loading
  const [biometricChecked, setBiometricChecked] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(null);
  const [autoLoginTried, setAutoLoginTried] = useState(false);
  const [autoLoginError, setAutoLoginError] = useState(false);

  useEffect(() => {
    const checkStates = async () => {
      try {
        const onboardingValue = await AsyncStorage.getItem('onboarding');
        setOnboardingDone(onboardingValue === 'true');
        const loginValue = await AsyncStorage.getItem('isLoggedIn');
        setIsLoggedIn(loginValue === 'true');
        const biometricFlag = await AsyncStorage.getItem('biometricEnabled');
        setBiometricEnabled(biometricFlag === 'true');
      } catch (e) {
        setOnboardingDone(false);
        setIsLoggedIn(false);
        setBiometricEnabled(false);
      }
    };
    checkStates();
    const timer = setTimeout(() => setShowSplash(false), 2500); // 2.5 seconds
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const doBiometric = async () => {
      if (biometricEnabled) {
        try {
          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();
          if (!hasHardware || !isEnrolled) {
            setBiometricChecked(true);
            setBiometricSuccess(true); // fallback: allow in if no biometrics
            return;
          }
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authenticate with Biometrics',
            fallbackLabel: 'Enter Passcode',
          });
          setBiometricChecked(true);
          setBiometricSuccess(result.success);
        } catch (e) {
          setBiometricChecked(true);
          setBiometricSuccess(false);
        }
      }
    };
    if (biometricEnabled && !showSplash) {
      doBiometric();
    }
  }, [biometricEnabled, showSplash]);

  useEffect(() => {
    // After biometric success, try auto-login
    const tryAutoLogin = async () => {
      if (biometricEnabled && biometricChecked && biometricSuccess && !autoLoginTried) {
        try {
          const email = await AsyncStorage.getItem('biometricEmail');
          const password = await AsyncStorage.getItem('biometricPassword');
          
          if (email && password && firebaseAuth) {
            const { signInWithEmailAndPassword } = await import('firebase/auth');
            await signInWithEmailAndPassword(firebaseAuth, email, password);
            await AsyncStorage.setItem('isLoggedIn', 'true');
            setIsLoggedIn(true);
            setAutoLoginTried(true);
          } else {
            // Clear invalid stored credentials
            await AsyncStorage.removeItem('biometricEmail');
            await AsyncStorage.removeItem('biometricPassword');
            await AsyncStorage.setItem('biometricEnabled', 'false');
            setAutoLoginError(true);
          }
        } catch (e) {
          console.error('Auto login error:', e);
          // Clear invalid stored credentials
          await AsyncStorage.removeItem('biometricEmail');
          await AsyncStorage.removeItem('biometricPassword');
          await AsyncStorage.setItem('biometricEnabled', 'false');
          setAutoLoginError(true);
        }
      }
    };
    tryAutoLogin();
  }, [biometricEnabled, biometricChecked, biometricSuccess, autoLoginTried]);

  if (showSplash || onboardingDone === null || isLoggedIn === null || biometricEnabled === null) {
    return (
      <View style={styles.container}>
        <Image source={require("../assets/logo.png")} style={styles.logo} />
        <Text style={styles.text}>Your Health Companion</Text>
      </View>
    );
  }
  if (!onboardingDone) {
    return <Redirect href="/onboarding" />;
  }
  if (biometricEnabled) {
    if (!biometricChecked) {
      return (
        <View style={styles.container}>
          <Image source={require("../assets/logo.png")} style={styles.logo} />
          <Text style={styles.text}>Authenticating...</Text>
        </View>
      );
    }
    if (biometricChecked && biometricSuccess) {
      if (!autoLoginTried) {
        return (
          <View style={styles.container}>
            <Image source={require("../assets/logo.png")} style={styles.logo} />
            <Text style={styles.text}>Logging in...</Text>
          </View>
        );
      }
      if (autoLoginError) {
        AsyncStorage.setItem('isLoggedIn', 'false');
        return <Redirect href="/auth/login" />;
      }
      return <Redirect href="/check-personal-info" />;
    } else {
      // If biometric fails, clear login and go to login
      AsyncStorage.setItem('isLoggedIn', 'false');
      return <Redirect href="/auth/login" />;
    }
  }
  if (isLoggedIn) {
    // Always go through check-personal-info for proper session restoration
    return <Redirect href="/check-personal-info" />;
  }
  // Not logged in
  return <Redirect href="/auth/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#9CA090", // gradient not possible, use closest solid
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 32,
    resizeMode: "contain",
  },
  text: {
    fontSize: 26,
    color: "#fff",
    fontWeight: "400",
    textAlign: "center",
  },
}); 