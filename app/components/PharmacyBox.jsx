import { Image, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";

const PharmacyBox = ({ name, address }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[styles.pharmacyBox, { backgroundColor: theme.onboardingCardBg }]}
    >
      <Image
        source={require("../../assets/pharmacy-logo.png")}
        style={styles.logo}
      />
      <View style={styles.details}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.address}>{address}</Text>
      </View>
    </View>
  );
};

export default PharmacyBox;

const styles = StyleSheet.create({
  pharmacyBox: {
    padding: 16,
    borderRadius: 16,
    width: 200,
    height: 200,
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  logo: { width: 54, height: 54, borderRadius: 12, marginBottom: 20 },

  details: { width: "80%" },

  name: { fontSize: 18, fontWeight: 700, marginBottom: 6 },
  address: { fontSize: 12 },
});
