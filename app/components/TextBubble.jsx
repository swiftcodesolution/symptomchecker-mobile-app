import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";

const TextBubble = ({ message }) => {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.textBubble,
        message.sender === "ai"
          ? [styles.aiTextBubble, { backgroundColor: theme.onboardingCardBg }]
          : [styles.userTextBubble, { backgroundColor: theme.secondary }],
      ]}
    >
      <Text style={styles.messageText}>{message.message}</Text>
    </View>
  );
};

export default TextBubble;

const styles = StyleSheet.create({
  textBubble: { padding: 15, borderRadius: 16, width: "70%" },
  aiTextBubble: { marginRight: "auto" },
  userTextBubble: { marginLeft: "auto" },
  messageText: { fontSize: 16 },
});
