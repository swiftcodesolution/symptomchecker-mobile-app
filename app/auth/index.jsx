import { StyleSheet, Text, TouchableOpacity, View, Image, ScrollView, Platform } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import PrimaryButton from "../components/PrimaryButton";
import TitleText from "../components/TitleText";
import SubText from "../components/SubText";
import AnimatedBackground from "../components/AnimatedBackground";
import { MaterialIcons, AntDesign, FontAwesome } from '@expo/vector-icons';

const AuthMain = () => {
  const { theme } = useTheme();
  const router = useRouter();

  const handleEmailSignUp = () => {
    router.push("auth/signup");
  };

  const handleSocialSignUp = () => {
    router.push("auth/signup-success");
  };

  return (
    <AnimatedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>  
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.innerContent}>
            <Image source={require("../../assets/logo.png")} style={styles.logo} />
            <TitleText style={styles.title} title="Let's Get Started" />
            <Text style={styles.subtitle}>Your Journey to Better{"\n"}Health Starts Here</Text>
            <PrimaryButton
              title="Sign Up With Email"
              pressFunction={handleEmailSignUp}
              style={[styles.emailBtn, { backgroundColor: '#6B705B' }]}
              textColor="#fff"
              icon={<MaterialIcons name="email" size={28} color="#fff" />}
            />
            {/* <Text style={styles.orText}>Or Use Instant Sign Up</Text>
            <PrimaryButton
              title="Sign Up With Google"
              pressFunction={handleSocialSignUp}
              style={styles.socialBtn}
              textColor="#363A3A"
              icon={<AntDesign name="google" size={28} color="#6B705B" />}
            />
            {Platform.OS === 'ios' && (
              <PrimaryButton
                title="Sign Up With Apple"
                pressFunction={handleSocialSignUp}
                style={styles.socialBtn}
                textColor="#363A3A"
                icon={<FontAwesome name="apple" size={28} color="#6B705B" />}
              />
            )} */}
          </View>
        </ScrollView>
        <TouchableOpacity
          style={styles.loginPrompt}
          onPress={() => router.push("/auth/login")}
        >
          <Text style={styles.loginText}>
            Already Have an Account? <Text style={styles.loginLink}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </AnimatedBackground>
  );
};

export default AuthMain;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingBottom: 40,
  },
  innerContent: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 30,
    resizeMode: 'contain',
    borderRadius: 24,
  },
  title: {
    textAlign: "center",
    fontSize: 38,
    fontWeight: '400',
    marginBottom: 10,
    color: '#363A3A',
  },
  subtitle: {
    textAlign: 'center',
    color: '#2B4B6F',
    fontSize: 28,
    fontWeight: '400',
    marginBottom: 40,
    marginTop: 0,
    lineHeight: 34,
  },
  emailBtn: {
    width: '100%',
    borderRadius: 28,
    marginBottom: 30,
    paddingVertical: 20,
  },
  orText: {
    fontSize: 18,
    color: '#363A3A',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '400',
  },
  socialBtn: {
    width: '100%',
    borderRadius: 28,
    marginBottom: 18,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#363A3A',
    paddingVertical: 20,
  },
  loginPrompt: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  loginText: {
    color: '#363A3A',
    fontSize: 18,
    textAlign: 'center',
    opacity: 0.9,
  },
  loginLink: {
    color: '#363A3A',
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
});
