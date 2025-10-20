import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";

const ThreeColumnBox = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.threeColumnBox, { backgroundColor: theme.secondary }]}>
      <View style={styles.tableData}>
        <View
          style={[
            styles.row,
            styles.header,
            { backgroundColor: theme.onboardingCardBg },
          ]}
        >
          <Text style={[styles.cell, styles.headerCell, styles.firstCell]}>
            Name
          </Text>
          <Text style={[styles.cell, styles.headerCell]}>Dosage</Text>
          <Text style={[styles.cell, styles.headerCell]}>Frequency</Text>
        </View>

        <View style={styles.row}>
          <Text style={[styles.cell, styles.firstCell]}>Flagel</Text>
          <Text style={styles.cell}>200ml</Text>
          <Text style={styles.cell}>2</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.cell, styles.firstCell]}>Flagel</Text>
          <Text style={styles.cell}>200ml</Text>
          <Text style={styles.cell}>2</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.cell, styles.firstCell]}>Flagel</Text>
          <Text style={styles.cell}>200ml</Text>
          <Text style={styles.cell}>2</Text>
        </View>
      </View>
    </View>
  );
};

export default ThreeColumnBox;

const styles = StyleSheet.create({
  threeColumnBox: { borderRadius: 16, overflow: "hidden" },

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
  cell: { width: "33%", textAlign: "center", fontSize: 16, color: "#fff" },
  firstCell: { textAlign: "left" },

  headerCell: { color: "#000" },
});
