import { StyleSheet, Text } from "react-native";
import { useTheme } from "../theme/ThemeContext";

const TitleText = ({ title, style }) => {
  const { theme } = useTheme();

  return (
    <Text style={[style, styles.title, { color: theme.text }]}>{title}</Text>
  );
};

export default TitleText;

const styles = StyleSheet.create({
  title: { fontSize: 42 },
});
