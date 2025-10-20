import { useEffect } from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CheckPersonalInfo() {
  const router = useRouter();

  useEffect(() => {
    const checkPersonalInfo = async () => {
      try {
        const personalInfo = await AsyncStorage.getItem('personalInfo');
        const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
        const userPersonalInfo = await AsyncStorage.getItem('userPersonalInfo');
        const hasCompletedOnboarding = await AsyncStorage.getItem('onboarding');
        
        console.log('Session restoration check:', {
          personalInfo: !!personalInfo,
          isLoggedIn,
          userPersonalInfo: !!userPersonalInfo,
          hasCompletedOnboarding
        });
        
        // If user is logged in and has completed personal info, go to main app
        if (personalInfo && isLoggedIn === 'true') {
          router.replace("/(main)");
        } 
        // If user is logged in but hasn't completed personal info, check if they've started the process
        else if (isLoggedIn === 'true') {
          // If they have some user personal info or completed onboarding, go to main app
          // This prevents getting stuck on the first question
          if (userPersonalInfo || hasCompletedOnboarding === 'true') {
            console.log('User has partial data, redirecting to main app');
            router.replace("/(main)");
          } else {
            // Only redirect to collect info if they truly haven't started
            console.log('User has no data, redirecting to collect info');
            router.replace("/collect-user-info");
          }
        } 
        // If user is not logged in, go to login
        else {
          router.replace("/auth/login");
        }
      } catch (error) {
        console.error('Error checking personal info:', error);
        // Default to main app if there's an error and user is logged in
        const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
        if (isLoggedIn === 'true') {
          router.replace("/(main)");
        } else {
          router.replace("/auth/login");
        }
      }
    };

    checkPersonalInfo();
  }, []);

  return (
    <View style={styles.container}>
      <Image source={require("../assets/logo.png")} style={styles.logo} />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#9CA090",
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