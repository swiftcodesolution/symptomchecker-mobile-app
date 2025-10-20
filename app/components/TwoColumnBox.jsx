import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";

const TwoColumnBox = ({ onRowPress }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.twoColumnBox, { backgroundColor: theme.secondary }]}>
      <View style={styles.tableData}>
        <View
          style={[
            styles.row,
            styles.header,
            { backgroundColor: theme.onboardingCardBg },
          ]}
        >
          <Text style={[styles.cell, styles.wideCell, styles.headerCell]}>
            Name
          </Text>
          <Text style={[styles.cell, styles.headerCell]}>Date</Text>
        </View>

        <TouchableOpacity onPress={onRowPress}>
          <View style={styles.row}>
            <Text style={[styles.cell, styles.wideCell]}>
              X-Rays: MedlinePlus
            </Text>
            <Text style={styles.cell}>2-2-25</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.row}>
          <Text style={[styles.cell, styles.wideCell]}>
            X-Rays: MedlinePlus
          </Text>
          <Text style={styles.cell}>2-2-25</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.cell, styles.wideCell]}>
            X-Rays: MedlinePlus
          </Text>
          <Text style={styles.cell}>2-2-25</Text>
        </View>
      </View>
    </View>
  );
};

export default TwoColumnBox;

const styles = StyleSheet.create({
  twoColumnBox: { borderRadius: 16, overflow: "hidden" },

  tableData: {
    gap: 6,
    marginVertical: 6,
    paddingHorizontal: 6,
    paddingHorizontal: 6,
  },

  row: {
    flexDirection: "row",
    padding: "10",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
  },
  cell: { width: "30%", textAlign: "center", fontSize: 16, color: "#fff" },
  wideCell: {
    width: "70%",
    textAlign: "left",
  },

  headerCell: { color: "#000" },
});
