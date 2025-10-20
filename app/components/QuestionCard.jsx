import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";
import ProgressDots from "./ProgressDots";
import Icon from "react-native-vector-icons/Feather";

const QuestionCard = ({
  question,
  userAnswer,
  activeIndex,
  totalQuestions,
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[styles.questionCard, { backgroundColor: theme.onboardingCardBg }]}
    >
      <ProgressDots
        style={styles.progressDots}
        activeIndex={activeIndex}
        totalScreens={totalQuestions}
      />
      <Text style={styles.questionNumber}>{activeIndex + 1}</Text>

      <Text style={[styles.cardTitle, { color: theme.text }]}>{question}</Text>
      <Text style={[styles.cardText, { color: theme.text }]}>{userAnswer}</Text>

      <View style={styles.inputTray}>
        <View style={styles.textInputBox}>
          <TextInput
            style={[styles.input, { color: theme.btnText }]}
            value={""}
            onChangeText={""}
            placeholder="Type your answer"
            placeholderTextColor={theme.btnText}
          />
          <TouchableOpacity
            style={[
              styles.submitBtn,
              { color: theme.btnText, backgroundColor: theme.primaryBtnBg },
            ]}
          >
            <Icon name="send" size={32} color={theme.btnText} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[
            styles.submitBtn,
            { color: theme.btnText, backgroundColor: theme.primaryBtnBg },
          ]}
        >
          <Icon name="mic" size={32} color={theme.btnText} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default QuestionCard;

const styles = StyleSheet.create({
  questionCard: {
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  progressDots: { marginBottom: 22 },
  cardTitle: { fontSize: 28, marginBottom: 12 },
  cardText: { fontSize: 20, marginBottom: 42 },

  inputTray: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
  },
  textInputBox: {
    flexDirection: "row",
    flexGrow: 1,
    backgroundColor: "rgba(107, 112, 91, 0.5)",
    padding: 10,
    borderRadius: 40,
    width: "60%",
  },
  input: { flexGrow: 1 },
  submitBtn: { padding: 10, borderRadius: 36 },
});
