import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";

const DetailsCard = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.twoColumnBox, { backgroundColor: theme.secondary }]}>
      <View style={styles.tableData}>
        <View style={styles.row}>
          <Text style={styles.cell}>Name</Text>
          <Text style={[styles.cell, styles.wideCell]}>Jake Thompson</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cell}>Contact Number</Text>
          <Text style={[styles.cell, styles.wideCell]}>+1 (555) 238-9410</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cell}>Address</Text>
          <Text style={[styles.cell, styles.wideCell]}>
            742 Evergreen Terrace, Springfield, IL 62704, USA
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cell}>Blood Group</Text>
          <Text
            style={[
              styles.cell,
              styles.wideCell,
              styles.bgCell,
              { backgroundColor: theme.onboardingCardBg },
            ]}
          >
            O+
          </Text>
        </View>
      </View>
    </View>
  );
};

export default DetailsCard;

const styles = StyleSheet.create({
  twoColumnBox: { borderRadius: 16, overflow: "hidden" },

  tableData: {
    gap: 6,
    marginVertical: 6,
    paddingHorizontal: 6,
  },

  row: {
    flexDirection: "row",
    padding: "10",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
  },
  cell: { width: "50%", fontSize: 16, color: "#fff", fontWeight: "700" },
  wideCell: {
    width: "50%",
    fontWeight: "400",
  },
  bgCell: {
    padding: 6,
    color: "#000",
    fontWeight: 700,
    letterSpacing: 2,
    fontSize: 18,
    width: "min-content",
    borderRadius: 6,
  },

  headerCell: { color: "#000" },
});
