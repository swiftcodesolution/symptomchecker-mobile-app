import { StyleSheet, Text } from "react-native";
import { useTheme } from "../theme/ThemeContext";

const SubText = ({ textContent, style }) => {
  const { theme } = useTheme();

  return (
    <Text style={[style, styles.subtext, { color: theme.text }]}>
      {textContent}
    </Text>
  );
};

export default SubText;

const styles = StyleSheet.create({
  subtext: { fontSize: 28 },
});
