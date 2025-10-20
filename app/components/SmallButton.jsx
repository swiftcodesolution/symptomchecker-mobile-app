import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";

const SmallButton = ({ btnText, pressFunction }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.smallBtn, { backgroundColor: theme.primary }]}
      onPress={pressFunction}
    >
      <Text style={styles.smallBtnText}>{btnText}</Text>
    </TouchableOpacity>
  );
};

export default SmallButton;

const styles = StyleSheet.create({
  smallBtn: { padding: 10, borderRadius: 6 },
  smallBtnText: {
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "700",
    color: "#fff",
  },
});
