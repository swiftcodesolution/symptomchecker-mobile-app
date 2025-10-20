import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { useRouter } from "expo-router";
import { useState } from "react";
import PrimaryButton from "../components/PrimaryButton";
import TitleText from "../components/TitleText";
import SubText from "../components/SubText";
import { MaterialIcons } from '@expo/vector-icons';

const ResetPassword = () => {
  const { theme } = useTheme();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleResetPassword = () => {
    router.push("/auth/login");
  };

  return (
    
      <SafeAreaView style={[styles.container]}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.innerContent}>
            <TitleText style={styles.title} title="New Password" />
            <SubText style={styles.text} textContent="Create your new password to Login" />
            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lock" size={22} color={theme.btnText} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.btnText }]}
                  placeholder="New Password"
                  placeholderTextColor={theme.btnText}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={22} color={theme.btnText} />
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lock" size={22} color={theme.btnText} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.btnText }]}
                  placeholder="Confirm Password"
                  placeholderTextColor={theme.btnText}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                  <MaterialIcons name={showConfirmPassword ? "visibility" : "visibility-off"} size={22} color={theme.btnText} />
                </TouchableOpacity>
              </View>
              <PrimaryButton
                title="Reset password"
                pressFunction={handleResetPassword}
                style={[styles.emailBtn, { backgroundColor: theme.primaryBtnBg }]}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    
  );
};

export default ResetPassword;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { 
    flexGrow: 1, 
    padding: 20,
    paddingBottom: 40,
  },
  backBtn: { marginTop: 10, marginBottom: 10, alignSelf: 'flex-start' },
  innerContent: { flex: 1, justifyContent: 'center' },
  title: { textAlign: 'center', fontSize: 38, fontWeight: '400', marginBottom: 20 },
  text: { textAlign: 'center', fontSize: 18, marginBottom: 40 },
  form: { gap: 18 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(107, 112, 91, 0.5)',
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
});
