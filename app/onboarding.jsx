import { StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "./theme/ThemeContext";
import { useState } from "react";
import OnboardingCard from "./components/OnboardingCard";
import { useRouter } from "expo-router";
import AnimatedBackground from "./components/AnimatedBackground";
import AsyncStorage from '@react-native-async-storage/async-storage';

const onboardingData = [
  {
    title: "Welcome To Your Health Companion",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    bottomText: "Lorem ipsum dolor sit amet, consectetur",
  },
  {
    title: "Welcome To Your Health Companion",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    bottomText: "Lorem ipsum dolor sit amet, consectetur",
  },
  {
    title: "Welcome To Your Health Companion",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    bottomText: "Lorem ipsum dolor sit amet, consectetur",
  },
];

const Onboarding = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { theme } = useTheme();
  const router = useRouter();

  const handlePressNext = async () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      await AsyncStorage.setItem('onboarding', 'true');
      router.push("/auth");
    }
  };

  const handlePressSkip = async () => {
    await AsyncStorage.setItem('onboarding', 'true');
    router.push("/auth");
  };

  return (
    <AnimatedBackground>
      <SafeAreaView
        style={[styles.container, { backgroundColor: 'transparent' }]}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <OnboardingCard
            title={onboardingData[currentIndex].title}
            text={onboardingData[currentIndex].text}
            bottomText={onboardingData[currentIndex].bottomText}
            handlePressNext={handlePressNext}
            handlePressSkip={handlePressSkip}
            activeIndex={currentIndex}
            totalScreens={onboardingData.length}
          />
        </ScrollView>
      </SafeAreaView>
    </AnimatedBackground>
  );
};

export default Onboarding;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { 
    flexGrow: 1, 
    justifyContent: "flex-end", 
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});
