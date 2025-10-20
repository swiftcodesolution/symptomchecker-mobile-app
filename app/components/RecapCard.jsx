import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/AntDesign";
import { useTheme } from "../theme/ThemeContext";

const RecapCard = ({ question, hasAnswer, editAnswer, buttonLabel }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.recapCard, { backgroundColor: theme.cardBg || "#e5dfd6" }]}> 
      <View style={styles.leftSection}>
        <View style={[styles.iconCircle, { borderColor: hasAnswer ? '#363A3A' : '#EB2F29', backgroundColor: hasAnswer ? '#F3F3F3' : '#F3F3F3' }]}> 
          <Icon
            name={hasAnswer ? "checksquareo" : "closesquareo"}
            size={22}
            color={hasAnswer ? "#363A3A" : "#EB2F29"}
          />
        </View>
        <Text
          style={[styles.questionText, { color: theme.text }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {hasAnswer ? question : question}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.actionBtn, !hasAnswer && styles.replyBtn]}
        onPress={editAnswer}
      >
        <Text
          style={[styles.actionBtnText, !hasAnswer && styles.replyBtnText]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {buttonLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default RecapCard;

const styles = StyleSheet.create({
  recapCard: {
    width: "100%",
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 18,
    backgroundColor: "#e5dfd6",
    marginBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 2,
  },
  questionText: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F3F3F3',
    borderWidth: 1,
    borderColor: '#363A3A',
    minWidth: 54,
    alignItems: 'center',
    maxWidth: 70,
  },
  actionBtnText: {
    color: '#363A3A',
    fontWeight: '600',
    fontSize: 15,
  },
  replyBtn: {
    borderColor: '#EB2F29',
    backgroundColor: '#F3F3F3',
    // right:0
  },
  replyBtnText: {
    color: '#EB2F29',
  },
});
