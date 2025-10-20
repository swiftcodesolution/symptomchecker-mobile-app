import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";

const PrimaryButton = ({ pressFunction, title, style, textColor, icon }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity onPress={pressFunction} style={[style, styles.btn]}>
      <View style={styles.contentRow}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <Text style={[styles.btnText, { color: textColor || theme.btnText }]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default PrimaryButton;

const styles = StyleSheet.create({
  btn: {
    borderRadius: 24,
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: 12,
  },
  btnText: { letterSpacing: 2 },
});
