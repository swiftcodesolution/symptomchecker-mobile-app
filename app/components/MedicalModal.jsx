import { Image, TouchableOpacity } from "react-native";
import { Modal } from "react-native";
import { StyleSheet, Text, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import TitleText from "../components/TitleText";
import PrimaryButton from "../components/PrimaryButton";
import { useTheme } from "../theme/ThemeContext";

const MedicalModal = ({ visible, onClose }) => {
  const { theme } = useTheme();

  const handlePress = () => {
    onClose();
  };

  return (
    <Modal transparent={true} animationType="slide" visible={visible}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: theme.onboardingCardBg },
          ]}
        >
          <View style={styles.controls}>
            <TouchableOpacity onPress={handlePress}>
              <Icon
                name="chevron-back-circle-outline"
                size={48}
                color={theme.text}
              />
            </TouchableOpacity>
            <View style={styles.metadata}>
              <Text style={styles.category}>Report</Text>
              <Text style={styles.tag}>X-Ray</Text>
              <Text style={styles.date}>22 March, 2025</Text>
              <Text style={styles.time}>7:45 PM</Text>
            </View>
          </View>
          <TitleText title="X Ray Report" />
          <Image
            source={require("../../assets/xray.jpg")}
            style={styles.image}
          />
          <PrimaryButton
            title="Done"
            pressFunction={handlePress}
            style={{ backgroundColor: theme.primaryBtnBg }}
          />
        </View>
      </View>
    </Modal>
  );
};

export default MedicalModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(107, 112, 91, 0.9)",
  },
  modalContent: {
    width: "90%",
    borderRadius: 20,
    padding: 16,
    gap: 20,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metadata: { gap: 6 },
  category: { textAlign: "right" },
  tag: {
    backgroundColor: "#6B705B",
    color: "#fff",
    padding: 6,
    borderRadius: 6,
    textAlign: "center",
  },
  date: { textAlign: "right" },
  time: { textAlign: "right" },
  image: { width: "100%", height: 300, borderRadius: 16 },
});
