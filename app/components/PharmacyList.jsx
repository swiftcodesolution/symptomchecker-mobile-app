import { FlatList, StyleSheet, Text, View } from "react-native";
import PharmacyBox from "./PharmacyBox";
import { useTheme } from "../theme/ThemeContext";

const pharmacies = [
  {
    id: "1",
    name: "GreenLeaf Pharmacy",
    address: "215 Maplewood Drive, Austin, TX 78745, USA",
  },
  {
    id: "2",
    name: "WellCare Drugs",
    address: "1023 Elm Street, Denver, CO 80220, USA",
  },
  {
    id: "3",
    name: "Sunrise Pharmacy",
    address: "89 Ocean Avenue, San Diego, CA 92109, USA",
  },
  {
    id: "4",
    name: "HealthHub Pharmacy",
    address: "458 Pinecrest Lane, Orlando, FL 32801, USA",
  },
];

const PharmacyList = () => {
  const { theme } = useTheme();

  return (
    <View>
      <FlatList
        data={pharmacies}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PharmacyBox name={item.name} address={item.address} />
        )}
        horizontal={true}
        contentContainerStyle={styles.pharmacyListInner}
        style={[styles.pharmacyListBox, { backgroundColor: theme.secondary }]}
      />
    </View>
  );
};

export default PharmacyList;

const styles = StyleSheet.create({
  pharmacyListBox: { padding: 10, borderRadius: 16 },
  pharmacyListInner: { gap: 10 },
});
