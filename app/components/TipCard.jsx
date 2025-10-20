import { Image, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";

const TipCard = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.tipCard, { backgroundColor: theme.secondary }]}>
      <Text style={styles.text}>
        A crucial first aid tip is to ensure your own safety before approaching
        an their
      </Text>
      <Image source={require("../../assets/cover.jpg")} style={styles.image} />
    </View>
  );
};

export default TipCard;

const styles = StyleSheet.create({
  tipCard: {
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
  },
  text: { fontSize: 16, color: "#fff", width: "60%" },
  image: {
    width: 100,
    height: 100,
    objectFit: "cover",
    borderRadius: 12,
    backgroundColor: "red",
  },
});
