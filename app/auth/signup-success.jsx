import { Image, StyleSheet, View, Text, Dimensions, ScrollView } from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import AnimatedBackground from "../components/AnimatedBackground";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SignupSuccess = () => {
  const router = useRouter();

  const handleSubmit = () => {
    router.push("/collect-user-info");
  };

  return (
    <AnimatedBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.centeredContent}>
            <View style={styles.successCard}>
              <Image
                source={require("../../assets/success_icon.png")}
                style={styles.image}
              />
              <Text style={styles.title}>Signup Sucess!</Text>
              <Text style={styles.text}>Congratulations, Your account is registered</Text>
              <PrimaryButton
                title="Let's Go"
                pressFunction={handleSubmit}
                style={styles.submitBtn}
                textColor="#fff"
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AnimatedBackground>
  );
};

export default SignupSuccess;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { 
    flexGrow: 1, 
    paddingBottom: 40,
  },
  centeredContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
  },
  successCard: {
    width: '90%',
    alignSelf: 'center',
    maxWidth: 420,
    borderRadius: 40,
    paddingVertical: 60,
    paddingHorizontal: 36,
    alignItems: "center",
    backgroundColor: "#9b9e8c", // greenish-grey card
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 8,
  },
  image: {
    width: 100,
    height: 100,
    resizeMode: "contain",
    marginBottom: 32,
  },
  title: {
    textAlign: "center",
    fontSize: 40,
    fontWeight: "400",
    marginBottom: 24,
    color: "#222", // black text
    letterSpacing: 0.2,
  },
  text: {
    textAlign: "center",
    fontSize: 28,
    color: "#222", // black text
    marginBottom: 40,
    fontWeight: "300",
    letterSpacing: 0.1,
  },
  submitBtn: {
    borderRadius: 28,
    paddingVertical: 22,
    width: "100%",
    backgroundColor: "#7b7e6a", // button color
    marginTop: 10,
  },
});
