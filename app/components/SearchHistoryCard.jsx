import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useTheme } from "../theme/ThemeContext";

const SearchHistoryCard = ({ searchText, date, time }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.searchHistoryCard, { backgroundColor: theme.secondary }]}
    >
      <Text style={styles.searchText}>{searchText}</Text>
      <View style={styles.metaData}>
        <Text style={[styles.metaDataText, { color: theme.text }]}>{date}</Text>
        <Text style={[styles.metaDataText, { color: theme.text }]}>{time}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default SearchHistoryCard;

const styles = StyleSheet.create({
  searchHistoryCard: {
    padding: 20,
    borderRadius: 24,
    flexDirection: "row",
    gap: 10,
  },
  searchText: { flex: 1, color: "#fff" },
  metaData: { width: "30%", gap: 6 },
  metaDataText: { fontSize: 12, textAlign: "right" },
});
