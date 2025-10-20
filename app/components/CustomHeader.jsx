import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/Octicons";
import { useTheme } from "../theme/ThemeContext";
import SubText from "./SubText";
import { useNavigation, useRouter } from "expo-router";

const CustomHeader = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const router = useRouter();

  return (
    <View>
      <View style={styles.customHeader}>
        <View style={{ alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={[
              styles.drawerIcon,
              { backgroundColor: theme.onboardingCardBg },
            ]}
          >
            <Icon name="three-bars" size={24} />
          </TouchableOpacity>
          <Text style={{ fontSize: 10, color: theme.text }}>Menu</Text>
        </View>

        <View style={styles.userInfo}>
          <Image
            source={require("../../assets/user.webp")}
            style={styles.image}
          />
        </View>

        <TouchableOpacity
          style={styles.sosBtn}
          onPress={() => {
            router.push("sos");
          }}
        >
          <Text style={styles.sosText}>SOS</Text>
        </TouchableOpacity>
      </View>
      <SubText
        textContent="Hello Scott"
        style={[styles.userName, { color: theme.text }]}
      />
    </View>
  );
};

export default CustomHeader;

const styles = StyleSheet.create({
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  drawerIcon: {
    padding: 10,
    borderRadius: 10,
    width: "20%",
    alignItems: "center",
    justifyContent: "center",
  },

  userInfo: {
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    width: "60%",
  },
  image: {
    width: 90,
    height: 90,
    objectFit: "cover",
    borderRadius: 100,
    boxShadow: "0 10px 20px 6px rgba(0,0,0,0.3)",
  },
  userName: { textAlign: "center" },

  sosBtn: {
    backgroundColor: "#EB2F29",
    padding: 10,
    borderRadius: 10,
    width: "20%",
    alignItems: "center",
    justifyContent: "center",
  },
  sosText: { 
    color: "#fff", 
    fontSize: 18, 
    textAlign: 'center',
    minWidth: 30,
    fontWeight: 'bold',
  },
});
